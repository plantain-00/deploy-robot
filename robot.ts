import * as libs from "./libs";
import * as settings from "./settings";
import * as github from "./github";
import * as gitlab from "./gitlab";

const app = libs.express();

app.use(libs.bodyParser.json());
app.use(libs.bodyParser.urlencoded({ extended: true }));

app.post("/", async (request, response) => {
    try {
        if (settings.type === "github") {
            await github.handle(request, response);
        } else if (settings.type === "gitlab") {
            await gitlab.handle(request, response);
        } else {
            response.end("invalid `type` in `settings.js`");
        }
    } catch (error) {
        console.log(error);
        response.end(error.toString());
    }
});

const port = 9996;

app.listen(port, "localhost", () => {
    console.log(`deploy robot is listening: ${port}`);
});
