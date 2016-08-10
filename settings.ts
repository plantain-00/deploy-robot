import * as libs from "./libs";

/**
 * operators: for github, it's name; for gitlab, it's id, can be found in the html
 */
export interface Application {
    repositoryName: string;
    secret: string;
    operators: (string | number)[];
    deployCommand: string;
    pullRequestMergedCommand: string;
    pullRequestOpenedCommand: string;
    pullRequestClosedCommand: string;
    pullRequestUpdatedCommand: string;
}

export const applications: Application[] = [];

// github:
export let accessToken: string = process.env.DEPLOY_ROBOT_ACCESS_TOKEN;

// gitlab:
export let privateToken: string = process.env.DEPLOY_ROBOT_PRIVATE_TOKEN;

export let type: "github" | "gitlab" = "github";

interface Handler {
    issueCommentEventName: string;
    pullRequestEventName: string;
    pullRequestOpenActionName: string;
    pullRequestUpdateActionName: string;
    getRepositoryName(request: libs.express.Request): string;
    verifySignature(request: libs.express.Request, application: Application): boolean;
    getEventName(request: libs.express.Request): string;
    getIssueCommentOperator(request: libs.express.Request): string | number;
    getIssueComment(request: libs.express.Request): string;
    getCommentCreationContext(request: libs.express.Request, application: Application, operator: string | number): any;
    getPullRequestAction(request: libs.express.Request): string;
    isPullRequestMerged(request: libs.express.Request, action: string): boolean;
    isPullRequestClosed(request: libs.express.Request, action: string): boolean;
    createComment(content: string, context: any): Promise<void>;
    getPullRequestOperator(request: libs.express.Request): string | number;
}

export let handler: Handler;
export function setHandler(_handler: Handler) {
    handler = _handler;
}

export interface Command {
    context: any;
    command: string;
}

export let commands: Command[] = [];

/**
 * commands are designed be excuted one by one in a process globally.
 */
export let isExecuting = false;

export async function runCommands() {
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
                        await handler.createComment("it's done now.", c.context);
                    } else {
                        newCommands.push(c);
                    }
                }

                commands = newCommands;
            } catch (error) {
                console.log(error);
                await handler.createComment(error, firstCommand.context);
            }
        }
        isExecuting = false;
    }
}
