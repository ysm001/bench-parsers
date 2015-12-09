'use strict';

const fs = require('fs');
const path = require('path');
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

module.exports = class LogPath {
  static getLogDirs(jobName, buildNumber, type, singleOrMulti) {
    if (LogPath.isNetPerf(type)) {
      return LogPath.getNetPerfLogDir(jobName, buildNumber, type, singleOrMulti);
    }

    const logsPath = `${config.logsDir}/${jobName}-${buildNumber}/${type}`;
    return LogPath.getDirs(logsPath);
  }

  static getDirs(logsPath) {
    return new Promise((resolve, reject) => {
      fs.readdir(logsPath, (err, files) => {
        if (err) return reject(err);

        const dirs = files.map((file) => {
          return path.join(logsPath, file);
        }).filter((file) => {
          return fs.statSync(file).isDirectory();
        });

        resolve(dirs);
      })
    });
  }

  static getNetPerfLogDir(jobName, buildNumber, type, singleOrMulti) {
    return new Promise((resolve, reject) => { resolve([`${config.logsDir}/${jobName}-${buildNumber}/${type}/${singleOrMulti}`]) });
  }

  static isNetPerf(type) {
    return type == 'netperf';
  }
}
