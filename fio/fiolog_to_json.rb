#! /usr/bin/env ruby

require 'find'
require 'json'

class FioLogParser
  def self.parse(file_name)
    file = File.open(file_name)
    block_size = FioLogPath.block_size(file)
    operation = File.basename(file_name, '.log')

    parse_throughputs(file).map { |k, v| {
      block_size: block_size,
      operation: operation,
      thread_num: k,
      throughput: v
    } }
  end

  private_class_method
  def self.parse_throughputs(file)
    regex = %r{[WRITE|READ]:io=([\d|\.]+)MB,aggrb=(?<aggrb>\d+)KB/s,minb=(\d+)KB/s,maxb=(\d+)KB/s,mint=(\d+)msec,maxt=(\d+)msec}
    file.read.each_line
      .map { |line| line.gsub(/\s/, '').match(regex) }.compact
      .map.with_index.each_with_object({}) { |(m, i), h| h[2**i] = m[:aggrb] }
  end
end

class FioLogPath
  def self.block_size(file_path)
    File.basename(File.dirname(file_path)).to_i
  end

  def self.arch(file_path)
    File.basename(File.dirname(File.dirname(file_path)))
  end
end

class FioLogLoader
  def self.load(base_dir)
    log_files(base_dir).map { |l| FioLogParser.parse(l) }.flatten
  end

  private_class_method
  def self.log_files(base_dir)
    Find.find(base_dir).select { |f| FileTest.file?(f) && /\w+.log/ =~ f }
  end

  def self.group_by(logs)
    FioLogFormatter.group_by(logs)
  end
end

class FioLogFormatter
  def self.group_by(logs)
    logs.group_by { |l| l[:operation] }
      .each_with_object({}) { |(op, v), h| h[op] = group_by_thread_num(v) }
  end

  def self.group_by_thread_num(log)
    log.group_by { |l| l[:thread_num] }.map { |t, v| { thread_num: t, throughputs: extract_throughput(v) } }
  end

  def self.extract_throughput(log)
    log.map { |l| l[:throughput] }.sort_by { |t| t[:block_size] }
  end
end

class FioLogComparator
  def self.compare(old_logs, new_logs)
    old_logs.map do |old_log|
      new_log = new_logs.find { |n| same?(old_log, n) }
      diff(old_log, new_log)
    end
  end

  private_class_method
  def self.diff(old_log, new_log)
    old_throughput = old_log[:throughput]
    new_throughput = new_log[:throughput]

    {
      block_size: old_log[:block_size],
      thread_num: old_log[:thread_num],
      operation: old_log[:operation],
      throughput: {
        block_size: old_log[:block_size],
        old: old_throughput,
        new: new_throughput,
        ratio: ((new_throughput.to_f / old_throughput.to_f) - 1.0) * 100
      }
    }
  end

  def self.same?(old_log, new_log)
    old_log[:block_size] == new_log[:block_size] &&
      old_log[:operation] == new_log[:operation] &&
      old_log[:thread_num] == new_log[:thread_num]
  end
end

def print_usage_and_exit
  print "[Usage] ruby #{__FILE__} log_dir_path1 [log_dir_path2]"
  exit
end

old_file = ARGV[0]
new_file = ARGV[1]

if !old_file.nil? && new_file.nil?
  print FioLogFormatter.group_by(FioLogLoader.load(old_file)).to_json
elsif !old_file.nil? && !new_file.nil?
  print FioLogFormatter.group_by(FioLogComparator.compare(FioLogLoader.load(old_file), FioLogLoader.load(new_file))).to_json
else
  print_usage_and_exit
end
