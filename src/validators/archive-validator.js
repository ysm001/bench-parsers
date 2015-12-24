'use strict';

const MetaJsonValidator = require('./metajson-validator.js');
const RootValidator = require('./root-validator.js');
const LogValidatorFactory = require('./log-validator-factory.js');
const Validator = require('./validator.js');

module.exports = class ArchiveValidator extends Validator {
  constructor() {
    super();

    this.rootValidator = new RootValidator();
  }

  validate(file, oldVersion, newVersion) {
    return new Promise((resolve, reject) => {
      resolve(true);
      // const metaJson = { old: oldVersion, new: newVersion };
      // this.rootValidator.validate(file, metaJson);
      // this.validateLogs(file, metaJson);

      // resolve(metaJson);
    });
  }

  validateLogs(file, metaJson) {
    const directories = this.getDirectories(file);

    Object.keys(directories).forEach((directory) => {
      const validator = LogValidatorFactory.create(directory);
      console.log(directory);
      validator.validate(file, metaJson);
    });
  }
}
