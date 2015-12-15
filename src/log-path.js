'use strict';

const fs = require('fs');
const PromiseDir = require('../libs/promise-dir.js');
const config = require('../config/directory.json');

module.exports = class LogPath {
  static getLogDirs(jobName, buildNumber, type, singleOrMulti) {
    const logsPath = `${config.logsDir}/${jobName}-${buildNumber}/${type}`;
    return PromiseDir.getDirs(logsPath);
  }
}
