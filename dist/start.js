"use strict";
const libs = require("./libs");
const robot = require("./robot");
const argv = libs.minimist(process.argv.slice(2), { "--": true });
const mode = argv["mode"] || argv["m"] || "github";
const port = argv["port"] || argv["p"] || 9996;
const host = argv["host"] || argv["h"] || "localhost";
const app = libs.express();
app.use(libs.bodyParser.json());
app.use(libs.bodyParser.urlencoded({ extended: true }));
robot.start(app, "/", mode);
app.listen(port, host, () => {
    console.log(`deploy robot is running at: ${host}:${port} in mode: ${mode}`);
});
//# sourceMappingURL=start.js.map