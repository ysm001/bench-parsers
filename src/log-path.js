'use strict';

const fs = require('fs');
const PromiseDir = require('../libs/promise-dir.js');
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

module.exports = class LogPath {
  static getLogDirs(jobName, buildNumber, type, singleOrMulti) {
    if (LogPath.isNetPerf(type)) {
      return LogPath.getNetPerfLogDir(jobName, buildNumber, type, singleOrMulti);
    }

    const logsPath = `${config.logsDir}/${jobName}/${buildNumber}/${type}`;
    return PromiseDir.getDirs(logsPath);
  }

  static getNetPerfLogDir(jobName, buildNumber, type, singleOrMulti) {
    return new Promise((resolve, reject) => { resolve([`${config.logsDir}/${jobName}/${buildNumber}/${type}/${singleOrMulti}`]) });
  }

  static isNetPerf(type) {
    return type == 'netperf';
  }
}
