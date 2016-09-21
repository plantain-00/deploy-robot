"use strict";
const libs = require("./libs");
const github = require("./github");
const gitlab = require("./gitlab");
/**
 * the `applications` configurations,
 * you can set `repositoryName`, `secret` and so on.
 */
exports.applications = [];
/**
 * the mode handlers, there are `github` and `gitlab` handlers inside.
 * you can push other handers in it
 */
exports.handlers = { github, gitlab };
exports.commentActions = [
    {
        filter: comment => comment.indexOf("robot") >= 0
            && comment.indexOf("deploy") >= 0
            && comment.indexOf("please") >= 0,
        getCommand: (application, issueCommentCreationContext) => {
            return application.commentDeploy.command;
        },
    },
];
let handler;
exports.ports = {};
let onPortsUpdated = () => Promise.resolve();
/**
 * commands are designed be excuted one by one in a process globally.
 */
let isExecuting = false;
exports.commands = [];
let onCommandsUpdated = () => Promise.resolve();
function runCommands() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!isExecuting) {
            isExecuting = true;
            while (exports.commands.length > 0) {
                console.log(`there are ${exports.commands.length} commands.`);
                const firstCommand = exports.commands[0];
                try {
                    yield libs.exec(firstCommand.command);
                    const newCommands = [];
                    for (const c of exports.commands) {
                        if (c.command === firstCommand.command) {
                            yield handler.createComment(c.context.doneText || "it's done now.", c.context);
                        }
                        else {
                            newCommands.push(c);
                        }
                    }
                    exports.commands = newCommands;
                    yield onCommandsUpdated();
                }
                catch (error) {
                    console.log(error);
                    yield handler.createComment(error, firstCommand.context);
                    exports.commands = exports.commands.splice(1);
                }
            }
            isExecuting = false;
        }
    });
}
function start(app, path, mode, options) {
    handler = exports.handlers[mode];
    if (!handler) {
        console.log(`mode "${mode}"" is not found in "handlers".`);
        process.exit(1);
    }
    if (options) {
        if (options.initialCommands) {
            exports.commands = options.initialCommands;
        }
        if (options.initialPorts) {
            exports.ports = options.initialPorts;
        }
        if (options.onCommandsUpdated) {
            onCommandsUpdated = options.onCommandsUpdated;
        }
        if (options.onPortsUpdated) {
            onPortsUpdated = options.onPortsUpdated;
        }
    }
    app.post(path, (request, response) => __awaiter(this, void 0, void 0, function* () {
        try {
            const repositoryName = handler.getRepositoryName(request);
            const application = exports.applications.find((value, index, obj) => value.repositoryName === repositoryName);
            if (!application) {
                response.end("name of repository is not found");
                return;
            }
            if (!exports.ports[repositoryName]) {
                exports.ports[repositoryName] = {};
                yield onPortsUpdated();
            }
            const signatureIsValid = handler.verifySignature(request, application);
            if (!signatureIsValid) {
                response.end("signatures don't match");
                return;
            }
            const eventName = handler.getEventName(request);
            if (eventName === handler.issueCommentEventName) {
                const operator = handler.getIssueCommentOperator(request);
                if (application.commentDeploy.operators.findIndex(value => value === operator) < 0) {
                    response.end("not valid operator");
                    return;
                }
                const comment = handler.getIssueComment(request);
                for (const commentAction of exports.commentActions) {
                    if (commentAction.filter(comment)) {
                        response.end("command accepted");
                        const context = handler.getIssueCommentCreationContext(request, application, operator);
                        const command = yield commentAction.getCommand(application, request);
                        exports.commands.push({ command, context });
                        yield onCommandsUpdated();
                        yield handler.createComment("it may take a few minutes to finish it.", context);
                        yield runCommands();
                        return;
                    }
                }
                response.end("not a command");
            }
            else if (eventName === handler.pullRequestEventName) {
                response.end("command accepted");
                const action = handler.getPullRequestAction(request);
                const operator = handler.getPullRequestOperator(request);
                const pullRequestId = handler.getPullRequestId(request);
                const context = handler.getPullRequestCommentCreationContext(request, application, operator);
                if (action === handler.pullRequestOpenActionName) {
                    const availablePort = yield libs.getPort();
                    exports.ports[repositoryName][pullRequestId] = availablePort;
                    yield onPortsUpdated();
                    const branchName = handler.getBranchName(request);
                    context.doneText = `it's done now. you can test it at ${application.pullRequest.testRootUrl}:${availablePort}`;
                    exports.commands.push({ command: `${application.pullRequest.openedCommand} ${availablePort} ${branchName}`, context });
                }
                else if (action === handler.pullRequestUpdateActionName) {
                    const port = exports.ports[repositoryName][pullRequestId];
                    if (!port) {
                        response.end(`no pull request: ${pullRequestId}.`);
                        return;
                    }
                    exports.commands.push({ command: `${application.pullRequest.updatedCommand} ${port}`, context });
                }
                else if (handler.isPullRequestMerged) {
                    const port = exports.ports[repositoryName][pullRequestId];
                    if (!port) {
                        response.end(`no pull request: ${pullRequestId}.`);
                        return;
                    }
                    exports.commands.push({ command: `${application.pullRequest.mergedCommand} ${port}`, context });
                }
                else if (handler.isPullRequestClosed) {
                    const port = exports.ports[repositoryName][pullRequestId];
                    if (!port) {
                        response.end(`no pull request: ${pullRequestId}.`);
                        return;
                    }
                    exports.commands.push({ command: `${application.pullRequest.closedCommand} ${port}`, context });
                }
                else {
                    response.end(`can not handle action: ${action}.`);
                    return;
                }
                yield onCommandsUpdated();
                yield handler.createComment("it may take a few minutes to finish it.", context);
                yield runCommands();
            }
            else {
                response.end(`can not handle event: ${eventName}.`);
            }
        }
        catch (error) {
            console.log(error);
            response.end(error.toString());
        }
    }));
}
exports.start = start;
//# sourceMappingURL=robot.js.map