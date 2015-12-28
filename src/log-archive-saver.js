'use strict';

const fs = require('fs');
const fsp = require('fs-promise');
const exec = require('child_process').exec;
const mkdirp = require('mkdirp');
const config = require('../config/directory.json');
const ParserExecuter = require('./parser-executer.js');
const Log = require('./models/log.js');
const LogPath = require('./log-path.js');

module.exports = class LogArchiveSaver {
  static saveToDB(logPath, jenkinsJobName, jenkinsBuildNumber, oldVersion, newVersion) {
    return LogArchiveSaver.logFilesToJSON(logPath, oldVersion, newVersion).then((res) => {
      const log = Log.saveOrUpdate({
        old: oldVersion,
        new: newVersion,
        jobName: jenkinsJobName,
        buildNumber: jenkinsBuildNumber,
        data: res
      });
    });
  }

  static logFilesToJSON(logPath, oldVersion, newVersion) {
    return LogArchiveSaver.getTargetTypes(logPath).then((types) => {
      return ParserExecuter.execAll(logPath, types, oldVersion, newVersion);
    });
  }

  static getTargetTypes(logPath) {
    let result = [];

    return fsp.readdir(logPath).then((files) => {
      return files.filter((file) => {
        return fs.statSync(`${logPath}/${file}`).isDirectory();
      });
    });
  }

  static save(archive, jenkinsJobName, jenkinsBuildNumber, oldVersion, newVersion) {
    return LogArchiveSaver.saveToTmp(archive, jenkinsJobName, jenkinsBuildNumber).then((tmpPath) => {
      const outputPath = `${tmpPath.path}/unarchived`;
      const tmpFilePath = `${tmpPath.path}/${tmpPath.fileName}`;

      return LogArchiveSaver.unzip(tmpFilePath, outputPath, jenkinsJobName, jenkinsBuildNumber);
    }).then((path) => {
      return LogArchiveSaver.saveToDB(path, jenkinsJobName, jenkinsBuildNumber, oldVersion, newVersion);
    });
  }

  static unzip(archivePath, outputPath, jenkinsJobName, jenkinsBuildNumber) {
    mkdirp.sync(outputPath);

    const query = `unzip ${archivePath} -d ${outputPath}`;
    console.log(query);

    return new Promise((resolve, reject) => {
      exec(query, (error, stdout, stderr) => {
        if (error !== null) return reject(error);
        if (stderr) console.log(stderr);

        resolve(outputPath);
      });
    });
  }

  static saveToTmp(archive, jenkinsJobName, jenkinsBuildNumber) {
    const fileName = archive.originalname;
    const tmpPath = LogPath.makeTmpPath(jenkinsJobName, jenkinsBuildNumber);
    const tmpFilePath = `${tmpPath}/${fileName}`;

    if (!fs.existsSync(tmpPath)) {
      mkdirp.sync(tmpPath);
    }

    return fsp.writeFile(tmpFilePath, archive.buffer).then(() => {
      return {
        path: tmpPath,
        fileName: fileName
      };
    });
  }
}
