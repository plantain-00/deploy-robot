import * as libs from "./libs";

interface Command<T> {
    context: T;
    command: string;
}

let commands: Command<any>[] = [];

/**
 * commands should be excuted one by one in a process globally.
 */
let isExecuting = false;

export function isThis(comment: string) {
    return comment.indexOf("robot") >= 0
        && comment.indexOf("deploy") >= 0
        && comment.indexOf("please") >= 0;
}

export async function handle<T>(comment: string, command: Command<T>, createComment: (content: string, context: T) => Promise<void>) {
    commands.push(command);

    await createComment("it may take a few minutes to finish it.", commands[commands.length - 1].context);

    if (!isExecuting) {
        isExecuting = true;
        while (commands.length > 0) {
            console.log(`there are ${commands.length} commands.`);
            const firstCommand = commands[0];
            try {
                await libs.exec(firstCommand.command);
                const newCommands: Command<T>[] = [];
                for (const c of commands) {
                    if (c.command === firstCommand.command) {
                        await createComment("it's done now.", c.context);
                    } else {
                        newCommands.push(c);
                    }
                }

                commands = newCommands;
            } catch (error) {
                console.log(error);
                await createComment(error, firstCommand.context);
            }
        }
        isExecuting = false;
    }
}
