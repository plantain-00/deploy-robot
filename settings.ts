"use strict";

export interface Application {
    repositoryName: string;
    secret: string;
    users: string[];
    command: string;
}

export let applications: Application[] = [];

try {
    let secret = require("./secret");
    secret.load();
} catch (e) {
    console.log(e);
}
