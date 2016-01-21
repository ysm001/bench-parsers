'use strict';

const config = require('../../config/directory.json');
const LogPath = require('../log-path.js');
const mkdirp = require('mkdirp');
const fs = require('fs-extra')
const exec = require('child_process').exec;
const Path = require('path');
const archiver = require('archiver');

module.exports = class Exporter {
  constructor() {
    this.id = Date.now();
  }

  makeWorkingDirectory() {
    const path = `${config.tmpDir}/export/${this.id}`;
    mkdirp.sync(path);

    return path;
  }

  makeSvgsDirectory(workingDir) {
    const path = `${workingDir}/svgs`;
    mkdirp.sync(path);

    return path;
  }

  zip(source, dest) {
    const archive = archiver.create( 'zip', {} );
    const outputFs = fs.createWriteStream(dest);
    archive.pipe(outputFs);
    archive.bulk([{
      expand: true,
      cwd: source,
      src: ["**/*"],
      dest: '/',
      dot: true
    }]);

    const deferred = Promise.defer();
    outputFs.on('close', () => {
      deferred.resolve(dest);
    });

    archive.on('error', (err) => {
      deferred.reject(err);
    });
 
    archive.finalize();

    return deferred.promise;
  }

  createArchive(logArchivePath, svgs) {
    const outputPath = `${config.tmpDir}/export/${Path.basename(logArchivePath)}`;

    return this.prepareArchiveFiles(logArchivePath, svgs).then((path) => {
      return this.zip(path, outputPath);
    });
  }

  prepareArchiveFiles(logArchivePath, svgs) {
    const workingDir = this.makeWorkingDirectory();

    return this.copyLogArchiveToWorkingDir(logArchivePath, workingDir).then(() => {
      return this.saveSvgsToWorkingDir(svgs, workingDir);
    }).then(() => {
      return workingDir;
    });
  }

  copyLogArchiveToWorkingDir(logArchivePath, workingDir) {
    const deferred = Promise.defer();

    const destPath = `${workingDir}/raw_logs.zip`;
    console.log( `cp ${logArchivePath} ${destPath}`);
    fs.copy(logArchivePath, destPath, (err) => {
      err ? deferred.reject(err) : deferred.resolve();
    });

    return deferred.promise;
  }

  saveSvgsToWorkingDir(svgs, workingDir) {
    const path = this.makeSvgsDirectory(workingDir);

    const promises = svgs.map((svg) => {
      const deferred = Promise.defer();

      fs.outputFile(`${path}/${svg.id}.svg`, svg.svg, (err) => {
        err ? deferred.reject(err) : deferred.resolve();
      });

      return deferred.promise;
    });

    return Promise.all(promises);
  }

  export(res, logArchivePath, svgs) {
    return this.createArchive(logArchivePath, svgs).then((path) => {
      const fstat = fs.statSync(path);

      res.writeHead(200, {
        'Content-Type':'application/zip',
        'Content-Length':fstat.size,
        'Content-Disposition':`attachment; filename="${Path.basename(path)}"`
      });

      const readStream = fs.createReadStream(path);
      readStream.pipe(res);
    });
  }
};
