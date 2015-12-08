require 'webrick'
require 'pp'

class ParserPath
  PARSERS_DIR_PATH = 'src/parsers'.freeze

  NETPERF   = 'netperf'.freeze
  KERNBENCH = 'kernbench'.freeze
  LMBENCH   = 'lmbench'.freeze
  FIO       = 'fio'.freeze

  def self.ext(type)
    type == NETPERF ? '.py' : '.rb'
  end

  def self.path(type)
    "#{PARSERS_DIR_PATH}/#{type}#{ext(type)}"
  end
end

class LogPath
  LOGS_DIR_PATH = 'data/logs'.freeze

  def self.path(type, job_name, build_number)
    dir = "#{LOGS_DIR_PATH}/#{job_name}-#{build_number}/#{type}"
    Dir.glob("#{dir}/*/").map { |sub_dir| "#{dir}/#{sub_dir}" }
  end
end

class LogLoader
  def self.load(type, job_name, build_number)
  end
end

class Server
end

server = WEBrick::HTTPServer.new({ :DocumentRoot => './',
                                :BindAddress => '127.0.0.1',
                                :Port => 20080})
server.mount_proc('/netperf.json') do |req, res| 
  params = Hash[URI::decode_www_form(req.request_uri.query)]
  pp LogPath.path('kernbench', params['jobname'], params['buildnumber'])
  res.body ='netperf'
end
trap("INT"){ server.shutdown }
server.start
