import Server from "../../src/rest/Server";
import InsightFacade from "../../src/controller/InsightFacade";
import {expect} from "chai";
import request, {Response} from "supertest";
import {getContentFromArchives} from "../resources/archives/TestUtil";
import * as fs from "fs-extra";
import {clearDisk} from "../TestUtil";

describe("Server", () => {

	let facade: InsightFacade;
	let server: Server;
	let sections: Buffer;
	let rooms: Buffer;

	before(async () => {
		sections = fs.readFileSync("test/resources/archives/" + "pair.zip");
		rooms = fs.readFileSync("test/resources/archives/" + "campus.zip");
		server = new Server(4321);
		// TODO: start server here once and handle errors properly
		try {
			await server.start();
		} catch (err) {
			console.error("server start error");
		}
	});

	after(async () => {
		// TODO: stop server here once!
		try {
			await server.stop();
		} catch (err) {
			console.error("server stop error");
		}
	});

	beforeEach(async () => {
		clearDisk();
		facade = new InsightFacade();
		// might want to add some process logging here to keep track of what's going on
	});

	afterEach(async () => {
		clearDisk();
		// might want to add some process logging here to keep track of what's going on
	});

	// Sample on how to format PUT requests

	it("PUT test for courses dataset", async () => {
		try {
			return await request("http://localhost:4321")
				.put("/dataset/" + "abc" + "/" + "sections")
				.send(sections)
				.set("Content-Type", "application/x-zip-compressed")
				.then((res: Response) => {
					// console.log(res.status);
					// console.log(res.body.result);
					expect(res.status).to.be.equal(200);
					expect(res.body.result).to.deep.equals(["abc"]);
				})
				.catch((err) => {
					// some logging here please!
					expect.fail("error");
				});
		} catch (err) {
			// and some more logging here!
			expect.fail("error");
		}
	});

	it("PUT test for rooms dataset", async () => {
		try {
			return await request("http://localhost:4321")
				.put("/dataset/" + "def" + "/" + "rooms")
				.send(rooms)
				.set("Content-Type", "application/x-zip-compressed")
				.then((res: Response) => {
					console.log(res.status);
					console.log(res.body.result);
					expect(res.status).to.be.equal(200);
					expect(res.body.result).to.deep.equal(["abc", "def"]);
				})
				.catch((err) => {
					// some logging here please!
					expect.fail("error");
				});
		} catch (err) {
			// and some more logging here!
			expect.fail("error");
		}
	});

	it("PUT test for dataset 400 err", async () => {
		try {
			return await request("http://localhost:4321")
				.put("/dataset/" + "abc" + "/" + "err")
				.send(sections)
				.set("Content-Type", "application/x-zip-compressed")
				.then((res: Response) => {
					expect(res.status).to.be.equal(400);
				})
				.catch((err) => {
					// some logging here please!
					expect.fail("error");
				});
		} catch (err) {
			// and some more logging here!
			expect.fail("error");
		}
	});


	it("GET test for sections dataset", async () => {
		try {
			return await request("http://localhost:4321")
				.get("/datasets")
				.then((res: Response) => {
					console.log(res.body.result);
					expect(res.status).to.be.equal(200);
					expect(res.body.result).to.deep.equal([
						{id: "abc", kind: "sections", numRows: 64612},
						{id: "def", kind: "rooms", numRows: 364}
					]
					);
				})
				.catch((err) => {
					// some logging here please!
					expect.fail("error");
				});
		} catch (err) {
			// and some more logging here!
			expect.fail("error");
		}
	});
	it("DELETE test for courses dataset", async () => {
		try {
			return await request("http://localhost:4321")
				.put("/dataset/" + "abc" + "/" + "sections")
				.send(sections)
				.set("Content-Type", "application/x-zip-compressed")
				.then(async () => {
					return await request("http://localhost:4321")
						.delete("/dataset/" + "abc")
						.then((res2) => {
							expect(res2.status).to.be.equal(200);
							expect(res2.body.result).to.be.equal("abc");
						}).catch((err) => {
							// some logging here please!
							expect.fail("error");
						});
				});
		} catch (err) {
			// and some more logging here!
			expect.fail("error");
		}
	});

	it("DELETE test for courses dataset InsightError", async () => {
		try {
			await request("http://localhost:4321")
				.put("/dataset/" + "abc" + "/" + "sections")
				.send(sections)
				.set("Content-Type", "application/x-zip-compressed");

			const res = await request("http://localhost:4321").delete("/dataset/__");
			expect(res.status).to.be.equal(400);
		} catch (err) {
			// handle error here
			expect.fail("error");
		}
	});

	it("DELETE test for courses dataset NotFoundError", async () => {
		try {
			await request("http://localhost:4321")
				.put("/dataset/" + "abc" + "/" + "sections")
				.send(sections)
				.set("Content-Type", "application/x-zip-compressed");

			const res = await request("http://localhost:4321").delete("/dataset/aslkdfjlsk");
			expect(res.status).to.be.equal(404);
		} catch (err) {
			// handle error here
			expect.fail("error");
		}
	});
});
