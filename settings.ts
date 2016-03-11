/**
 * operators: for github, it's name; for gitlab, it's id, can be found in the html
 */
export interface Application {
    repositoryName: string;
    secret: string;
    operators: (string | number)[];
    command: string;
}

export const applications: Application[] = [];

// github:
export let accessToken: string;

// gitlab:
export let privateToken: string;

export let type: "github" | "gitlab" = "github";

try {
    const secret = require("./secret");
    secret.load();
} catch (e) {
    console.log(e);
}
