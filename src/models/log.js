'use strict';

const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  jenkins_job_name: { type: String },
  jenkins_build_number: { type: String },
  old: { type: String },
  new: { type: String },
  created_at: { type: Date },
  data: mongoose.Schema.Types.Mixed
});

module.exports = mongoose.model('Log', LogSchema);
