"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const InsightFacade_1 = __importDefault(require("../controller/InsightFacade"));
const IInsightFacade_1 = require("../controller/IInsightFacade");
class Server {
    port;
    express;
    server;
    insf;
    constructor(port) {
        console.info(`Server::<init>( ${port} )`);
        this.port = port;
        this.express = (0, express_1.default)();
        this.insf = new InsightFacade_1.default();
        this.registerMiddleware();
        this.registerRoutes();
        this.express.use(express_1.default.static("./frontend/public"));
    }
    start() {
        return new Promise((resolve, reject) => {
            console.info("Server::start() - start");
            if (this.server !== undefined) {
                console.error("Server::start() - server already listening");
                reject();
            }
            else {
                this.server = this.express.listen(this.port, () => {
                    console.info(`Server::start() - server listening on port: ${this.port}`);
                    resolve();
                }).on("error", (err) => {
                    console.error(`Server::start() - server ERROR: ${err.message}`);
                    reject(err);
                });
            }
        });
    }
    stop() {
        console.info("Server::stop()");
        return new Promise((resolve, reject) => {
            if (this.server === undefined) {
                console.error("Server::stop() - ERROR: server not started");
                reject();
            }
            else {
                this.server.close(() => {
                    console.info("Server::stop() - server closed");
                    resolve();
                });
            }
        });
    }
    registerMiddleware() {
        this.express.use(express_1.default.json());
        this.express.use(express_1.default.raw({ type: "application/*", limit: "10mb" }));
        this.express.use((0, cors_1.default)());
    }
    registerRoutes() {
        this.express.get("/echo/:msg", Server.echo);
        this.express.get("/datasets", (req, res) => Server.getDatasets(req, res, this.insf));
        this.express.put("/dataset/:id/:kind", (req, res) => Server.putDataset(req, res, this.insf));
        this.express.delete("/dataset/:id", (req, res) => Server.deleteDataset(req, res, this.insf));
        this.express.post("/query", (req, res) => Server.postQuery(req, res, this.insf));
    }
    static echo(req, res) {
        try {
            console.log(`Server::echo(..) - params: ${JSON.stringify(req.params)}`);
            const response = Server.performEcho(req.params.msg);
            res.status(200).json({ result: response });
        }
        catch (err) {
            res.status(400).json({ error: err });
        }
    }
    static performEcho(msg) {
        if (typeof msg !== "undefined" && msg !== null) {
            return `${msg}...${msg}`;
        }
        else {
            return "Message not provided";
        }
    }
    static async getDatasets(req, res, insf) {
        try {
            if (!insf) {
                insf = new InsightFacade_1.default();
            }
            let listData = await insf.listDatasets();
            res.status(200).send({ result: listData });
        }
        catch (error) {
            let err = "error";
            res.status(400).send({ error: err });
        }
    }
    static async putDataset(req, res, insf) {
        try {
            if (!insf) {
                insf = new InsightFacade_1.default();
            }
            let { id, kind } = req.params;
            let nkind;
            if (kind === "sections") {
                nkind = IInsightFacade_1.InsightDatasetKind.Sections;
            }
            else if (kind === "rooms") {
                nkind = IInsightFacade_1.InsightDatasetKind.Rooms;
            }
            else {
                throw new Error("Invalid dataset kind");
            }
            const content = req.body.toString("base64");
            const arr = await insf.addDataset(id, content, nkind);
            res.status(200).send({ result: arr });
        }
        catch (error) {
            let err = "error";
            res.status(400).send({ error: err });
        }
    }
    static async deleteDataset(req, res, insf) {
        try {
            if (!insf) {
                insf = new InsightFacade_1.default();
            }
            let id = req.params.id;
            const str = await insf.removeDataset(id);
            res.status(200).send({ result: str });
        }
        catch (error) {
            if (error instanceof IInsightFacade_1.InsightError) {
                let err = "Insight Error";
                res.status(400).send({ error: err });
            }
            else if (error instanceof IInsightFacade_1.NotFoundError) {
                let err = "NotFoundError";
                res.status(404).send({ error: err });
            }
            else {
                console.log("error");
            }
        }
    }
    static async postQuery(req, res, insf) {
        try {
            if (!insf) {
                insf = new InsightFacade_1.default();
            }
            let query = req.body;
            const arr = await insf.performQuery(query);
            res.status(200).send({ results: arr });
        }
        catch (error) {
            let err = "error";
            res.status(400).send({ error: err });
        }
    }
}
exports.default = Server;
//# sourceMappingURL=Server.js.map