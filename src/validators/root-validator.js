'use strict';

const Validator = require('./validator.js');
const LogType = require('../log-type.js');

module.exports = class RootValidator extends Validator {
  validate(file, metaJson) {
    this.validateDirectoryNum(file);
    this.validateDirectoryName(file);
  }

  validateDirectoryName(file) {
    const directories = this.getDirectories(file);

    Object.keys(directories).forEach((directory) => {
      if (!LogType.all.contains(directory)) {
        this.throwError(`Unexpected directory "${directory}" is found in zip file. Only [${LogType.all}] are allowed.`);
      }
    });
  }

  validateDirectoryNum(file) {
    const directories = this.getDirectories(file);

    if (Object.keys(directories).length == 0) {
      this.throwError(`Valid directory is not found. Zip file must contains at least one of the following: [${LogType.all}]`);
    }
  }
}
