import * as libs from "./libs";
import * as robot from "./robot";

const argv = libs.minimist(process.argv.slice(2), { "--": true });
const mode: string = argv["mode"] || argv["m"] || "github";
const port: number = argv["port"] || argv["p"] || 9996;
const host: string = argv["host"] || argv["h"] || "localhost";

const app = libs.express();
app.use(libs.bodyParser.json());
app.use(libs.bodyParser.urlencoded({ extended: true }));

robot.start(app, "/", mode);

app.listen(port, host, () => {
    console.log(`deploy robot is running at: ${host}:${port} in mode: ${mode}`);
});
