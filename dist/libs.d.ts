import * as express from "express";
export { express };
import * as crypto from "crypto";
export { crypto };
import * as request from "request";
export { request };
import * as bodyParser from "body-parser";
export { bodyParser };
export declare function exec(command: string): Promise<void>;
export declare const getPort: () => Promise<number>;
import * as minimist from "minimist";
export { minimist };
import * as __awaiter__ from "tslib";
export { __awaiter__ };
/**
 * operators: for github, it's name; for gitlab, it's id, can be found in the html
 */
export interface Application {
    repositoryName: string;
    robot: {
        secret: string;
    };
    commentDeploy: {
        operators: (string | number)[];
        command: string;
    };
    pullRequest: {
        testRootUrl: string;
        mergedCommand: string;
        openedCommand: string;
        closedCommand: string;
        updatedCommand: string;
    };
}
