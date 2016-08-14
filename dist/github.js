"use strict";
const libs = require("./libs");
const accessToken = process.env.DEPLOY_ROBOT_ACCESS_TOKEN;
function getSignature(body, secret) {
    return "sha1=" + libs.cryptoJs.HmacSHA1(body, secret).toString();
}
function createComment(content, context) {
    const url = `https://api.github.com/repos/${context.owner}/${context.repo}/issues/${context.issueNumber}/comments`;
    return new Promise((resolve, reject) => {
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
    const remoteSignature = request.header("X-Hub-Signature");
    const signature = getSignature(JSON.stringify(request.body), application.secret);
    return signature === remoteSignature;
}
exports.verifySignature = verifySignature;
function getEventName(request) {
    return request.header("X-GitHub-Event");
}
exports.getEventName = getEventName;
exports.issueCommentEventName = "issue_comment";
exports.pullRequestEventName = "pull_request";
function getIssueCommentOperator(request) {
    return request.body.comment.user.login;
}
exports.getIssueCommentOperator = getIssueCommentOperator;
function getPullRequestOperator(request) {
    return request.body.pull_request.user.login;
}
exports.getPullRequestOperator = getPullRequestOperator;
function getIssueComment(request) {
    return request.body.comment.body;
}
exports.getIssueComment = getIssueComment;
function getCommentCreationContext(request, application, operator) {
    return {
        owner: request.body.repository.owner.login,
        repo: application.repositoryName,
        issueNumber: request.body.issue.number,
        operator,
    };
}
exports.getCommentCreationContext = getCommentCreationContext;
function getPullRequestAction(request) {
    return request.body.action;
}
exports.getPullRequestAction = getPullRequestAction;
exports.pullRequestOpenActionName = "opened";
exports.pullRequestUpdateActionName = "synchronized";
function isPullRequestMerged(request, action) {
    if (action === "closed") {
        return request.body.pull_request.merged;
    }
    return false;
}
exports.isPullRequestMerged = isPullRequestMerged;
function isPullRequestClosed(request, action) {
    if (action === "closed") {
        return !request.body.pull_request.merged;
    }
    return false;
}
exports.isPullRequestClosed = isPullRequestClosed;
function getPullRequestId(request) {
    return request.body.pull_request.id;
}
exports.getPullRequestId = getPullRequestId;
function getBranchName(request) {
    return request.body.pull_request.head.ref;
}
exports.getBranchName = getBranchName;
//# sourceMappingURL=github.js.map