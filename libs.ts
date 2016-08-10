import * as express from "express";
export { express };

import * as cryptoJs from "crypto-js";
export { cryptoJs };

import * as childProcess from "child_process";

import * as request from "request";
export { request };

import * as bodyParser from "body-parser";
export { bodyParser };

export function exec(command: string) {
    return new Promise<void>((resolve, reject) => {
        childProcess.exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

export const getPort: () => Promise<number> = require("get-port");

import * as minimist from "minimist";
export { minimist };
