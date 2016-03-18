import * as libs from "./libs";
import * as settings from "./settings";
import * as deploy from "./deploy";

const gitlabHost = "https://gitlab.com";

interface Context {
    projectId: number;
    mergeRequestId: number;
}

function createComment(content: string, context: Context) {
    const url = `${gitlabHost}/api/v3/projects/${context.projectId}/merge_requests/${context.mergeRequestId}/notes`;
    return new Promise<void>((resolve, reject) => {
        libs.request({
            url: url,
            method: "post",
            json: true,
            body: {
                body: content,
            },
            headers: {
                "PRIVATE-TOKEN": settings.privateToken,
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

    const token = request.query.token;
    if (token !== application.secret) {
        response.end("token don't match");
        return;
    }

    const operator: number = request.body.object_attributes.author_id;
    if (application.operators.findIndex(value => value === operator) < 0) {
        response.end("not valid operator");
        return;
    }

    const comment: string = request.body.object_attributes.note;

    if (deploy.isThis(comment)) {
        response.end("command accepted");
        const command = {
            command: application.command,
            context: {
                projectId: request.body.project_id,
                mergeRequestId: request.body.merge_request.id,
            },
        };
        await deploy.handle<Context>(comment, command, createComment);
    } else {
        response.end("not a command");
    }
}
