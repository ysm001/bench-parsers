'use strict';

const SecondLevelLogValidator = require('./second-level-log-validator.js');

module.exports = class LmbenchValidator extends SecondLevelLogValidator {
  constructor() {
    super();

    this.rootKey = 'lmbench';
  }

  validateCompareTargetDirStructure(oldDir, newDir, metaJson) {
    this.validateCompareTargetSubDirStructure(oldDir);
    this.validateCompareTargetSubDirStructure(newDir);
  }

  validateCompareTargetSubDirStructure(targetDir) {
    const directories = this.getDirectories(targetDir.children);
    Object.keys(directories).forEach((dirName) => {
      const files = this.getFiles(directories[dirName].children);
      this.existsKey(files, 'summary.txt', targetDir.name);
    });
  }
}
