'use strict';

const fs = require('fs');
const http = require('http');
const express = require('express');
const multer  = require('multer')
const upload = multer({ inMemory: true });
const app = express();
const server = http.createServer(app);
const config = require('./config/server.json');
const ParserExecuter = require('./src/parser-executer.js');
const Zip = require('./libs/zip.js');
const LogArchiveSaver = require('./src/log-archive-saver.js');
const ArchiveValidator = require('./src/validators/archive-validator.js');
const db = require('./src/db.js');
const Log = require('./src/models/log.js');
require('array-sugar');

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/logs/summary.json', (req, res) => {
  Log.find().then((logs) => {
    const ret = logs.map((log) => {
      return {
        _id: log._id,
        isPassed: true,
        targetFirst: log.old,
        targetSecond: log.new,
        jobName: log.jobName,
        buildNumber: log.buildNumber,
        createdAt: log.createdAt,
        updatedAt: log.updatedAt
      }
    });

    res.send(ret);
  });
})

app.get('/logs/:jobname/:buildnumber/:type.json', (req, res) => {
  const params = req.params;

  Log.findByJobNameAndBuildNumber(params.jobname, params.buildnumber).then((result) => {
    console.log(result.createdAt);
    res.send(result.data[params.type]);
  }).onReject((err) => {
    res.send(err);
  });
});

app.post('/logs/:jobname/:buildnumber/upload', upload.single('archive'), (req, res) => {
  const params = req.params;
  const body = req.body;
  const files = new Zip().unzip(req.file.buffer);
  const validator = new ArchiveValidator();

  validator.validate(files, body.oldVersion, body.newVersion).then(() => {
    return LogArchiveSaver.save(req.file, params.jobname, params.buildnumber, body.oldVersion, body.newVersion);
  }).then(() => {
    res.send({result: true});
  }).catch((e) => {
    console.log(e.stack);
    res.send({
      result: false, error: { type: e.name, message: e.message }
    });
  });
});

server.listen(config.port);
console.log(`listen: ${config.port}`);
