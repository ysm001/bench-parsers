'use strict';

const ValidationError = require('./validation-error.js');

module.exports = class Validator {
  validate() {
  }

  existsKey(object, key, objectName) {
    if (!(key in object)) {
      this.throwError(`"${key}" does not exist in ${objectName}.`);
    }
  }

  existsKeys(object, keys, objectName) {
    const errors = keys.map((key) => {
      if (!(key in object)) {
        return `key "${key}" does not exist in ${objectName}.`;
      }
    }).filter((e) => { return e != null; });

    if (errors.length != 0) {
      this.throwError(errors);
    }
  }

  throwError(object) {
    throw new ValidationError(object);
  }

  filterByType(fileObject, type) {
    let result = {};

    Object.keys(fileObject).forEach((key) => {
      if ((fileObject[key].dir && type == 'directory') || (!fileObject[key].dir && type == 'file')) {
        result[key] = fileObject[key];
      }
    });

    return result;
  }

  filterDirectory(fileObject) {
    return this.filterByType(fileObject, 'directory');
  }

  filterFile(fileObject) {
    return this.filterByType(fileObject, 'file');
  }

  hasDirectory(fileObject) {
    return Object.keys(this.filterDirectory(fileObject.children)).length != 0;
  }

  hasFile(fileObject) {
    return Object.keys(this.filterFile(fileObject.children)).length != 0;
  }

  validateDirectoryOnly(fileObject) {
    if (this.hasDirectory(fileObject)) {
      this.throwError(`Directory is found in ${fileObject.name}. Only files are allowed.`);
    }
  }

  validateFileOnly(fileObject) {
    if (this.hasFile(fileObject)) {
      this.throwError(`File is found under ${fileObject.name}. Only directories are allowed.`);
    }
  }
}
