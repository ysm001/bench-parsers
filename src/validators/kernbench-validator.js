'use strict';

const SecondLevelLogValidator = require('./second-level-log-validator.js');

module.exports = class KernbenchValidator extends SecondLevelLogValidator {
  constructor() {
    super();

    this.rootKey = 'kernbench';
    this.directoryPostFix = 'CPU';
  }
}
