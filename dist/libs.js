"use strict";
const express = require("express");
exports.express = express;
const cryptoJs = require("crypto-js");
exports.cryptoJs = cryptoJs;
const childProcess = require("child_process");
const request = require("request");
exports.request = request;
const bodyParser = require("body-parser");
exports.bodyParser = bodyParser;
function exec(command) {
    return new Promise((resolve, reject) => {
        childProcess.exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            }
            else {
                resolve();
            }
        });
    });
}
exports.exec = exec;
exports.getPort = require("get-port");
const minimist = require("minimist");
exports.minimist = minimist;
//# sourceMappingURL=libs.js.map