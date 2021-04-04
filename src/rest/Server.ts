/**
 * Created by rtholmes on 2016-06-19.
 */
import {
    IInsightFacade,
    InsightDataset,
    InsightDatasetKind,
    InsightError,
    NotFoundError,
} from "../controller/IInsightFacade";

import fs = require("fs");
import restify = require("restify");
import Log from "../Util";
import InsightFacade from "../controller/InsightFacade";

/**
 * This configures the REST endpoints for the server.
 */
export default class Server {

    private port: number;
    private rest: restify.Server;
    private static insight: InsightFacade = new InsightFacade();

    constructor(port: number) {
        Log.info("Server::<init>( " + port + " )");
        this.port = port;
    }

    /**
     * Stops the server. Again returns a promise so we know when the connections have
     * actually been fully closed and the port has been released.
     *
     * @returns {Promise<boolean>}
     */
    public stop(): Promise<boolean> {
        Log.info("Server::close()");
        const that = this;
        return new Promise(function (fulfill) {
            that.rest.close(function () {
                fulfill(true);
            });
        });
    }

    /**
     * Starts the server. Returns a promise with a boolean value. Promises are used
     * here because starting the server takes some time and we want to know when it
     * is done (and if it worked).
     *
     * @returns {Promise<boolean>}
     */
    public start(): Promise<boolean> {
        const that = this;
        return new Promise(function (fulfill, reject) {
            try {
                Log.info("Server::start() - start");

                that.rest = restify.createServer({
                    name: "insightUBC",
                });
                that.rest.use(restify.bodyParser({mapFiles: true, mapParams: true}));
                that.rest.use(
                    function crossOrigin(req, res, next) {
                        res.header("Access-Control-Allow-Origin", "*");
                        res.header("Access-Control-Allow-Headers", "X-Requested-With");
                        return next();
                    });

                // This is an example endpoint that you can invoke by accessing this URL in your browser:
                // http://localhost:4321/echo/hello
                that.rest.get("/echo/:msg", Server.echo);

                // NOTE: your endpoints should go here
                that.rest.get("/dataset", Server.getDatasets);
                that.rest.get("/dataset/:id", Server.deleteDataset);
                that.rest.get("/query", Server.postDataset);
                // This must be the last endpoint!
                that.rest.get("/.*", Server.getStatic);

                that.rest.listen(that.port, function () {
                    Log.info("Server::start() - restify listening: " + that.rest.url);
                    fulfill(true);
                });

                that.rest.on("error", function (err: string) {
                    // catches errors in restify start; unusual syntax due to internal
                    // node not using normal exceptions here
                    Log.info("Server::start() - restify ERROR: " + err);
                    reject(err);
                });

            } catch (err) {
                Log.error("Server::start() - ERROR: " + err);
                reject(err);
            }
        });
    }

    // The next two methods handle the echo service.
    // These are almost certainly not the best place to put these, but are here for your reference.
    // By updating the Server.echo function pointer above, these methods can be easily moved.
    private static echo(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("Server::echo(..) - params: " + JSON.stringify(req.params));
        try {
            const response = Server.performEcho(req.params.msg);
            Log.info("Server::echo(..) - responding " + 200);
            res.json(200, {result: response});
        } catch (err) {
            Log.error("Server::echo(..) - responding 400");
            res.json(400, {error: err});
        }
        return next();
    }

    private static performEcho(msg: string): string {
        if (typeof msg !== "undefined" && msg !== null) {
            return `${msg}...${msg}`;
        } else {
            return "Message not provided";
        }
    }

    private static getStatic(req: restify.Request, res: restify.Response, next: restify.Next) {
        const publicDir = "frontend/public/";
        Log.trace("RoutHandler::getStatic::" + req.url);
        let path = publicDir + "index.html";
        if (req.url !== "/") {
            path = publicDir + req.url.split("/").pop();
        }
        fs.readFile(path, function (err: Error, file: Buffer) {
            if (err) {
                res.send(500);
                Log.error(JSON.stringify(err));
                return next();
            }
            res.write(file);
            res.end();
            return next();
        });
    }

    // put, delete, post, get
    // get
    public static getDatasets(req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> {
        let path = req.url;
        Log.trace("RoutHandler::getDatasets::" + path);
        return new Promise<any>((resolve, reject) => {
            return Server.insight.listDatasets()
                .then((response: any) => {
                    let answer: any = {result: response};
                    res.send(200, answer);
                    return resolve(next());
                })
                .catch( (err: any) => {
                    return reject(new Error(err));
                });
        });
    }

    // delete
    public static deleteDataset(req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> {
        let path = req.url;
        Log.trace("RoutHandler::deleteDataset::" + path);
        let id = req.url.split("/").pop();
        return new Promise<any>((resolve, reject) => {
            return Server.insight.removeDataset(id)
                .then((response: any) => {
                    let answer: any = {result: response};
                    res.send(200, answer);
                    return resolve(next());
                })
                .catch((err: any) => {
                    if (err instanceof NotFoundError) {
                        let answer: any = {error: "Dataset with ID '" + id + "' not found"};
                        res.send(404, answer);
                        return reject(next(new NotFoundError(err)));
                    } else {
                        let answer: any = {error: "insightFacade error"};
                        res.send(400, answer);
                        return reject(next(new InsightError(err)));
                    }
                });
        });
    }

    // post
    public static postDataset(req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> {
        let path = req.url;
        Log.trace("RoutHandler::postDataset::" + path);
        let query: any = req.getQuery;
        return new Promise<any>((resolve, reject) => {
            return Server.insight.performQuery(query)
                .then((response: any) => {
                    let answer: any = {result: response};
                    res.send(200, answer);
                    return resolve(next());
                })
                .catch((err: any) => {
                    let answer: any = {error: "insightFacade error"};
                    res.send(400, answer);
                    return reject(next(new InsightError(err)));
                });
        });


    }


    // put
    public static putDataset(req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> {
        let path = req.url;
        Log.trace("RoutHandler::putDataset::" + path);
        let parsedURL = req.url.split("/");
        let kind: InsightDatasetKind;
        if (parsedURL.pop() === "courses") {
            kind = InsightDatasetKind.Courses;
        } else {
            kind = InsightDatasetKind.Rooms;
        }
        let content = new Buffer(req.body).toString("base64");
        let id = parsedURL.pop();
        return new Promise<any>((resolve, reject) => {
            return Server.insight.addDataset(id, content, kind)
                .then ((response: any) => {
                    let answer: any = {result: response};
                    res.send(200, answer);
                    return resolve(next());
                })
                .catch((err: any) => {
                    let answer: any = {error: "insightFacade error"};
                    res.send(400, answer);
                    return reject(next(new InsightError(err)));
                });
        });
    }
}
