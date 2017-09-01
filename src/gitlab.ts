import * as libs from "./libs";

const gitlabHost = "https://gitlab.com";
const privateToken = process.env.DEPLOY_ROBOT_PRIVATE_TOKEN;

export const gitlabHander: libs.Handler<Context> = {
    createComment(content: string, context: Context) {
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
                    libs.printInConsole(error);
                } else if (incomingMessage.statusCode !== 201) {
                    libs.printInConsole(body);
                }

                resolve();
            });
        });
    },
    getRepositoryName(request: libs.express.Request): string {
        return request.body.repository.name;
    },
    verifySignature(request: libs.express.Request, application: libs.Application) {
        const token = request.header("X-Gitlab-Token");
        return token === application.hookSecret;
    },
    getEventName(request: libs.express.Request) {
        return request.header("X-Gitlab-Event");
    },
    commentEventName: "Note Hook",
    pullRequestEventName: "Merge Request Hook",
    getCommentAuthor(request: libs.express.Request): string | number {
        return request.body.object_attributes.author_id;
    },
    getPullRequestAuthor(request: libs.express.Request): string | number {
        return request.body.object_attributes.author_id;
    },
    getComment(request: libs.express.Request): string {
        return request.body.object_attributes.note;
    },
    getCommentCreationContext(request: libs.express.Request, application: libs.Application): Context {
        return {
            projectId: request.body.project_id,
            mergeRequestId: request.body.merge_request.id,
            author: gitlabHander.getCommentAuthor(request),
        };
    },
    getPullRequestCommentCreationContext(request: libs.express.Request, application: libs.Application): Context {
        return {
            projectId: request.body.project_id,
            mergeRequestId: request.body.merge_request.id,
            author: gitlabHander.getPullRequestAuthor(request),
        };
    },
    getPullRequestAction(request: libs.express.Request): string {
        return request.body.object_attributes.action;
    },
    pullRequestOpenActionName: "open",
    pullRequestUpdateActionName: "update",
    isPullRequestMerged(request: libs.express.Request, action: string): boolean {
        return action === "merge";
    },
    isPullRequestClosed(request: libs.express.Request, action: string): boolean {
        return action === "close";
    },
    getPullRequestId(request: libs.express.Request): number {
        return request.body.object_attributes.id;
    },
    getBranchName(request: libs.express.Request): string {
        return request.body.object_attributes.source_branch;
    },
    getHeadRepositoryCloneUrl(request: libs.express.Request): string {
        return request.body.object_attributes.source.git_http_url;
    },
};

export type Context = {
    projectId: number;
    mergeRequestId: number;
    author: string | number;
};
