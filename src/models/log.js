'use strict';

const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  jenkinsJobName: { type: String },
  jenkinsBuildNumber: { type: String },
  old: { type: String },
  new: { type: String },
  data: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

LogSchema.static('findByJobNameAndBuildNumber', function(jobName, buildNumber) {
  return this 
    .where({jenkinsJobName: jobName, jenkinsBuildNumber: buildNumber})
    .sort('-created_at')
    .then((results) => {
      return results[0];
    });
});

LogSchema.static('findAll', function(jobName, buildNumber) {
  return this.find('jenkinsJobName');
});

LogSchema.static('saveOrUpdate', function(params) {
  return this.findOneAndUpdate({
    jenkinsJobName: params.jenkinsJobName,
    jenkinsBuildNumber: params.jenkinsBuildNumber
  }, params, {
    new: true,
    upsert: true
  }).exec();
});

module.exports = mongoose.model('Log', LogSchema);
