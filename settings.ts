export interface Application {
    repositoryName: string;
    secret: string;
    operators: string[];
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
