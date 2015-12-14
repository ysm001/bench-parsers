'use strict';

const SecondLevelLogValidator = require('./second-level-log-validator.js');

module.exports = class LmbenchValidator extends SecondLevelLogValidator {
  constructor() {
    super();

    this.rootKey = 'lmbench';
  }

  validateCompareTargetDirStructure(oldDir, newDir, metaJson) {
    const oldDirFiles = this.getFiles(oldDir.children);
    const newDirFiles = this.getFiles(newDir.children);

    this.existsKey(oldDirFiles, 'summary.txt', oldDir.name);
    this.existsKey(newDirFiles, 'summary.txt', newDir.name);
  }
}
