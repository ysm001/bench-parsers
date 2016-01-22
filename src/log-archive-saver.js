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
  static saveToDB(logPath, archivePath, jenkinsJobName, jenkinsBuildNumber, oldVersion, newVersion, machine) {
    return LogArchiveSaver.logFilesToJSON(logPath, oldVersion, newVersion).then((res) => {
      return Log.saveOrUpdate({
        old: oldVersion,
        new: newVersion,
        jobName: jenkinsJobName,
        buildNumber: jenkinsBuildNumber,
        machine: machine,
        archivePath: archivePath,
        data: res
      }).onReject((error) => {
        throw error;
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
    return LogArchiveSaver.saveToLogDir(archive, jenkinsJobName, jenkinsBuildNumber).then((logPath) => {
      const outputPath = `${LogPath.makeTmpPath(jenkinsJobName, jenkinsBuildNumber)}/unarchived`;
      const logFilePath = `${logPath.path}/${logPath.fileName}`;

      return LogArchiveSaver.unzip(logFilePath, outputPath, jenkinsJobName, jenkinsBuildNumber);
    }).then((path) => {
      console.log(path);
      return LogArchiveSaver.saveToDB(path.unarchivedPath, path.archivePath, jenkinsJobName, jenkinsBuildNumber, oldVersion, newVersion);
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

        resolve({archivePath: archivePath, unarchivedPath: outputPath});
      });
    });
  }

  static saveToLogDir(archive, jenkinsJobName, jenkinsBuildNumber) {
    const fileName = archive.originalname;
    const logPath = LogPath.makeLogPath(jenkinsJobName, jenkinsBuildNumber);
    const logFilePath = `${logPath}/${fileName}`;

    if (!fs.existsSync(logPath)) {
      mkdirp.sync(logPath);
    }

    return fsp.writeFile(logFilePath, archive.buffer).then(() => {
      return {
        path: logPath,
        fileName: fileName
      };
    });
  }
}
