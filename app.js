'use strict';

const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec;
const http = require('http');
const express = require('express');
const app = express();
const server = http.createServer(app);
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

function getLogDirs(jobName, buildNumber, type, singleOrMulti) {
  if (singleOrMulti) {
    return new Promise((resolve, reject) => { resolve([`${config.logsDir}/${jobName}-${buildNumber}/${type}/${singleOrMulti}`]) });
  }

  const logsPath = `${config.logsDir}/${jobName}-${buildNumber}/${type}`;

  return new Promise((resolve, reject) => {
    fs.readdir(logsPath, (err, files) => {
      if (err) return reject(err);

      const logDirs = files.map((file) => {
        return path.join(logsPath, file);
      }).filter((file) => {
        return fs.statSync(file).isDirectory();
      });

      resolve(logDirs);
    })
  });
}

function execParser(type, targets) {
  const isNetPerf = type == 'netperf';
  const ext = isNetPerf ? '.py' : '.rb';
  const runtime = isNetPerf ? 'python' : 'ruby';
  const parser = `src/parsers/${type}${ext}`;
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

app.get('/logs/:jobname/:buildnumber/:type/:singleormulti?.json', function(req, res) {
  const params = req.params;
  getLogDirs(params.jobname, params.buildnumber, params.type, params.singleormulti).then((logDirs) => {
    return execParser(params.type, logDirs);
  }).then((result) => {
    res.send(result);
  }).catch((error) => {
    res.send(error);
  });
});

server.listen(config.port);
console.log(`listen: ${config.port}`);
