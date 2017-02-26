import * as libs from "./libs";
import * as github from "./github";
import * as gitlab from "./gitlab";
import { applications, commentActions } from "./config";

/**
 * the mode handlers, there are `github` and `gitlab` handlers inside.
 * you can push other handers in it
 */
export const handlers: { [modeName: string]: Handler } = { github, gitlab };

let handler: Handler;
export let ports: Ports = {};
let onPortsUpdated: () => Promise<void> = () => Promise.resolve();

/**
 * commands are designed be excuted one by one in a process globally.
 */
let isExecuting = false;
export let commands: Command[] = [];
let onCommandsUpdated: () => Promise<void> = () => Promise.resolve();
export const failedCommands: { command: Command, error: Error }[] = [];

async function runCommands() {
    if (!isExecuting) {
        isExecuting = true;
        while (commands.length > 0) {
            console.log(`there are ${commands.length} commands.`);
            const firstCommand = commands.shift() !;
            try {
                await libs.exec(firstCommand.command);
                await handler.createComment(firstCommand.context.doneText || "it's done now.", firstCommand.context);
                await onCommandsUpdated();
            } catch (error) {
                console.log(error);
                failedCommands.push({ command: firstCommand, error });
                await handler.createComment(error, firstCommand.context);
            }
        }
        isExecuting = false;
    }
}

export function start(app: libs.express.Application, path: string, mode: string, options?: Partial<{
    initialCommands: Command[];
    initialPorts: Ports;
    onCommandsUpdated: () => Promise<void>;
    onPortsUpdated: () => Promise<void>;
}>) {
    handler = handlers[mode];
    if (!handler) {
        console.log(`mode "${mode}" is not found in "handlers".`);
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

    app.get(path, (request, response) => {
        response.send(JSON.stringify(commands, null, "  "));
    });

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
                    context.doneText = `the test application is created now, you can test it at ${application.pullRequest.getTestUrl(availablePort, pullRequestId)}`;
                    commands.push({ command: `${application.pullRequest.openedCommand} ${availablePort} ${branchName} ${pullRequestId}`, context });
                } else if (action === handler.pullRequestUpdateActionName) {
                    const port = ports[repositoryName][pullRequestId];
                    if (!port) {
                        response.end(`no pull request: ${pullRequestId}.`);
                        return;
                    }
                    context.doneText = "the test application is updated now, the test url is still available";
                    commands.push({ command: `${application.pullRequest.updatedCommand} ${port} ${pullRequestId}`, context });
                } else if (handler.isPullRequestMerged) {
                    const port = ports[repositoryName][pullRequestId];
                    if (!port) {
                        response.end(`no pull request: ${pullRequestId}.`);
                        return;
                    }
                    context.doneText = "the test application is destroyed and not available now";
                    commands.push({ command: `${application.pullRequest.mergedCommand} ${port} ${pullRequestId}`, context });
                } else if (handler.isPullRequestClosed) {
                    const port = ports[repositoryName][pullRequestId];
                    if (!port) {
                        response.end(`no pull request: ${pullRequestId}.`);
                        return;
                    }
                    context.doneText = "the test application is destroyed and not available now";
                    commands.push({ command: `${application.pullRequest.closedCommand} ${port} ${pullRequestId}`, context });
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
