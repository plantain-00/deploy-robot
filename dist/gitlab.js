"use strict";
const libs = require("./libs");
const gitlabHost = "https://gitlab.com";
const privateToken = process.env.DEPLOY_ROBOT_PRIVATE_TOKEN;
function createComment(content, context) {
    const url = `${gitlabHost}/api/v3/projects/${context.projectId}/merge_requests/${context.mergeRequestId}/notes`;
    return new Promise((resolve, reject) => {
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
            }
            else if (incomingMessage.statusCode !== 201) {
                console.log(body);
            }
            resolve();
        });
    });
}
exports.createComment = createComment;
function getRepositoryName(request) {
    return request.body.repository.name;
}
exports.getRepositoryName = getRepositoryName;
function verifySignature(request, application) {
    const token = request.header("X-Gitlab-Token");
    return token === application.secret;
}
exports.verifySignature = verifySignature;
function getEventName(request) {
    return request.header("X-Gitlab-Event");
}
exports.getEventName = getEventName;
exports.issueCommentEventName = "Note Hook";
exports.pullRequestEventName = "Merge Request Hook";
function getIssueCommentOperator(request) {
    return request.body.object_attributes.author_id;
}
exports.getIssueCommentOperator = getIssueCommentOperator;
function getPullRequestOperator(request) {
    return request.body.object_attributes.author_id;
}
exports.getPullRequestOperator = getPullRequestOperator;
function getIssueComment(request) {
    return request.body.object_attributes.note;
}
exports.getIssueComment = getIssueComment;
function getCommentCreationContext(request, application, operator) {
    return {
        projectId: request.body.project_id,
        mergeRequestId: request.body.merge_request.id,
    };
}
exports.getCommentCreationContext = getCommentCreationContext;
function getPullRequestAction(request) {
    return request.body.object_attributes.action;
}
exports.getPullRequestAction = getPullRequestAction;
exports.pullRequestOpenActionName = "open";
exports.pullRequestUpdateActionName = "update";
function isPullRequestMerged(request, action) {
    return action === "merge";
}
exports.isPullRequestMerged = isPullRequestMerged;
function isPullRequestClosed(request, action) {
    return action === "close";
}
exports.isPullRequestClosed = isPullRequestClosed;
function getPullRequestId(request) {
    return request.body.object_attributes.id;
}
exports.getPullRequestId = getPullRequestId;
//# sourceMappingURL=gitlab.js.map