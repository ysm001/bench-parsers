'use strict';

const fs = require('fs');
const exec = require('child_process').exec;
const config = require('../config/directory.json').development;

const LogType = require('./log-type.js');
const LogPath = require('./log-path.js');
const co = require('co');
const foreach = require('co-foreach');
const wait = require('co-wait');

module.exports = class ParserExecuter {
  static get interval() { return 500; }

  static exec(jobName, buildNumber, type) {
    return LogPath.getLogDirs(jobName, buildNumber, type).then((logDirs) => {
      return ParserExecuter.execParser(type, logDirs);
    });
  }

  static execAll(jenkinsJobName, jenkinsBuildNumber) {
    let result = {};

    return foreach(LogType.all, function *(type) {
      yield wait(ParserExecuter.interval);
      result[type] = JSON.parse(yield ParserExecuter.exec(jenkinsJobName, jenkinsBuildNumber, type));
    }).then(() => {
      return result;
    });
  }

  static execParser(type, targets) {
    const query = ParserExecuter.makeQuery(type, targets);

    console.log(query);
    return new Promise((resolve, reject) => {
      exec(query, (error, stdout, stderr) => {
        if (error !== null) return reject(error);
        if (stderr) console.log(stderr);
        if (stdout) resolve(stdout);
      })
    });
  }

  static makeQuery(type, targets) {
    const parserName = type.split('-')[0];
    const isNetPerf = parserName == 'netperf';
    const ext = isNetPerf ? '.py' : '.rb';
    const runtime = isNetPerf ? 'python' : 'ruby';
    const parser = `scripts/parsers/${parserName}${ext}`;
    const args = ParserExecuter.makeArgs(type, targets, isNetPerf);

    return `${runtime} ${parser} ${args}`;
  }

  static makeArgs(type, targets, isNetPerf) {
    if (!isNetPerf) {
      const oldLog = targets[0];
      const newLog = targets[1];
      
      return `${oldLog} ${newLog}`;
    } else {
      return targets[0].split("/").reverse().slice(1).reverse().join("/");
    }
  }
}
