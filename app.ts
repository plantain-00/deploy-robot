/// <reference path="./typings/tsd.d.ts" />

import * as express from "express";
import * as cryptoJs from "crypto-js";
import * as childProcess from "child_process";
import * as request from "request";
let bodyParser = require("body-parser");
import * as _ from "lodash";

import * as settings from "./settings";

let app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

function getSignature(body: string, application: settings.Application) {
    return "sha1=" + cryptoJs.HmacSHA1(body, application.secret).toString();
}

interface Command {
    owner: string;
    repo: string;
    issueNumber: number;
    operator: string;
    content: string;
}

function createComment(content: string, command: Command) {
    let url = `https://api.github.com/repos/${command.owner}/${command.repo}/issues/${command.issueNumber}/comments`;
    return new Promise<void>((resolve, reject) => {
        request({
            url: url,
            method: "post",
            json: true,
            body: {
                body: content
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

function exec(command: string) {
    return new Promise<void>((resolve, reject) => {
        childProcess.exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }

            resolve();
        });
    });
}

let commands: Command[] = [];

/**
 * commands should be excuted one by one in a process globally.
 */
let isExecuting = false;

app.post("/", async (request, response) => {
    try {
        let repositoryName = request.body.repository.name;
        let application = settings.applications.find((value, index, obj) => value.repositoryName === repositoryName);
        if (!application) {
            response.end("name of repository is not found");
            return;
        }

        let remoteSignature: string = request.header("X-Hub-Signature");
        let signature = getSignature(JSON.stringify(request.body), application);
        if (signature !== remoteSignature) {
            response.end("signatures don't match");
            return;
        }

        let operator: string = request.body.comment.user.login;
        if (application.operators.findIndex(value => value === operator) < 0) {
            response.end("not valid operater");
            return;
        }

        let comment: string = request.body.comment.body;
        if (comment.indexOf("robot") >= 0
            && comment.indexOf("deploy") >= 0
            && comment.indexOf("please") >= 0) {
            response.end("command accepted");

            commands.push({
                owner: request.body.repository.owner.login,
                repo: repositoryName,
                issueNumber: request.body.issue.number,
                operator: operator,
                content: application.command,
            });

            await createComment(`@${commands[commands.length - 1].operator}, it may take a few minutes to finish it.`, commands[commands.length - 1]);

            if (!isExecuting) {
                isExecuting = true;
                while (commands.length > 0) {
                    console.log(`there are ${commands.length} commands.`)
                    let command = commands[0];
                    try {
                        await exec(command.content);
                        let newCommands: Command[] = [];
                        for (let c of commands) {
                            if (c.content === command.content) {
                                await createComment(`@${c.operator}, it's done now.`, c);
                            } else {
                                newCommands.push(c);
                            }
                        }

                        commands = newCommands;
                    } catch (error) {
                        console.log(error);
                        await createComment(`@${command.operator}, ${error}.`, command);
                    }
                }
                isExecuting = false;
            }
            return;
        }

        response.end("not a command");
    } catch (error) {
        console.log(error);
        response.end(error);
    }
});

let port = 9996;

app.listen(port, "localhost", () => {
    console.log(`deploy robot is listening: ${port}`);
});
