'use strict';

const LogType = require('../log-type.js');

const FioValidator = require('./fio-validator.js');
const KernbenchValidator = require('./kernbench-validator.js');
const LmbenchValidator = require('./lmbench-validator.js');
const NetperfValidator = require('./netperf-validator.js');
const MetaJsonValidator = require('./metajson-validator.js');
const RootValidator = require('./root-validator.js');

module.exports = class LogValidatorFactory {
  static create(type) {
    switch(type) {
      case LogType.FIO:
        return new FioValidator();
      case LogType.KERNBENCH:
        return new KernbenchValidator();
      case LogType.LMBENCH:
        return new LmbenchValidator();
      case LogType.NETPERF_SINGLE:
      case LogType.NETPERF_MULTI:
        return new NetperfValidator();
      default:
        throw new Error(`Invalid log type. (${type})`);
    }
  }
}

