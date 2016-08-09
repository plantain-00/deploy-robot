import * as libs from "./libs";
import * as settings from "./settings";
import * as github from "./github";
import * as gitlab from "./gitlab";
import * as deploy from "./deploy";

const app = libs.express();

app.use(libs.bodyParser.json());
app.use(libs.bodyParser.urlencoded({ extended: true }));

interface Handler {
    issueCommentEventName: string;
    pullRequestEventName: string;
    pullRequestOpenActionName: string;
    pullRequestUpdateActionName: string;
    getRepositoryName(request: libs.express.Request): string;
    verifySignature(request: libs.express.Request, application: settings.Application): boolean;
    getEventName(request: libs.express.Request): string;
    getIssueCommentOperator(request: libs.express.Request): string | number;
    getIssueComment(request: libs.express.Request): string;
    publish(request: libs.express.Request, application: settings.Application, operator: string | number, comment: string): Promise<void>;
    getPullRequestAction(request: libs.express.Request): string;
    isPullRequestMerged(request: libs.express.Request, action: string): boolean;
    isPullRequestClosed(request: libs.express.Request, action: string): boolean;
    pullRequestOpened(request: libs.express.Request, application: settings.Application): void;
    pullRequestUpdated(request: libs.express.Request, application: settings.Application): void;
    pullRequestMerged(request: libs.express.Request, application: settings.Application): void;
    pullRequestClosed(request: libs.express.Request, application: settings.Application): void;
}

let handler: Handler;

if (settings.type === "github") {
    handler = github;
} else if (settings.type === "gitlab") {
    handler = gitlab;
} else {
    console.log("invalid `type` in `settings.js`");
    process.exit(1);
}

app.post("/", async (request, response) => {
    try {
        const repositoryName = handler.getRepositoryName(request);
        const application = settings.applications.find((value, index, obj) => value.repositoryName === repositoryName);
        if (!application) {
            response.end("name of repository is not found");
            return;
        }
        const signatureIsValid = handler.verifySignature(request, application);
        if (signatureIsValid) {
            response.end("signatures don't match");
            return;
        }
        const eventName = handler.getEventName(request);
        if (eventName === handler.issueCommentEventName) {
            const operator = handler.getIssueCommentOperator(request);
            if (application.operators.findIndex(value => value === operator) < 0) {
                response.end("not valid operator");
                return;
            }
            const comment = handler.getIssueComment(request);
            if (deploy.isDeployCommand(comment)) {
                response.end("command accepted");
                await handler.publish(request, application, operator, comment);
            } else {
                response.end("not a command");
            }
        } else if (eventName === handler.pullRequestEventName) {
            const action = handler.getPullRequestAction(request);
            if (action === handler.pullRequestOpenActionName) {
                handler.pullRequestOpened(request, application);
            } else if (action === handler.pullRequestUpdateActionName) {
                handler.pullRequestUpdated(request, application);
            } else if (handler.isPullRequestMerged) {
                handler.pullRequestMerged(request, application);
            } else if (handler.isPullRequestClosed) {
                handler.pullRequestClosed(request, application);
            } else {
                response.end(`can not handle action: ${action}.`);
            }
        } else {
            response.end(`can not handle event: ${eventName}.`);
        }
    } catch (error) {
        console.log(error);
        response.end(error.toString());
    }
});

const port = 9996;

app.listen(port, "localhost", () => {
    console.log(`deploy robot is listening: ${port} in mode: ${settings.type}`);
});
