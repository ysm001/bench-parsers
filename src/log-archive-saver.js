'use strict';

const fs = require('fs');
const exec = require('child_process').exec;
const mkdirp = require('mkdirp');
const config = require('../config/directory.json');
const ParserExecuter = require('./parser-executer.js');
const Log = require('./models/log.js');

module.exports = class LogArchiveSaver {
  static saveToDB(jenkinsJobName, jenkinsBuildNumber) {
    return ParserExecuter.execAll(jenkinsJobName, jenkinsBuildNumber).then((res) => {
      const log = new Log({
        old: 'old',
        new: 'new',
        jenkins_job_name: jenkinsJobName,
        jenkins_build_number: jenkinsBuildNumber,
        data: res
      });

      log.markModified('data');
      log.save();
    });
  }

  static save(archive, jenkinsJobName, jenkinsBuildNumber) {
    return LogArchiveSaver.saveTmp(archive, jenkinsJobName, jenkinsBuildNumber).then(() => {
      return LogArchiveSaver.unzip(archive, jenkinsJobName, jenkinsBuildNumber);
    });
  }

  static unzip(archive, jenkinsJobName, jenkinsBuildNumber) {
    const outputPath = LogArchiveSaver.makePath(config.logsDir, jenkinsJobName, jenkinsBuildNumber);
    const tmpFilePath = LogArchiveSaver.makeTmpFilePath(archive, jenkinsJobName, jenkinsBuildNumber);

    if (!fs.existsSync(outputPath)) {
      mkdirp.sync(outputPath)
    } else {
      throw new Error(`Log files are already exist. (JobName=${jenkinsJobName} BuildNumber=${jenkinsBuildNumber})`);
    }

    const query = `unzip ${tmpFilePath} -d ${outputPath}`;
    console.log(query);

    return new Promise((resolve, reject) => {
      exec(query, (error, stdout, stderr) => {
        if (error !== null) return reject(error);
        if (stderr) console.log(stderr);

        resolve(outputPath);
      });
    });
  }

  static saveTmp(archive, jenkinsJobName, jenkinsBuildNumber) {
    const tmpPath = LogArchiveSaver.makeTmpPath(archive, jenkinsJobName, jenkinsBuildNumber);
    const tmpFilePath = LogArchiveSaver.makeTmpFilePath(archive, jenkinsJobName, jenkinsBuildNumber);

    if (!fs.existsSync(tmpPath)) {
      mkdirp.sync(tmpPath);
    }

    return new Promise((resolve, reject) => {
      fs.writeFile(tmpFilePath, archive.buffer, (err) => {
        if (err) reject(err);

        resolve();
      })
    });
  }

  static makePath(root, jenkinsJobName, jenkinsBuildNumber) {
    return `${root}/${jenkinsJobName}-${jenkinsBuildNumber}/`;
  }

  static makeTmpPath(archive, jenkinsJobName, jenkinsBuildNumber) {
    return LogArchiveSaver.makePath(config.tmpDir, jenkinsJobName, jenkinsBuildNumber);
  }

  static makeTmpFilePath(archive,jenkinsJobName, jenkinsBuildNumber) {
    return `${LogArchiveSaver.makePath(config.tmpDir, jenkinsJobName, jenkinsBuildNumber)}/${archive.originalname}`;
  }
}
