import * as express from "express";
import * as crypto from "crypto";
import * as childProcess from "child_process";
import * as request from "request";
import * as bodyParser from "body-parser";
import * as minimist from "minimist";
import * as fs from "fs";

export { express, crypto, request, bodyParser, minimist };

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

// tslint:disable-next-line:no-var-requires
export const getPort: () => Promise<number> = require("get-port");

export function readAsync(filename: string) {
    return new Promise<string>((resolve, reject) => {
        fs.readFile(filename, "utf8", (error, data) => {
            if (error) {
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
}

export function writeAsync(filename: string, data: string) {
    return new Promise<void>((resolve, reject) => {
        fs.writeFile(filename, data, error => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

/**
 * operators: for github, it's name; for gitlab, it's id, can be found in the html
 */
export type Application = {
    repositoryName: string;
    hookSecret: string;
    pullRequest: {
        getTestUrl: (port: number, pullRequestId: number) => string;
        mergedCommand: string;
        openedCommand: string;
        closedCommand: string;
        updatedCommand: string;
    };
    commentActions: {
        filter: (comment: string, author: string | number) => boolean;
        command: string;
        gotMessage: string;
        doneMessage: string;
    }[];
};
