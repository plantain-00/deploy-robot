import * as libs from "./libs";
import * as settings from "./settings";
import * as deploy from "./deploy";

function getSignature(body: string, secret: string) {
    return "sha1=" + libs.cryptoJs.HmacSHA1(body, secret).toString();
}

interface Context {
    owner: string;
    repo: string;
    issueNumber: number;
    operator: string;
}

function createComment(content: string, context: Context) {
    const url = `https://api.github.com/repos/${context.owner}/${context.repo}/issues/${context.issueNumber}/comments`;
    return new Promise<void>((resolve, reject) => {
        libs.request({
            url: url,
            method: "post",
            json: true,
            body: {
                body: `@${context.operator}, ${content}`,
            },
            headers: {
                Authorization: `token ${settings.accessToken}`,
                "User-Agent": "SubsNoti-robot",
            },
        }, (error, incomingMessage, body) => {
            if (error) {
                console.log(error);
            } else if (incomingMessage.statusCode !== 201) {
                console.log(body);
            }

            resolve();
        });
    });
}

export async function handle(request: libs.express.Request, response: libs.express.Response) {
    const repositoryName = request.body.repository.name;
    const application = settings.applications.find((value, index, obj) => value.repositoryName === repositoryName);
    if (!application) {
        response.end("name of repository is not found");
        return;
    }

    const remoteSignature: string = request.header("X-Hub-Signature");
    const signature = getSignature(JSON.stringify(request.body), application.secret);
    if (signature !== remoteSignature) {
        response.end("signatures don't match");
        return;
    }

    const operator: string = request.body.comment.user.login;
    if (application.operators.findIndex(value => value === operator) < 0) {
        response.end("not valid operator");
        return;
    }

    const comment: string = request.body.comment.body;

    if (deploy.isThis(comment)) {
        response.end("command accepted");
        const command = {
            command: application.command,
            context: {
                owner: request.body.repository.owner.login,
                repo: repositoryName,
                issueNumber: request.body.issue.number,
                operator,
            },
        };
        await deploy.handle<Context>(comment, command, createComment);
    } else {
        response.end("not a command");
    }
}
