/**
 * The simplest possible implementation of logger
 */
class Logger {
  constructor() {
    this.level = 2; // DEBUG
  }

  debug(msg) {
    if (this.level > Logger.DEBUG) {
      return;
    }
    console.log(msg);
  }

  info(msg) {
    if (this.level > Logger.INFO) {
      return;
    }
    console.log(msg);
  }
}

Logger.DEBUG = 0;
Logger.INFO = 1;
Logger.WARN = 2;
Logger.ERROR = 3;
Logger.FATAL = 4;

exports = module.exports = Logger;
