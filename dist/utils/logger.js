"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLogs = exports.Logs = void 0;
/**
 * Simple console logging class
 * Params: logLevel: number
 *      Level on a scale from 1-5. 5 being the most verbose, 1 being the least.
 */
class Logs {
    constructor(logLevel = 3) {
        this.logLevel = logLevel;
        logs = this;
    }
    trace(message, ...parameters) {
        if (this.logLevel == 5) {
            console.info(message, ...parameters);
        }
    }
    debug(message, ...parameters) {
        if (this.logLevel >= 4) {
            console.info(message, ...parameters);
        }
    }
    info(message, ...parameters) {
        if (this.logLevel >= 3) {
            console.info(message, ...parameters);
        }
    }
    warn(message, ...parameters) {
        if (this.logLevel >= 2) {
            console.info(message, ...parameters);
        }
    }
    error(message, ...parameters) {
        if (this.logLevel >= 1) {
            console.info(message, ...parameters);
        }
    }
}
exports.Logs = Logs;
let logs;
function getLogs() {
    return logs;
}
exports.getLogs = getLogs;
