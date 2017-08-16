import * as libs from "./libs";
import * as github from "./github";
import * as gitlab from "./gitlab";
import * as config from "./config";
import { getLocale } from "./locale";

const app = libs.express();
app.use(libs.bodyParser.json());
app.use(libs.bodyParser.urlencoded({ extended: true }));

const locale = getLocale(config.localeName);

const handlers: { [modeName: string]: libs.Handler<Context> } = {
    github: github.githubHander,
    gitlab: gitlab.gitlabHander,
};
const handler = handlers[config.mode];
if (!handler) {
    libs.printInConsole(`mode "${config.mode}" is not found in "handlers".`);
    process.exit(1);
}

let isExecuting = false; // commands are designed be excuted one by one in a process globally.
const commands: Command[] = [];
const failedCommands: { command: Command, error: Error }[] = [];
async function runCommands() {
    if (!isExecuting) {
        isExecuting = true;
        while (commands.length > 0) {
            const firstCommand = commands.shift()!;
            try {
                await libs.exec(firstCommand.command);
                await handler.createComment(firstCommand.context.doneText!, firstCommand.context);
            } catch (error) {
                libs.printInConsole(error);
                failedCommands.push({ command: firstCommand, error });
                await handler.createComment(error, firstCommand.context);
            }
        }
        isExecuting = false;
    }
}

const dataFilePath = "ports.data";
let ports: Ports;
try {
    const data = libs.fs.readFileSync(dataFilePath, "utf8");
    ports = JSON.parse(data);
} catch (error) {
    libs.printInConsole(error);
    ports = {};
}

function savePorts() {
    return libs.writeAsync(dataFilePath, JSON.stringify(ports));
}

app.get("/", (request, response) => {
    response.send(`<pre>${JSON.stringify({ commands, ports }, null, "  ")}</pre>`);
});

app.post("/", async (request, response) => {
    try {
        const repositoryName = handler.getRepositoryName(request);
        const application = config.applications.find((value, index, obj) => value.repositoryName === repositoryName);
        if (!application) {
            response.end("name of repository is not found");
            return;
        }
        if (!ports[repositoryName]) {
            ports[repositoryName] = {};
            await savePorts();
        }
        const signatureIsValid = handler.verifySignature(request, application);
        if (!signatureIsValid) {
            response.end("signatures don't match");
            return;
        }
        const eventName = handler.getEventName(request);
        if (eventName === handler.commentEventName) {
            const author = handler.getCommentAuthor(request);
            const comment = handler.getComment(request);
            for (const commentAction of application.commentActions) {
                if (commentAction.filter(comment, author)) {
                    response.end("command accepted");
                    const context = handler.getCommentCreationContext(request, application);
                    commands.push({ command: commentAction.command, context });
                    context.doneText = commentAction.doneMessage;
                    await handler.createComment(commentAction.gotMessage, context);
                    await runCommands();
                    return;
                }
            }
            response.end("not a command");
        } else if (eventName === handler.pullRequestEventName) {
            response.end("command accepted");
            const action = handler.getPullRequestAction(request);
            const pullRequestId = handler.getPullRequestId(request);
            const context = handler.getPullRequestCommentCreationContext(request, application);
            if (action === handler.pullRequestOpenActionName) {
                const availablePort = await libs.getPort();
                ports[repositoryName][pullRequestId] = availablePort;
                await savePorts();
                const branchName = handler.getBranchName(request);
                const cloneUrl = handler.getHeadRepositoryCloneUrl(request);
                await handler.createComment(locale.pullRequestOpenedGot, context);
                context.doneText = locale.pullRequestOpenedDone.replace("{0}", application.pullRequest.getTestUrl(availablePort, pullRequestId));
                commands.push({ command: `${application.pullRequest.openedCommand} ${availablePort} ${branchName} ${pullRequestId} ${cloneUrl}`, context });
            } else if (action === handler.pullRequestUpdateActionName) {
                const port = ports[repositoryName][pullRequestId];
                if (!port) {
                    response.end(`no pull request: ${pullRequestId}.`);
                    return;
                }
                await handler.createComment(locale.pullRequestUpdatedGot, context);
                context.doneText = locale.pullRequestUpdatedDone;
                commands.push({ command: `${application.pullRequest.updatedCommand} ${port} ${pullRequestId}`, context });
            } else if (handler.isPullRequestMerged) {
                const port = ports[repositoryName][pullRequestId];
                if (!port) {
                    response.end(`no pull request: ${pullRequestId}.`);
                    return;
                }
                delete ports[repositoryName][pullRequestId];
                await savePorts();
                await handler.createComment(locale.pullRequestMergedGot, context);
                context.doneText = locale.pullRequestMergedDone;
                commands.push({ command: `${application.pullRequest.mergedCommand} ${port} ${pullRequestId}`, context });
            } else if (handler.isPullRequestClosed) {
                const port = ports[repositoryName][pullRequestId];
                if (!port) {
                    response.end(`no pull request: ${pullRequestId}.`);
                    return;
                }
                delete ports[repositoryName][pullRequestId];
                await savePorts();
                await handler.createComment(locale.pullRequestClosedGot, context);
                context.doneText = locale.pullRequestClosedDone;
                commands.push({ command: `${application.pullRequest.closedCommand} ${port} ${pullRequestId}`, context });
            } else {
                response.end(`can not handle action: ${action}.`);
                return;
            }
            await runCommands();
        } else {
            response.end(`can not handle event: ${eventName}.`);
        }
    } catch (error) {
        libs.printInConsole(error);
        response.end(error.toString());
    }
});

app.listen(config.port, config.host, () => {
    libs.printInConsole(`deploy robot is running at: ${config.host}:${config.port} in mode: ${config.mode}`);
});

type Context = (github.Context | gitlab.Context) & { doneText?: string };

type Command = {
    context: Context;
    command: string;
};

type Ports = { [repositoryName: string]: { [pullRequestId: number]: number } };
