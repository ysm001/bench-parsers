'use strict';

const request = require('request');

module.exports = class Renderer {
  constructor() {
    this.apiHost = 'http://127.0.0.1:8585';
  }

  render(logId, type, data) {
    var options = {
      body: data,
      json: true,
      proxy: null
    };

    return this.post(`images/${logId}/${type}`, options);
  }

  post(path, options) {
    return this.promisify('post', path, options);
  }

  get(path, options) {
    return this.promisify('get', path, options);
  }

  promisify(method, path, options) {
    const query = `${this.apiHost}/${path}`;
    const deferred = Promise.defer();

    console.log(`${method} ${query}`);
    request[method](query, options, (error, response, body) => {
      if (!error && response.statusCode == 200) {
        deferred.resolve(response);
      } else {
        deferred.reject({
          response: response,
          error: error
        });
      }
    });

    return deferred.promise;
  }
};
