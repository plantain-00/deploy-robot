import * as libs from "./libs";
import * as settings from "./settings";
import * as deploy from "./deploy";

const gitlabHost = "https://gitlab.com";

interface Context {
    projectId: number;
    mergeRequestId: number;
}

function createComment(content: string, context: Context) {
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
                "PRIVATE-TOKEN": settings.privateToken,
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

export function getIssueComment(request: libs.express.Request): string {
    return request.body.object_attributes.note;
}

export async function publish(request: libs.express.Request, application: settings.Application, operator: string | number, comment: string) {
    const projectId: number = request.body.project_id;
    const mergeRequestId: number = request.body.merge_request.id;
    const command = {
        command: application.deployCommand,
        context: {
            projectId,
            mergeRequestId,
        },
    };
    await deploy.handle<Context>(comment, command, createComment);
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
