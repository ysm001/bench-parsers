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
require('date-utils');
require('array-sugar');

const formatDate = (date) => {
  return date.toFormat("YYYY/MM/DD HH24:MI:SS");
}

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/logs/summary.json', (req, res) => {
  Log.find().sort({createdAt: -1}).then((logs) => {
    const ret = logs.map((log) => {
      return {
        _id: log._id,
        isPassed: true,
        oldVersion: log.old,
        newVersion: log.new,
        jobName: log.jobName,
        buildNumber: log.buildNumber,
        createdAt: formatDate(log.createdAt),
        updatedAt: formatDate(log.updatedAt)
      }
    });

    res.send(ret);
  });
})

const returnResult = (promise, res, type) => {
  return promise.then((result) => {
    if (type) {
      res.send(result.data[type]);
    } else {
      res.send(result.data);
    }
  }).onReject((err) => {
    res.send(err);
  });
}

app.get('/logs/:jobname/:buildnumber/:type.json', (req, res) => {
  returnResult(Log.findByJobNameAndBuildNumber(req.params.jobname, req.params.buildnumber), res, req.params.type);
});

app.get('/logs/:id/:type.json', (req, res) => {
  returnResult(Log.findOne({_id: req.params.id}), res, req.params.type);
});

app.get('/logs/:id.json', (req, res) => {
  returnResult(Log.findOne({_id: req.params.id}), res);
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
