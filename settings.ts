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
export let accessToken: string = process.env.DEPLOY_ROBOT_ACCESS_TOKEN;

// gitlab:
export let privateToken: string = process.env.DEPLOY_ROBOT_PRIVATE_TOKEN;

export let type: "github" | "gitlab" = "github";
