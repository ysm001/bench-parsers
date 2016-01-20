'use strict';

const http = require('http');

module.exports = class Cache {
  constructor() {
    this.apiHost = 'http://127.0.0.1:4000';
  }

  fetchSVGIdsByDataId(dataId) {
    return this.promisify(`svgs/${dataId}/ids`);
  }

  fetchSVGDataByDataId(dataId) {
    return this.fetchSVGIdsByDataId(dataId).then((response) => {
      const ids = JSON.parse(response);
      const promises = ids.map((id) => {
        return this.promisify(`svgs/${id}`).then((svg) => {
          return {
            id: id,
            svg: svg
          }
        });
      });

      return Promise.all(promises);
    });
  }

  promisify(path) {
    const query = `${this.apiHost}/${path}`;

    console.log(query);
    const deferred = Promise.defer();
    http.get(query, (response) => {
      response.setEncoding('utf8');
      response.on('data', function(data) {
        deferred.resolve(data);
      });
    }).on('error', function(e) {
      deferred.reject(error);
    });

    return deferred.promise;
  }
};
