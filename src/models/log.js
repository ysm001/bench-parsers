'use strict';

const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  jobName: { type: String },
  buildNumber: { type: String },
  old: { type: String },
  new: { type: String },
  data: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

LogSchema.static('findByJobNameAndBuildNumber', function(jobName, buildNumber) {
  return this 
    .where({jobName: jobName, buildNumber: buildNumber})
    .sort('-created_at')
    .then((results) => {
      return results[0];
    });
});

LogSchema.static('saveOrUpdate', function(params) {
  return this.findOneAndUpdate({
    jobName: params.jobName,
    buildNumber: params.buildNumber
  }, params, {
    new: true,
    upsert: true
  }).exec();
});

module.exports = mongoose.model('Log', LogSchema);
