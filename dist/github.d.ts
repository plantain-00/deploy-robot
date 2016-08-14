/// <reference types="express" />
import * as libs from "./libs";
export declare function createComment(content: string, context: {
    owner: string;
    repo: string;
    issueNumber: number;
    operator: string;
}): Promise<void>;
export declare function getRepositoryName(request: libs.express.Request): string;
export declare function verifySignature(request: libs.express.Request, application: libs.Application): boolean;
export declare function getEventName(request: libs.express.Request): string;
export declare const issueCommentEventName: string;
export declare const pullRequestEventName: string;
export declare function getIssueCommentOperator(request: libs.express.Request): string | number;
export declare function getPullRequestOperator(request: libs.express.Request): string | number;
export declare function getIssueComment(request: libs.express.Request): string;
export declare function getCommentCreationContext(request: libs.express.Request, application: libs.Application, operator: string | number): any;
export declare function getPullRequestAction(request: libs.express.Request): string;
export declare const pullRequestOpenActionName: string;
export declare const pullRequestUpdateActionName: string;
export declare function isPullRequestMerged(request: libs.express.Request, action: string): boolean;
export declare function isPullRequestClosed(request: libs.express.Request, action: string): boolean;
export declare function getPullRequestId(request: libs.express.Request): number;
export declare function getBranchName(request: libs.express.Request): string;
