import * as libs from "./libs";

const defaultConfig: libs.Config = {
    applications: [],
    localeName: "zh-cn",
};

try {
    // tslint:disable-next-line:no-var-requires
    require("../deploy-robot.config.js")(defaultConfig);
} catch (error) {
    // tslint:disable-next-line:no-console
    console.log(error);
}

export = defaultConfig;
