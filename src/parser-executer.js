'use strict';

const fs = require('fs');
const exec = require('child_process').exec;
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

const LogPath = require('./log-path.js');

module.exports = class ParserExecuter {
  static exec(jobName, buildNumber, type, singleOrMulti) {
    return LogPath.getLogDirs(jobName, buildNumber, type, singleOrMulti).then((logDirs) => {
      return ParserExecuter.execParser(type, logDirs);
    });
  }

  static execParser(type, targets) {
    const isNetPerf = type == 'netperf';
    const ext = isNetPerf ? '.py' : '.rb';
    const runtime = isNetPerf ? 'python' : 'ruby';
    const parser = `scripts/parsers/${type}${ext}`;
    const oldLog = targets[0];
    const newLog = targets[1];
    const query = !isNetPerf ? `${runtime} ${parser} ${oldLog} ${newLog}` : `${runtime} ${parser} ${targets[0]}`;

    console.log(query);
    return new Promise((resolve, reject) => {
      exec(query, function (error, stdout, stderr) {
        if (error !== null) return reject(error);
        if (stderr) console.log(stderr);
        if (stdout) resolve(stdout);
      })
    });
  }
}
