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
require('array-sugar');

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/logs/:jobname/:buildnumber/:type/:singleormulti?.json', (req, res) => {
  const params = req.params;

  ParserExecuter.exec(params.jobname, params.buildnumber, params.type).then((result) => {
    res.send(result);
  }).catch((error) => {
    res.send({error: error.toString()});
  });
});

app.post('/logs/:jobname/:buildnumber/upload', upload.single('archive'), (req, res) => {
  const params = req.params;
  const files = new Zip().unzip(req.file.buffer);
  const validator = new ArchiveValidator();

  validator.validate(files, params.jobname, params.buildnumber).then(() => {
    return LogArchiveSaver.save(req.file, params.jobname, params.buildnumber);
  }).then((outputPath) => {
    console.log(outputPath);
    return LogArchiveSaver.saveToDB(params.jobname, params.buildnumber);
  }).then(() => {
    res.send({result: true});
  }).catch((e) => {
    console.log(e);
    res.send({
      result: false, error: { type: e.name, message: e.message }
    });
  });
});

server.listen(config.port);
console.log(`listen: ${config.port}`);
