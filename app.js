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
const LogFormatter = require('./src/log-formatter.js');
const ArchiveValidator = require('./src/validators/archive-validator.js');
const db = require('./src/db.js');
const Log = require('./src/models/log.js');
const corser = require("corser");
const Cache = require('./src/services/cache.js');
const Exporter = require('./src/services/exporter.js');
const Path = require('path');
require('date-utils');
require('array-sugar');

const formatDate = (date) => {
  return date.toFormat("YYYY/MM/DD HH24:MI:SS");
}

app.use(corser.create());

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
        machine: log.machine,
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

app.delete('/logs/:id', (req, res) => {
  Log.remove({_id: req.params.id}).exec().then(() => {
    res.send({result: true});
  }).onReject((error) => {
    console.log(error);
    res.send({result: false, error: error});
  });
});

app.get('/logs/:id/export', (req, res) => {
  const cache = new Cache();
  const id = req.params.id;

  Log.findById(id).then((log) => {
    return cache.fetchSVGDataByDataId(req.params.id).then((svgs) => {
      return (new Exporter()).export(res, log.archivePath, svgs);
    });
  }).then(() => {
    console.log(`${id} is successfully exported.`);
    res.send({result: true});
  }).onReject((error) => {
    res.send({result: false, error: error});
    console.log(error.stack);
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

app.post('/logs/upload', upload.single('archive'), (req, res) => {
  const params = req.params;
  const body = req.body;

  return LogFormatter.formatArchivedFile(req.file).then((result) => {
    const oldVersion = result.versions[0];
    const newVersion = result.versions[1];
    const time = Date.now();
    console.log(result.logs);
    const promises = result.logs.map((log, idx) => {
      const jobName = Path.basename(req.file.originalname, '.zip');
      const buildNumber = `${time}${idx}`;
      return LogArchiveSaver.saveToDB(log.path, log.archivePath, jobName, buildNumber, oldVersion, newVersion, log.machine).then(() => {
        console.log(`${jobName}-${buildNumber} is saved.`);
      });
    });

    return Promise.all(promises);
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
