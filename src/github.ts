import * as libs from "./libs";

const accessToken: string = process.env.DEPLOY_ROBOT_ACCESS_TOKEN;

function getSignature(body: string, secret: string) {
    return "sha1=" + libs.crypto.createHmac("sha1", secret).update(body).digest("hex");
}

export function createComment(content: string, context: {
    owner: string;
    repo: string;
    issueNumber: number;
    operator: string;
}) {
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
                Authorization: `token ${accessToken}`,
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

export function verifySignature(request: libs.express.Request, application: libs.Application) {
    const remoteSignature: string = request.header("X-Hub-Signature");
    const signature = getSignature(JSON.stringify(request.body), application.robot.secret);
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

export function getPullRequestOperator(request: libs.express.Request): string | number {
    return request.body.pull_request.user.login;
}

export function getIssueComment(request: libs.express.Request): string {
    return request.body.comment.body;
}

export function getIssueCommentCreationContext(request: libs.express.Request, application: libs.Application, operator: string | number): any {
    return {
        owner: request.body.repository.owner.login,
        repo: application.repositoryName,
        issueNumber: request.body.issue.number,
        operator,
    };
}

export function getPullRequestCommentCreationContext(request: libs.express.Request, application: libs.Application, operator: string | number): any {
    return {
        owner: request.body.repository.owner.login,
        repo: application.repositoryName,
        issueNumber: request.body.pull_request.number,
        operator,
    };
}

export function getPullRequestAction(request: libs.express.Request): string {
    return request.body.action;
}

export const pullRequestOpenActionName = "opened";
export const pullRequestUpdateActionName = "synchronize";

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

export function getPullRequestId(request: libs.express.Request): number {
    return request.body.pull_request.id;
}

export function getBranchName(request: libs.express.Request): string {
    return request.body.pull_request.head.ref;
}
