'use strict';

const fs = require('fs');
const exec = require('child_process').exec;
const mkdirp = require('mkdirp');
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

module.exports = class LogArchiveSaver {
  static save(archive, metaJson) {
    return LogArchiveSaver.saveTmp(archive, metaJson).then(() => {
      return LogArchiveSaver.unzip(archive, metaJson);
    });
  }

  static unzip(archive, metaJson) {
    const outputPath = LogArchiveSaver.makePath(config.logsDir, metaJson);
    const tmpFilePath = LogArchiveSaver.makeTmpFilePath(archive, metaJson);

    if (!fs.existsSync(outputPath)) {
      mkdirp.sync(outputPath)
    } else {
      throw new Error(`Log files are already exist. (JobName=${metaJson.jenkinsJobName} BuildNumber=${metaJson.jenkinsBuildNumber})`);
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

  static saveTmp(archive, metaJson) {
    const tmpPath = LogArchiveSaver.makeTmpPath(archive, metaJson);
    const tmpFilePath = LogArchiveSaver.makeTmpFilePath(archive, metaJson);

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

  static makePath(root, metaJson) {
    return `${root}/${metaJson.jenkinsJobName}/${metaJson.jenkinsBuildNumber}/`;
  }

  static makeTmpPath(archive, metaJson) {
    return LogArchiveSaver.makePath(config.tmpDir, metaJson);
  }

  static makeTmpFilePath(archive, metaJson) {
    return `${LogArchiveSaver.makePath(config.tmpDir, metaJson)}/${archive.originalname}`;
  }
}
