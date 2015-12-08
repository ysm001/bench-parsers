'use strict';

const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec;
const http = require('http');
const express = require('express');
const app = express();
const server = http.createServer(app);
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

function getLogDirs(jobName, buildNumber, type) {
  const logsPath = `${config.logsDir}/${jobName}-${buildNumber}/${type}`;

  return new Promise((resolve, reject) => {
    fs.readdir(logsPath, (err, files) => {
      if (err) reject(err);

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
  const isPythonScript = type == 'netperf';
  const ext = isPythonScript ? '.py' : '.rb';
  const runtime = isPythonScript ? 'python' : 'ruby';
  const parser = `src/parsers/${type}${ext}`;
  const oldLog = targets[0];
  const newLog = targets[1];
  const query = `${runtime} ${parser} ${oldLog} ${newLog}`;

  return new Promise((resolve, reject) => {
    exec(query, function (error, stdout, stderr) {
      if (error !== null) reject(error);
      if (stderr) reject(stderr);
      if (stdout) resolve(stdout);
    })
  });
}

app.get('/logs/:jobname/:buildnumber/:type.json', function(req, res) {
  const params = req.params;
  getLogDirs(params.jobname, params.buildnumber, params.type).then((logDirs) => {
    return execParser(params.type, logDirs);
  }).then((result) => {
    res.send(result);
  }).catch((error) => {
    res.send(result);
  });
});

server.listen(config.port);
console.log(`listen: ${config.port}`);
