import * as libs from "./libs";
import * as settings from "./settings";
import * as github from "./github";
import * as gitlab from "./gitlab";

const app = libs.express();

app.use(libs.bodyParser.json());
app.use(libs.bodyParser.urlencoded({ extended: true }));

if (settings.mode === "github") {
    settings.setHandler(github);
} else if (settings.mode === "gitlab") {
    settings.setHandler(gitlab);
} else {
    console.log("invalid `type` in `settings.js`");
    process.exit(1);
}

app.post("/", async (request, response) => {
    try {
        const repositoryName = settings.handler.getRepositoryName(request);
        const application = settings.applications.find((value, index, obj) => value.repositoryName === repositoryName);
        if (!application) {
            response.end("name of repository is not found");
            return;
        }
        const signatureIsValid = settings.handler.verifySignature(request, application);
        if (signatureIsValid) {
            response.end("signatures don't match");
            return;
        }
        const eventName = settings.handler.getEventName(request);
        if (eventName === settings.handler.issueCommentEventName) {
            const operator = settings.handler.getIssueCommentOperator(request);
            if (application.operators.findIndex(value => value === operator) < 0) {
                response.end("not valid operator");
                return;
            }
            const comment = settings.handler.getIssueComment(request);
            if (comment.indexOf("robot") >= 0
                && comment.indexOf("deploy") >= 0
                && comment.indexOf("please") >= 0) {
                response.end("command accepted");
                const context = settings.handler.getCommentCreationContext(request, application, operator);
                settings.commands.push({ command: application.deployCommand, context });
                await settings.handler.createComment("it may take a few minutes to finish it.", context);
                await settings.runCommands();
            } else {
                response.end("not a command");
            }
        } else if (eventName === settings.handler.pullRequestEventName) {
            const action = settings.handler.getPullRequestAction(request);
            const operator = settings.handler.getPullRequestOperator(request);
            const context = settings.handler.getCommentCreationContext(request, application, operator);
            if (action === settings.handler.pullRequestOpenActionName) {
                settings.commands.push({ command: application.pullRequestOpenedCommand, context });
            } else if (action === settings.handler.pullRequestUpdateActionName) {
                settings.commands.push({ command: application.pullRequestUpdatedCommand, context });
            } else if (settings.handler.isPullRequestMerged) {
                settings.commands.push({ command: application.pullRequestMergedCommand, context });
            } else if (settings.handler.isPullRequestClosed) {
                settings.commands.push({ command: application.pullRequestClosedCommand, context });
            } else {
                response.end(`can not handle action: ${action}.`);
                return;
            }
            await settings.handler.createComment("it may take a few minutes to finish it.", context);
            await settings.runCommands();
        } else {
            response.end(`can not handle event: ${eventName}.`);
        }
    } catch (error) {
        console.log(error);
        response.end(error.toString());
    }
});

app.listen(settings.port, "localhost", () => {
    console.log(`deploy robot is listening: ${settings.port} in mode: ${settings.mode}`);
});
