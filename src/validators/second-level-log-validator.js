'use strict';

const Validator = require('./validator.js');

module.exports = class SecondLevelLogValidator extends Validator{
  constructor() {
    super();

    this.rootKey = '';
    this.directoryPostFix = '';
    this.logFileExt = 'log';
  }

  validate(file, metaJson) {
    this.validateRootDirStructure(file, metaJson);
  }

  validateRootDirStructure(file, metaJson) {
    this.existsKey(file, this.rootKey, 'zip file');

    const root = file[this.rootKey].children;
    const requiredKeys = [metaJson.old, metaJson.new];
    this.existsKeys(root, requiredKeys, `${this.rootKey}/`);

    this.validateCompareTargetDirStructure(root[metaJson.old], root[metaJson.new], metaJson);
  }

  validateCompareTargetDirStructure(oldDir, newDir, metaJson) {
    const oldDirChildren = this.filterDirectory(oldDir.children);
    const newDirChildren = this.filterDirectory(newDir.children);
    const oldDirChildrenKeys = Object.keys(oldDirChildren);
    const newDirChildrenKeys = Object.keys(oldDirChildren);

    if (oldDirChildrenKeys.length!= newDirChildrenKeys.length) {
      this.throwError(`Number of directories is difference. (${oldDir.name}=${oldDirChildrenKeys.length} ${newDir.name}=${newDirChildrenKeys.length})`);
    }

    for (let i in oldDirChildrenKeys) {
      if (oldDirChildrenKeys[i] != newDirChildrenKeys[i]) {
        this.throwError(`Name of directories is difference. (${oldDirChildrenKeys[i]} != ${newDirChildrenKeys[i]})`);
      }

      if (RegExp(`\d+${this.directoryPostFix}`).test(oldDirChildrenKeys[i])) {
        this.throwError(`Name of directories under ${oldDir.name} must be "<number>${this.directoryPostFix}". (${oldDir.name}/${oldDirChildrenKeys[i]})`);
      }

      this.validateCompareTarget(oldDirChildren[oldDirChildrenKeys[i]]);
      this.validateCompareTarget(newDirChildren[newDirChildrenKeys[i]]);
    }
  }

  validateCompareTarget(dir, metaJson) {
    const dirChildren = this.filterFile(dir.children);
    const dirs = this.filterDirectory(dir.children);

    if (this.hasDirectory(dir)) {
      this.throwError(`Directory is found under ${dir.name}. Only ".${this.logFileExt}" files are allowed.`);
    }

    Object.keys(dirChildren).forEach((fileName) => {
      if (fileName.split('.').pop() != this.logFileExt) {
        this.throwError(`Invalid file is found under ${dir.name}. Only ".${this.logFileExt}" files are allowed. (${dir.name}${fileName})`);
      }
    });
  }
}
