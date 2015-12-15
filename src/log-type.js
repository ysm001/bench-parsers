'use strict';

module.exports = class LogType {
  static get FIO() { return 'fio'; }
  static get LMBENCH() { return 'lmbench'; }
  static get KERNBENCH() { return 'kernbench'; }
  static get NETPERF_SINGLE() { return 'netperf-single'; }
  static get NETPERF_MULTI() { return 'netperf-multi'; }

  static get all() { return [LogType.FIO, LogType.LMBENCH, LogType.KERNBENCH, LogType.NETPERF_SINGLE, LogType.NETPERF_MULTI]; }
}
