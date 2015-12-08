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
  const singleOrMultiDir = singleOrMulti ? `/${singleOrMulti}` : '';
  const logsPath = `${config.logsDir}/${jobName}-${buildNumber}/${type}${singleOrMultiDir}`;

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

function execNetperfParser(targets) {
  const parser = 'src/parsers/netperf.py';
}

function execParser(type, targets) {
  const parser = `src/parsers/${type}.rb`;
  const oldLog = targets[0];
  const newLog = targets[1];
  const query = `ruby ${parser} ${oldLog} ${newLog}`;

  console.log(query);
  return new Promise((resolve, reject) => {
    exec(query, function (error, stdout, stderr) {
      if (error !== null) reject(error);
      else if (stderr) reject(stderr);
      else if (stdout) resolve(stdout);
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
