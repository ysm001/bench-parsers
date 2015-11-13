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
    blocks = filter_blocks(split_to_block(content))
    flatten_result(blocks.map { |block| { block[:title] => parse_block(block) } })
  end

  def self.split_to_block(content)
    better_regex = /( - (bigger|smaller) is better)/
    unit_regex = %r{(( -)? (\w+) in ([\w|/]+))}
    title_regex = /([^\n]+?)/

    content.scan(/#{title_regex}#{unit_regex}?#{better_regex}?\n(.+?)\n\n/m).map do |block|
      {
        title: block[0].strip,
        label: block[3],
        unit: block[4],
        better: block[6],
        body: block[7]
      }
    end
  end

  def self.parse_block(block)
    column_ranges = column_ranges(block)
    headers = parse_header(block, column_ranges)
    values = parse_body(block, column_ranges);

    results = headers.map.with_index do |header, i|
      { header => values.map { |value| value[i] }}
    end

    merged_results = results.each_with_object({}) { |result, h| result.each { |k, v| h[k] = v } }
    filter_result(merged_results)
  end

  def self.parse_header(block, column_ranges)
    header_top_regex = /-+\n/
    header_bottom_regex = /(-+ )+-+\s+/
    header_lines = block[:body].match(/#{header_top_regex}(?<header_body>.+?)#{header_bottom_regex}/m) do |match|
      print match[:header_body]
      pp multi_columns(block, match[:header_body].lines)
      match[:header_body].lines.map do |line|
        column_ranges.map { |range| line.slice(range) }.compact.map(&:strip)
      end
    end

    header_lines.inject { |a, e| a.zip(e) }.map { |line| line.flatten.join(' ').strip }.select { |line| line != '' }
  end

  def self.parse_body(block, column_ranges)
    header_bottom_regex = /(-+ )+-+\s+/
    body_lines = block[:body].match(/#{header_bottom_regex}(?<body>.+)/m) do |match|
      match[:body].lines.map { |line| column_ranges.map { |range| line.slice(range) }.compact.map(&:strip) }
    end
  end

  def self.filter_blocks(blocks)
    blocks.select { |block| !block[:title].include?('L M B E N C H') }
  end

  def self.filter_result(result)
    ignores = %w(Host OS Description Mhz)

    result.keys.select { |key| !ignores.include?(key) }.each_with_object({}) { |k, h| h[k] = result[k] }
  end

  def self.flatten_result(result)
    result.each_with_object({}) do |blocks, h|
      blocks.each { |k, v| h[k] = v }
    end
  end

  def self.column_ranges(block)
    (block[:body]).match(/(-+ )+-+\s+/) do |match|
      header_bottom = match[0]
      spaces = [-1] + (0...header_bottom.length).find_all { |i| header_bottom[i] == ' ' } + [header_bottom.length - 1]
      spaces.map.with_index { |val, idx| (spaces[idx] + 1..spaces[idx + 1] - 1) unless spaces[idx + 1].nil? }.compact
    end
  end

  def self.multi_columns(block, header_lines)
    (block[:body]).match(/(-+ )+-+\s+/) do |match|
      header_bottom = match[0]
      spaces = (0...header_bottom.length).find_all { |i| header_bottom[i] == ' ' }

      spaces.select { |space| !(/\s/ =~ header_lines.first[space]) }.map do |space|
        multi_column_index = spaces.index(space)
        (multi_column_index..multi_column_index + 1)
      end
    end
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
    old_logs.each_with_object({}) do |(title, key_values), block|
      block[title] = key_values.each_with_object({}) do |(key, old_values), h|
        h[key] = new_logs[title][key].map.with_index do |new_value, idx|
          old_value = old_values[idx]
          {
            old: old_value,
            new: new_value,
            ratio: new_value.to_f / old_value.to_f
          }
        end
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

old_logs = LmBenchLogParser.parse(old_file)
new_logs = LmBenchLogParser.parse(new_file)

pp LmBenchLogComparator.compare(old_logs, new_logs)

# if !old_file.nil? && new_file.nil?
#   print LmBenchLogFormatter.format(LmBenchLogLoader.load(old_file)).to_json
# elsif !old_file.nil? && !new_file.nil?
#   print LmBenchLogComparator.compare(LmBenchLogFormatter.format(LmBenchLogLoader.load(old_file)), LmBenchLogFormatter.format(LmBenchLogLoader.load(new_file))).to_json
# else
#   print_usage_and_exit
# end
