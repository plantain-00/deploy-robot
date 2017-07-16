import * as express from "express";
import * as crypto from "crypto";
import * as childProcess from "child_process";
import * as request from "request";
import * as bodyParser from "body-parser";
import * as fs from "fs";

export { express, crypto, request, bodyParser, fs };

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

import * as getPort from "get-port";
export { getPort };

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

export type Config = {
    applications: Application[];
    localeName: string;
    mode: "github" | "gitlab";
    port: number;
    host: string;
};
