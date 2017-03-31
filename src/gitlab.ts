import * as libs from "./libs";

const gitlabHost = "https://gitlab.com";
const privateToken: string = process.env.DEPLOY_ROBOT_PRIVATE_TOKEN;

export interface Context {
    projectId: number;
    mergeRequestId: number;
    author: string | number;
}

export function createComment(content: string, context: Context) {
    const url = `${gitlabHost}/api/v3/projects/${context.projectId}/merge_requests/${context.mergeRequestId}/notes`;
    return new Promise<void>((resolve, reject) => {
        libs.request({
            url,
            method: "post",
            json: true,
            body: {
                body: `@${context.author}, ${content}`,
            },
            headers: {
                "PRIVATE-TOKEN": privateToken,
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
    const token = request.header("X-Gitlab-Token");
    return token === application.hookSecret;
}

export function getEventName(request: libs.express.Request) {
    return request.header("X-Gitlab-Event");
}

export const commentEventName = "Note Hook";
export const pullRequestEventName = "Merge Request Hook";

export function getCommentAuthor(request: libs.express.Request): string | number {
    return request.body.object_attributes.author_id;
}

export function getPullRequestAuthor(request: libs.express.Request): string | number {
    return request.body.object_attributes.author_id;
}

export function getComment(request: libs.express.Request): string {
    return request.body.object_attributes.note;
}

export function getCommentCreationContext(request: libs.express.Request, application: libs.Application): Context {
    return {
        projectId: request.body.project_id,
        mergeRequestId: request.body.merge_request.id,
        author: getCommentAuthor(request),
    };
}

export function getPullRequestCommentCreationContext(request: libs.express.Request, application: libs.Application): Context {
    return {
        projectId: request.body.project_id,
        mergeRequestId: request.body.merge_request.id,
        author: getPullRequestAuthor(request),
    };
}

export function getPullRequestAction(request: libs.express.Request): string {
    return request.body.object_attributes.action;
}

export const pullRequestOpenActionName = "open";
export const pullRequestUpdateActionName = "update";

export function isPullRequestMerged(request: libs.express.Request, action: string): boolean {
    return action === "merge";
}

export function isPullRequestClosed(request: libs.express.Request, action: string): boolean {
    return action === "close";
}

export function getPullRequestId(request: libs.express.Request): number {
    return request.body.object_attributes.id;
}

export function getBranchName(request: libs.express.Request): string {
    return request.body.object_attributes.source_branch;
}

export function getHeadRepositoryCloneUrl(request: libs.express.Request): string {
    return request.body.object_attributes.source.git_http_url;
}
