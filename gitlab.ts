import * as libs from "./libs";

const gitlabHost = "https://gitlab.com";
const privateToken: string = process.env.DEPLOY_ROBOT_PRIVATE_TOKEN;

export function createComment(content: string, context: {
    projectId: number;
    mergeRequestId: number;
}) {
    const url = `${gitlabHost}/api/v3/projects/${context.projectId}/merge_requests/${context.mergeRequestId}/notes`;
    return new Promise<void>((resolve, reject) => {
        libs.request({
            url: url,
            method: "post",
            json: true,
            body: {
                body: content,
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
    return token === application.secret;
}

export function getEventName(request: libs.express.Request) {
    return request.header("X-Gitlab-Event");
}

export const issueCommentEventName = "Note Hook";
export const pullRequestEventName = "Merge Request Hook";

export function getIssueCommentOperator(request: libs.express.Request): string | number {
    return request.body.object_attributes.author_id;
}

export function getPullRequestOperator(request: libs.express.Request): string | number {
    return request.body.object_attributes.author_id;
}

export function getIssueComment(request: libs.express.Request): string {
    return request.body.object_attributes.note;
}

export function getCommentCreationContext(request: libs.express.Request, application: libs.Application, operator: string | number): any {
    return {
        projectId: request.body.project_id,
        mergeRequestId: request.body.merge_request.id,
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
