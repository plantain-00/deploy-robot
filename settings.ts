export interface Application {
    repositoryName: string;
    secret: string;
    operators: string[];
    command: string;
}

export const applications: Application[] = [];

export let accessToken: string;

try {
    const secret = require("./secret");
    secret.load();
} catch (e) {
    console.log(e);
}
