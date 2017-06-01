import * as libs from "./libs";

const accessToken: string = process.env.DEPLOY_ROBOT_ACCESS_TOKEN;

export type Context = {
    owner: string;
    repo: string;
    issueNumber: number;
    author: string | number;
};

function getSignature(body: string, secret: string) {
    return "sha1=" + libs.crypto.createHmac("sha1", secret).update(body).digest("hex");
}

export function createComment(content: string, context: Context) {
    const url = `https://api.github.com/repos/${context.owner}/${context.repo}/issues/${context.issueNumber}/comments`;
    return new Promise<void>((resolve, reject) => {
        libs.request({
            url,
            method: "post",
            json: true,
            body: {
                body: `@${context.author}, ${content}`,
            },
            headers: {
                "Authorization": `token ${accessToken}`,
                "User-Agent": "SubsNoti-robot",
            },
        }, (error, incomingMessage, body) => {
            if (error) {
                // tslint:disable-next-line:no-console
                console.log(error);
            } else if (incomingMessage.statusCode !== 201) {
                // tslint:disable-next-line:no-console
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
    const signature = getSignature(JSON.stringify(request.body), application.hookSecret);
    return signature === remoteSignature;
}

export function getEventName(request: libs.express.Request) {
    return request.header("X-GitHub-Event");
}

export const commentEventName = "issue_comment";
export const pullRequestEventName = "pull_request";

export function getCommentAuthor(request: libs.express.Request): string | number {
    return request.body.comment.user.login;
}

export function getPullRequestAuthor(request: libs.express.Request): string | number {
    return request.body.pull_request.user.login;
}

export function getComment(request: libs.express.Request): string {
    return request.body.comment.body;
}

export function getCommentCreationContext(request: libs.express.Request, application: libs.Application): Context {
    return {
        owner: request.body.repository.owner.login,
        repo: application.repositoryName,
        issueNumber: request.body.issue.number,
        author: getCommentAuthor(request),
    };
}

export function getPullRequestCommentCreationContext(request: libs.express.Request, application: libs.Application): Context {
    return {
        owner: request.body.repository.owner.login,
        repo: application.repositoryName,
        issueNumber: request.body.pull_request.number,
        author: getPullRequestAuthor(request),
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

export function getHeadRepositoryCloneUrl(request: libs.express.Request): string {
    return request.body.pull_request.head.repo.clone_url;
}
