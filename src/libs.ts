import express from 'express'
import { createHmac } from 'crypto'
import * as childProcess from 'child_process'
import request from 'request'
import * as bodyParser from 'body-parser'
import * as fs from 'fs'

export { express, createHmac, request, bodyParser, fs }

export function exec(command: string) {
  return new Promise<void>((resolve, reject) => {
    const subProcess = childProcess.exec(command, (error, stdout, stderr) => error ? reject(error) : resolve())
    if (subProcess.stdout) {
      subProcess.stdout.pipe(process.stdout)
    }
    if (subProcess.stderr) {
      subProcess.stderr.pipe(process.stderr)
    }
  })
}

import getPort from 'get-port'
export { getPort }

export function writeAsync(filename: string, data: string) {
  return new Promise<void>((resolve, reject) => {
    fs.writeFile(filename, data, error => error ? reject(error) : resolve())
  })
}

/**
 * operators: for github, it's name; for gitlab, it's id, can be found in the html
 */
export interface Application {
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
}

export interface Config {
  applications: Application[];
  localeName: string;
  mode: 'github' | 'gitlab';
  port: number;
  host: string;
}

export interface Handler<T> {
  commentEventName: string;
  pullRequestEventName: string;
  pullRequestOpenActionName: string;
  pullRequestUpdateActionName: string;
  getRepositoryName(request: express.Request): string;
  verifySignature(request: express.Request, application: Application): boolean;
  getEventName(request: express.Request): string | undefined;
  getCommentAuthor(request: express.Request): string | number;
  getComment(request: express.Request): string;
  getCommentCreationContext(request: express.Request, application: Application): T;
  getPullRequestCommentCreationContext(request: express.Request, application: Application): T;
  getPullRequestAction(request: express.Request): string;
  isPullRequestMerged(request: express.Request, action: string): boolean;
  isPullRequestClosed(request: express.Request, action: string): boolean;
  createComment(content: string, context: T): Promise<void>;
  getPullRequestAuthor(request: express.Request): string | number;
  getPullRequestId(request: express.Request): number;
  getBranchName(request: express.Request): string;
  getHeadRepositoryCloneUrl(request: express.Request): string;
}
