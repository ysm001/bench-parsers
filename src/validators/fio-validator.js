'use strict';

const SecondLevelLogValidator = require('./second-level-log-validator.js');

module.exports = class FioValidator extends SecondLevelLogValidator {
  constructor() {
    super();

    this.rootKey = 'fio';
    this.directoryPostFix = 'K';
  }
}
