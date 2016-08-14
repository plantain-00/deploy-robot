/// <reference types="express" />
import * as libs from "./libs";
/**
 * the `applications` configurations,
 * you can set `repositoryName`, `secret` and so on.
 */
export declare const applications: libs.Application[];
/**
 * the mode handlers, there are `github` and `gitlab` handlers inside.
 * you can push other handers in it
 */
export declare const handlers: {
    [modeName: string]: Handler;
};
export declare let ports: Ports;
export declare let commands: Command[];
export declare function start(app: libs.express.Application, path: string, mode: string, options?: {
    initialCommands: Command[];
    initialPorts: Ports;
    onCommandsUpdated: () => Promise<void>;
    onPortsUpdated: () => Promise<void>;
}): void;
export declare type Handler = {
    issueCommentEventName: string;
    pullRequestEventName: string;
    pullRequestOpenActionName: string;
    pullRequestUpdateActionName: string;
    getRepositoryName(request: libs.express.Request): string;
    verifySignature(request: libs.express.Request, application: libs.Application): boolean;
    getEventName(request: libs.express.Request): string;
    getIssueCommentOperator(request: libs.express.Request): string | number;
    getIssueComment(request: libs.express.Request): string;
    getCommentCreationContext(request: libs.express.Request, application: libs.Application, operator: string | number): any;
    getPullRequestAction(request: libs.express.Request): string;
    isPullRequestMerged(request: libs.express.Request, action: string): boolean;
    isPullRequestClosed(request: libs.express.Request, action: string): boolean;
    createComment(content: string, context: any): Promise<void>;
    getPullRequestOperator(request: libs.express.Request): string | number;
    getPullRequestId(request: libs.express.Request): number;
    getBranchName(request: libs.express.Request): string;
};
export declare type Command = {
    context: any;
    command: string;
};
export declare type Ports = {
    [repositoryName: string]: {
        [pullRequestId: number]: number;
    };
};
