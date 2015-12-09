'use strict';

const fs = require('fs');
const http = require('http');
const express = require('express');
const app = express();
const server = http.createServer(app);
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

const ParserExecuter = require('./src/parser-executer.js');

app.get('/logs/:jobname/:buildnumber/:type/:singleormulti?.json', function(req, res) {
  const params = req.params;
  ParserExecuter.exec(params.jobname, params.buildnumber, params.type, params.singleormulti).then((result) => {
    res.send(result);
  }).catch((error) => {
    res.send({error: error.toString()});
  });
});

server.listen(config.port);
console.log(`listen: ${config.port}`);
