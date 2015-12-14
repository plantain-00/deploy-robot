/// <reference path="./typings/tsd.d.ts" />

import * as express from "express";
import * as cryptoJs from "crypto-js";
import * as childProcess from "child_process";
import * as request from "request";
let bodyParser = require("body-parser");

import * as settings from "./settings";

let app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

function getSignature(body: string, application: settings.Application) {
    return "sha1=" + cryptoJs.HmacSHA1(body, application.secret).toString();
}

function createComment(content: string, owner: string, repo: string, issueNumber: number, operater: string) {
    let url = `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`;
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
                reject(error);
                return;
            }

            if (incomingMessage.statusCode !== 201) {
                reject(body);
                return;
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

app.post("/", async (request, response) => {
    try {
        let repositoryName = request.body.repository.name;
        let application = settings.applications.find((value, index, obj) => value.repositoryName === repositoryName);
        if (!application) {
            response.send("name of repository is not found");
            return;
        }

        let remoteSignature: string = request.header("X-Hub-Signature");
        let signature = getSignature(JSON.stringify(request.body), application);
        if (signature !== remoteSignature) {
            response.send("signatures don't match");
            return;
        }

        let operator: string = request.body.comment.user.login;
        if (application.operators.findIndex(value => value === operator) < 0) {
            response.send("not valid operater");
            return;
        }

        let comment: string = request.body.comment.body;
        if (comment.indexOf("robot") >= 0
            && comment.indexOf("deploy") >= 0
            && comment.indexOf("please") >= 0) {
            let owner = request.body.repository.owner.login;
            let issueNumber = request.body.issue.number;
            await createComment(`@${operator}, it may take a few minutes to finish it.`, owner, repositoryName, issueNumber, operator);
            try {
                await exec(application.command);
                await createComment(`@${operator}, it's done now.`, owner, repositoryName, issueNumber, operator);
            } catch (error) {
                await createComment(`@${operator}, ${error}.`, owner, repositoryName, issueNumber, operator);
            }
            response.send("success");
            return;
        }

        response.send("not a command");
    } catch (error) {
        response.send(error);
    }
});

let port = 9996;

app.listen(port, "localhost", () => {
    console.log(`deploy robot is listening: ${port}`);
});
