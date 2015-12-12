/// <reference path="./typings/tsd.d.ts" />

"use strict";

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

function createComment(owner: string, repo: string, issueNumber: number, operater: string, next: (error: Error) => void) {
    request({
        url: `https://github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
        method: "post",
        json: true,
        body: {
            body: `@${operater}, it's done now.`
        },
        headers: {
            Authorization: `token ${settings.accessToken}`,
            "User-Agent": "SubsNoti-robot",
        },
    }, (error, incomingMessage, body) => {
        next(error);
    });
}

app.post("/", (request, response) => {
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

    let operater: string = request.body.comment.user.login;
    if (application.users.findIndex(value => value === operater) < 0) {
        response.send("not valid operater");
        return;
    }

    let comment: string = request.body.comment.body;
    if (comment.indexOf("robot") >= 0
        && comment.indexOf("deploy") >= 0
        && comment.indexOf("please") >= 0) {
        childProcess.exec(application.command, (error, stdout, stderr) => {
            if (error) {
                response.send(JSON.stringify(error));
                return;
            }

            let owner = request.body.repository.owner.login;
            let issueNumber = request.body.issue.number;
            createComment(owner, repositoryName, issueNumber, operater, err => {
                if (err) {
                    response.send(JSON.stringify(err));
                    return;
                }

                response.send("success");
            });
        });
        return;
    }

    response.send("not a command");
});

let port = 9996;

app.listen(port, "localhost", () => {
    console.log(`deploy robot is listening: ${port}`);
});
