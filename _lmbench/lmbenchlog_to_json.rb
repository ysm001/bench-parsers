#! /usr/bin/env ruby

require 'find'
require 'json'
require 'pp'

class MatchData
  def to_h
    Hash[names.map(&:to_sym).zip(captures)]
  end
end

class LmBenchLogParser
  def self.parse(file_path)
    content = File.open(file_path).read
    results = split_to_block(content).map { |b| parse_block(b) }.compact.reject(&:empty?).flatten
    flatten_result(merge_sametype_result(results))
  end

  def self.parse_block(block)
    parse_process_block(block) ||
      parse_memory_block(block) ||
      parse_mmap_block(block) ||
      parse_context_switch_block(block)
  end

  def self.parse_memory_block(block)
    block.match(%r{(?<name>\w+)\s?faults?[^:]*: (?<latency>[\d|\.]+) microseconds}) do |result|
      make_parse_result(:memory, "#{result[:name].downcase}_fault" => result[:latency])
    end
  end

  def self.parse_process_block(block)
    results = block.scan(%r{Process fork\+([\w|\/]+)[^:]*: ([\d|\.]+) microseconds}).to_h
    make_parse_result(:process, results)
  end
  
  def self.parse_mmap_block(block)
    return unless block.lines.first.include? '"mappings'

    results = block.each_line.map do |line|
      /[\d|\.]+ (?<latency>[\d|\.]+)/.match(line, &:to_h)
    end.compact.last[:latency]

    make_parse_result(:memory, { mmap: results } )
  end

  def self.parse_context_switch_block(block)
    block.each_line('"').map do |sub_block|
      header = /size=(?<size>\d+)k ovr=[\d|\.]+/.match(sub_block.lines.first)
      next unless header

      results = sub_block.scan(/(\d+) ([\d|\.]+)/).each_with_object({}) do |(proc_num, time), h|
        h["#{proc_num}p/#{header[:size]}K"] = time
      end

      make_parse_result(:context_switch, results)
    end.compact
  end

  def self.split_to_block(content)
    block_header_reg = /\[[^\]]*?\]/
    block_reg = /^(#{block_header_reg})([^\[]*)(\n\n)?$/m
    content.scan(block_reg).map { |_h, b| b.gsub(/^\n+/, '') }.reject(&:empty?)
  end

  def self.make_parse_result(type, value)
    value.nil? || value.empty? ? nil : { type: type, value: value }
  end

  def self.merge_sametype_result(results)
    initial_hash = results.map { |r| [r[:type], []] }.to_h
    results.each_with_object(initial_hash) { |r, h| h[r[:type]].push(r[:value]) }
  end

  def self.flatten_result(results)
    results.each_with_object({}) { |(k, v), h| h[k] = Hash[*v.to_a.map(&:to_a).flatten] }
  end
end

class LmBenchLogPath
  def self.onoff_status(file_path)
    status_str = File.basename(File.dirname(file_path))
    status = kvm_onoff_status(status_str)
    status = bare_onoff_status(status_str) if status.empty?
    "#{status[:host]}" + (status[:guest] ? "/#{status[:guest]}" : '')
  end

  def self.bare_onoff_status(status_str)
    /THP_(?<host>(ON|OFF))/.match(status_str).to_h
  end

  def self.kvm_onoff_status(status_str)
    /THP_Host(?<host>(ON|OFF))_Guest(?<guest>(ON|OFF))/.match(status_str).to_h
  end
end

class LmBenchLogLoader
  def self.load(base_dir)
    results = log_files(base_dir).each_with_object({}) do |l, h|
      onoff_status = LmBenchLogPath.onoff_status(l)
      h[onoff_status] = (h[onoff_status] || []) + [LmBenchLogParser.parse(l)]
    end

    averate(results)
  end

  def self.log_files(base_dir)
    Find.find(base_dir).select { |f| FileTest.file?(f) && /[\w|\d|-]+.kern.oss.ntt.co.jp.\d+/ =~ f }
  end

  def self.averate(results) 
    results.each_with_object({}) do |(onoff_status, result), h|
      h[onoff_status] = {
        average: LmBenchLogAggregator.average(result),
        value: result
      }
    end
  end
end

class LmBenchLogAggregator
  def self.average(logs)
    groups = group(logs)
    groups.each_with_object({}) { |(k, g), h| h[k] = group_average(g) }
  end

  def self.group(logs)
    logs.each_with_object({}) do |values, h|
      values.each do |type, times|
        h[type] = (h[type] || []) + [times]
      end
    end
  end

  def self.group_average(group)
    group.each_with_object({}) do |hash, ave|
      hash.each { |k, v| ave[k] = (ave[k] || 0) + v.to_f / group.size }
    end
  end
end

class LmBenchLogComparator
  def self.compare(old_logs, new_logs)
    merge(old_logs, new_logs)
  end

  def self.merge(old_logs, new_logs)
    old_logs.each_with_object({}) do |(col_name, col_values), h|
      h[col_name] ||= {}
      col_values.each do |raw_name, raw_value|
        h[col_name][raw_name] = raw_value.merge(new_logs[col_name][raw_name]);
      end
    end
  end
end

class LmBenchLogFormatter
  def self.format(logs)
    logs.each_with_object({}) do |(onoff, v), h|
      v[:average].each do |col_name, col_values|
        h[col_name] ||= {}
        col_values.each do |raw_name, raw_value|
          h[col_name][raw_name] ||= {}
          h[col_name][raw_name][onoff] = raw_value
        end
      end
    end
  end
end

old_file = ARGV[0]
new_file = ARGV[1]

if !old_file.nil? && new_file.nil?
  print LmBenchLogFormatter.format(LmBenchLogLoader.load(old_file)).to_json
elsif !old_file.nil? && !new_file.nil?
  print LmBenchLogComparator.compare(LmBenchLogFormatter.format(LmBenchLogLoader.load(old_file)), LmBenchLogFormatter.format(LmBenchLogLoader.load(new_file))).to_json
else
  print_usage_and_exit
end
