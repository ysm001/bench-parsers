'use strict';

const FioValidator = require('./fio-validator.js');
const KernbenchValidator = require('./kernbench-validator.js');
const LmbenchValidator = require('./lmbench-validator.js');
const NetperfValidator = require('./netperf-validator.js');
const MetaJsonValidator = require('./metajson-validator.js');

module.exports = class ArchiveValidator {
  constructor() {
    this.fioValidator = new FioValidator();
    this.kernbenchValidator = new KernbenchValidator();
    this.lmbenchValidator = new LmbenchValidator();
    this.netperfValidator = new NetperfValidator();
    this.metaJsonValidator = new MetaJsonValidator();
  }

  validate(file) {
    return new Promise((resolve, reject) => {
      const metaJson = this.metaJsonValidator.validate(file);
      this.fioValidator.validate(file, metaJson);
      this.kernbenchValidator.validate(file, metaJson);
      this.lmbenchValidator.validate(file, metaJson);
      this.netperfValidator.validate(file, metaJson);

      resolve(metaJson);
    });
  }
}
