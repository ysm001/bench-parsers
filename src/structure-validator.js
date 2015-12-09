'use strict';

const fs = require('fs');
const PromiseDir = require('../libs/promise-dir.js');
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

module.exports = class StructureValidator {
  static validate(path) {
  }
}
