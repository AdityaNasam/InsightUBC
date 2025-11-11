import express, {Application, Request, Response} from "express";
import * as http from "http";
import cors from "cors";
import InsightFacade from "../controller/InsightFacade";
import {InsightDatasetKind, InsightError, NotFoundError} from "../controller/IInsightFacade";
import Dataset from "../controller/Dataset";

export default class Server {
	private readonly port: number;
	private express: Application;
	private server: http.Server | undefined;
	// private static insf: InsightFacade = new InsightFacade();
	private insf: InsightFacade;

	constructor(port: number) {
		console.info(`Server::<init>( ${port} )`);
		this.port = port;
		this.express = express();
		this.insf = new InsightFacade();
		this.registerMiddleware();
		this.registerRoutes();

		/** NOTE: you can serve static frontend files in from your express server
		 * by uncommenting the line below. This makes files in ./frontend/public
		 * accessible at http://localhost:<port>/
		 */
		this.express.use(express.static("./frontend/public"));
	}

	/**
	 * Starts the server. Returns a promise that resolves if success. Promises are used
	 * here because starting the server takes some time and we want to know when it
	 * is done (and if it worked).
	 *
	 * @returns {Promise<void>}
	 */
	public start(): Promise<void> {
		return new Promise((resolve, reject) => {
			console.info("Server::start() - start");
			if (this.server !== undefined) {
				console.error("Server::start() - server already listening");
				reject();
			} else {
				this.server = this.express.listen(this.port, () => {
					console.info(`Server::start() - server listening on port: ${this.port}`);
					resolve();
				}).on("error", (err: Error) => {
					// catches errors in server start
					console.error(`Server::start() - server ERROR: ${err.message}`);
					reject(err);
				});
			}
		});
	}

	/**
	 * Stops the server. Again returns a promise so we know when the connections have
	 * actually been fully closed and the port has been released.
	 *
	 * @returns {Promise<void>}
	 */
	public stop(): Promise<void> {
		console.info("Server::stop()");
		return new Promise((resolve, reject) => {
			if (this.server === undefined) {
				console.error("Server::stop() - ERROR: server not started");
				reject();
			} else {
				this.server.close(() => {
					console.info("Server::stop() - server closed");
					resolve();
				});
			}
		});
	}

	// Registers middleware to parse request before passing them to request handlers
	private registerMiddleware() {
		// JSON parser must be place before raw parser because of wildcard matching done by raw parser below
		this.express.use(express.json());
		this.express.use(express.raw({type: "application/*", limit: "10mb"}));

		// enable cors in request headers to allow cross-origin HTTP requests
		this.express.use(cors());
	}

	// Registers all request handlers to routes
	private registerRoutes() {
		// This is an example endpoint this you can invoke by accessing this URL in your browser:
		// http://localhost:4321/echo/hello
		this.express.get("/echo/:msg", Server.echo);
		this.express.get("/datasets", (req, res) =>
			Server.getDatasets(req, res, this.insf));
		this.express.put("/dataset/:id/:kind", (req, res) =>
			Server.putDataset(req, res, this.insf));
		this.express.delete("/dataset/:id", (req, res) =>
			Server.deleteDataset(req, res, this.insf));
		this.express.post("/query", (req, res) =>
			Server.postQuery(req, res, this.insf));
	}

	/**
	 * The next two methods handle the echo service.
	 * These are almost certainly not the best place to put these, but are here for your reference.
	 * By updating the Server.echo function pointer above, these methods can be easily moved.
	 */
	private static echo(req: Request, res: Response) {
		try {
			console.log(`Server::echo(..) - params: ${JSON.stringify(req.params)}`);
			const response = Server.performEcho(req.params.msg);
			res.status(200).json({result: response});
		} catch (err) {
			res.status(400).json({error: err});
		}
	}

	private static performEcho(msg: string): string {
		if (typeof msg !== "undefined" && msg !== null) {
			return `${msg}...${msg}`;
		} else {
			return "Message not provided";
		}
	}

	private static async getDatasets(req: Request, res: Response, insf: InsightFacade) {
		try {
			if (!insf) {
				insf = new InsightFacade();
			}
			let listData = await insf.listDatasets();
			res.status(200).send({result: listData});
		} catch (error) {
			let err = "error";
			res.status(400).send({error: err});
		}
	}

	private static async putDataset(req: Request, res: Response,insf: InsightFacade) {
		try {
			if (!insf) {
				insf = new InsightFacade();
			}
			let {id, kind} = req.params;
			let nkind: InsightDatasetKind;

			if (kind === "sections") {
				nkind = InsightDatasetKind.Sections;
			} else if (kind === "rooms") {
				nkind = InsightDatasetKind.Rooms;
			} else {
				throw new Error("Invalid dataset kind");
			}
			const content = req.body.toString("base64");
			const arr = await insf.addDataset(id, content, nkind);
			res.status(200).send({result: arr});
		} catch (error) {
			let err = "error";
			res.status(400).send({error: err});
		}
	}

	private static async deleteDataset(req: Request, res: Response, insf: InsightFacade) {
		try {
			if (!insf) {
				insf = new InsightFacade();
			}
			let id = req.params.id;
			const str = await insf.removeDataset(id);
			res.status(200).send({result: str});
		} catch (error) {
			if (error instanceof InsightError) {
				let err = "Insight Error";
				res.status(400).send({error: err});
			} else if (error instanceof NotFoundError) {
				let err = "NotFoundError";
				res.status(404).send({error: err});
			} else {
				console.log("error");
			}
		}
	}

	private static async postQuery(req: Request, res: Response, insf: InsightFacade) {
		try {
			if (!insf) {
				insf = new InsightFacade();
			}
			let query: any = req.body;
			const arr = await insf.performQuery(query);
			res.status(200).send({results: arr});
		} catch (error) {
			let err = "error";
			res.status(400).send({error: err});
		}
	}
}
