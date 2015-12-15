'use strict';

const db = require('mongoose');
const config = require('../config/db.json').development;

db.connect('mongodb://' + config.host + '/' + config.database);

module.exports = db;
