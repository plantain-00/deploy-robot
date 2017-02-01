import * as libs from "./libs";
import * as github from "./github";
import * as gitlab from "./gitlab";

/**
 * the `applications` configurations,
 * you can set `repositoryName`, `secret` and so on.
 */
export const applications: libs.Application[] = [];

/**
 * the mode handlers, there are `github` and `gitlab` handlers inside.
 * you can push other handers in it
 */
export const handlers: { [modeName: string]: Handler } = { github, gitlab };

export const commentActions: { filter: (comment: string) => boolean; getCommand: (application: libs.Application, request: libs.express.Request) => Promise<string> | string; }[] = [
    {
        filter: comment => comment.indexOf("robot") >= 0
            && comment.indexOf("deploy") >= 0
            && comment.indexOf("please") >= 0,
        getCommand: (application, issueCommentCreationContext) => {
            return application.commentDeploy.command;
        },
    },
];

let handler: Handler;
export let ports: Ports = {};
let onPortsUpdated: () => Promise<void> = () => Promise.resolve();

/**
 * commands are designed be excuted one by one in a process globally.
 */
let isExecuting = false;
export let commands: Command[] = [];
let onCommandsUpdated: () => Promise<void> = () => Promise.resolve();

async function runCommands() {
    if (!isExecuting) {
        isExecuting = true;
        while (commands.length > 0) {
            console.log(`there are ${commands.length} commands.`);
            const firstCommand = commands[0];
            try {
                await libs.exec(firstCommand.command);
                const newCommands: Command[] = [];
                for (const c of commands) {
                    if (c.command === firstCommand.command) {
                        await handler.createComment(c.context.doneText || "it's done now.", c.context);
                    } else {
                        newCommands.push(c);
                    }
                }

                commands = newCommands;
                await onCommandsUpdated();
            } catch (error) {
                console.log(error);
                await handler.createComment(error, firstCommand.context);
                commands = commands.splice(1);
            }
        }
        isExecuting = false;
    }
}

export function start(app: libs.express.Application, path: string, mode: string, options?: {
    initialCommands: Command[];
    initialPorts: Ports;
    onCommandsUpdated: () => Promise<void>;
    onPortsUpdated: () => Promise<void>;
}) {
    handler = handlers[mode];
    if (!handler) {
        console.log(`mode "${mode}"" is not found in "handlers".`);
        process.exit(1);
    }

    if (options) {
        if (options.initialCommands) {
            commands = options.initialCommands;
        }
        if (options.initialPorts) {
            ports = options.initialPorts;
        }
        if (options.onCommandsUpdated) {
            onCommandsUpdated = options.onCommandsUpdated;
        }
        if (options.onPortsUpdated) {
            onPortsUpdated = options.onPortsUpdated;
        }
    }

    app.post(path, async (request, response) => {
        try {
            const repositoryName = handler.getRepositoryName(request);
            const application = applications.find((value, index, obj) => value.repositoryName === repositoryName);
            if (!application) {
                response.end("name of repository is not found");
                return;
            }
            if (!ports[repositoryName]) {
                ports[repositoryName] = {};
                await onPortsUpdated();
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
                for (const commentAction of commentActions) {
                    if (commentAction.filter(comment)) {
                        response.end("command accepted");
                        const context = handler.getIssueCommentCreationContext(request, application, operator);
                        const command = await commentAction.getCommand(application, request);
                        commands.push({ command, context });
                        await onCommandsUpdated();
                        await handler.createComment("it may take a few minutes to finish it.", context);
                        await runCommands();
                        return;
                    }
                }
                response.end("not a command");
            } else if (eventName === handler.pullRequestEventName) {
                response.end("command accepted");
                const action = handler.getPullRequestAction(request);
                const operator = handler.getPullRequestOperator(request);
                const pullRequestId = handler.getPullRequestId(request);
                const context = handler.getPullRequestCommentCreationContext(request, application, operator);
                if (action === handler.pullRequestOpenActionName) {
                    const availablePort = await libs.getPort();
                    ports[repositoryName][pullRequestId] = availablePort;
                    await onPortsUpdated();
                    const branchName = handler.getBranchName(request);
                    context.doneText = `it's done now. you can test it at ${application.pullRequest.testRootUrl}:${availablePort}`;
                    commands.push({ command: `${application.pullRequest.openedCommand} ${availablePort} ${branchName}`, context });
                } else if (action === handler.pullRequestUpdateActionName) {
                    const port = ports[repositoryName][pullRequestId];
                    if (!port) {
                        response.end(`no pull request: ${pullRequestId}.`);
                        return;
                    }
                    commands.push({ command: `${application.pullRequest.updatedCommand} ${port}`, context });
                } else if (handler.isPullRequestMerged) {
                    const port = ports[repositoryName][pullRequestId];
                    if (!port) {
                        response.end(`no pull request: ${pullRequestId}.`);
                        return;
                    }
                    commands.push({ command: `${application.pullRequest.mergedCommand} ${port}`, context });
                } else if (handler.isPullRequestClosed) {
                    const port = ports[repositoryName][pullRequestId];
                    if (!port) {
                        response.end(`no pull request: ${pullRequestId}.`);
                        return;
                    }
                    commands.push({ command: `${application.pullRequest.closedCommand} ${port}`, context });
                } else {
                    response.end(`can not handle action: ${action}.`);
                    return;
                }
                await onCommandsUpdated();
                await handler.createComment("it may take a few minutes to finish it.", context);
                await runCommands();
            } else {
                response.end(`can not handle event: ${eventName}.`);
            }
        } catch (error) {
            console.log(error);
            response.end(error.toString());
        }
    });
}

export type Handler = {
    issueCommentEventName: string;
    pullRequestEventName: string;
    pullRequestOpenActionName: string;
    pullRequestUpdateActionName: string;
    getRepositoryName(request: libs.express.Request): string;
    verifySignature(request: libs.express.Request, application: libs.Application): boolean;
    getEventName(request: libs.express.Request): string;
    getIssueCommentOperator(request: libs.express.Request): string | number;
    getIssueComment(request: libs.express.Request): string;
    getIssueCommentCreationContext(request: libs.express.Request, application: libs.Application, operator: string | number): any;
    getPullRequestCommentCreationContext(request: libs.express.Request, application: libs.Application, operator: string | number): any;
    getPullRequestAction(request: libs.express.Request): string;
    isPullRequestMerged(request: libs.express.Request, action: string): boolean;
    isPullRequestClosed(request: libs.express.Request, action: string): boolean;
    createComment(content: string, context: any): Promise<void>;
    getPullRequestOperator(request: libs.express.Request): string | number;
    getPullRequestId(request: libs.express.Request): number;
    getBranchName(request: libs.express.Request): string;
};

export type Command = {
    context: any;
    command: string;
};

export type Ports = { [repositoryName: string]: { [pullRequestId: number]: number } };
