import * as libs from "./libs";
import * as settings from "./settings";
import * as deploy from "./deploy";

function getSignature(body: string, secret: string) {
    return "sha1=" + libs.cryptoJs.HmacSHA1(body, secret).toString();
}

interface Context {
    owner: string;
    repo: string;
    issueNumber: number;
    operator: string;
}

function createComment(content: string, context: Context) {
    const url = `https://api.github.com/repos/${context.owner}/${context.repo}/issues/${context.issueNumber}/comments`;
    return new Promise<void>((resolve, reject) => {
        libs.request({
            url: url,
            method: "post",
            json: true,
            body: {
                body: `@${context.operator}, ${content}`,
            },
            headers: {
                Authorization: `token ${settings.accessToken}`,
                "User-Agent": "SubsNoti-robot",
            },
        }, (error, incomingMessage, body) => {
            if (error) {
                console.log(error);
            } else if (incomingMessage.statusCode !== 201) {
                console.log(body);
            }

            resolve();
        });
    });
}

export function getRepositoryName(request: libs.express.Request): string {
    return request.body.repository.name;
}

export function verifySignature(request: libs.express.Request, application: settings.Application) {
    const remoteSignature: string = request.header("X-Hub-Signature");
    const signature = getSignature(JSON.stringify(request.body), application.secret);
    return signature === remoteSignature;
}

export function getEventName(request: libs.express.Request) {
    return request.header("X-GitHub-Event");
}

export const issueCommentEventName = "issue_comment";
export const pullRequestEventName = "pull_request";

export function getIssueCommentOperator(request: libs.express.Request): string | number {
    return request.body.comment.user.login;
}

export function getIssueComment(request: libs.express.Request): string {
    return request.body.comment.body;
}

export async function publish(request: libs.express.Request, application: settings.Application, operator: string | number, comment: string) {
    const ownerName: string = request.body.repository.owner.login;
    const issueNumber: number = request.body.issue.number;
    const command = {
        command: application.deployCommand,
        context: {
            owner: ownerName,
            repo: application.repositoryName,
            issueNumber,
            operator: operator as string,
        },
    };
    await deploy.handle<Context>(comment, command, createComment);
}

export function getPullRequestAction(request: libs.express.Request): string {
    return request.body.action;
}

export const pullRequestOpenActionName = "opened";
export const pullRequestUpdateActionName = "synchronized";

export function isPullRequestMerged(request: libs.express.Request, action: string): boolean {
    if (action === "closed") {
        return request.body.pull_request.merged;
    }
    return false;
}

export function isPullRequestClosed(request: libs.express.Request, action: string): boolean {
    if (action === "closed") {
        return !request.body.pull_request.merged;
    }
    return false;
}

export function pullRequestOpened(request: libs.express.Request, application: settings.Application) {
    // todo
}

export function pullRequestUpdated(request: libs.express.Request, application: settings.Application) {
    // todo
}

export function pullRequestMerged(request: libs.express.Request, application: settings.Application) {
    // todo
}

export function pullRequestClosed(request: libs.express.Request, application: settings.Application) {
    // todo
}
