"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Server_1 = __importDefault(require("../../src/rest/Server"));
const InsightFacade_1 = __importDefault(require("../../src/controller/InsightFacade"));
const chai_1 = require("chai");
const supertest_1 = __importDefault(require("supertest"));
const fs = __importStar(require("fs-extra"));
const TestUtil_1 = require("../TestUtil");
describe("Server", () => {
    let facade;
    let server;
    let sections;
    let rooms;
    before(async () => {
        sections = fs.readFileSync("test/resources/archives/" + "pair.zip");
        rooms = fs.readFileSync("test/resources/archives/" + "campus.zip");
        server = new Server_1.default(4321);
        try {
            await server.start();
        }
        catch (err) {
            console.error("server start error");
        }
    });
    after(async () => {
        try {
            await server.stop();
        }
        catch (err) {
            console.error("server stop error");
        }
    });
    beforeEach(async () => {
        (0, TestUtil_1.clearDisk)();
        facade = new InsightFacade_1.default();
    });
    afterEach(async () => {
        (0, TestUtil_1.clearDisk)();
    });
    it("PUT test for courses dataset", async () => {
        try {
            return await (0, supertest_1.default)("http://localhost:4321")
                .put("/dataset/" + "abc" + "/" + "sections")
                .send(sections)
                .set("Content-Type", "application/x-zip-compressed")
                .then((res) => {
                (0, chai_1.expect)(res.status).to.be.equal(200);
                (0, chai_1.expect)(res.body.result).to.deep.equals(["abc"]);
            })
                .catch((err) => {
                chai_1.expect.fail("error");
            });
        }
        catch (err) {
            chai_1.expect.fail("error");
        }
    });
    it("PUT test for rooms dataset", async () => {
        try {
            return await (0, supertest_1.default)("http://localhost:4321")
                .put("/dataset/" + "def" + "/" + "rooms")
                .send(rooms)
                .set("Content-Type", "application/x-zip-compressed")
                .then((res) => {
                console.log(res.status);
                console.log(res.body.result);
                (0, chai_1.expect)(res.status).to.be.equal(200);
                (0, chai_1.expect)(res.body.result).to.deep.equal(["abc", "def"]);
            })
                .catch((err) => {
                chai_1.expect.fail("error");
            });
        }
        catch (err) {
            chai_1.expect.fail("error");
        }
    });
    it("PUT test for dataset 400 err", async () => {
        try {
            return await (0, supertest_1.default)("http://localhost:4321")
                .put("/dataset/" + "abc" + "/" + "err")
                .send(sections)
                .set("Content-Type", "application/x-zip-compressed")
                .then((res) => {
                (0, chai_1.expect)(res.status).to.be.equal(400);
            })
                .catch((err) => {
                chai_1.expect.fail("error");
            });
        }
        catch (err) {
            chai_1.expect.fail("error");
        }
    });
    it("GET test for sections dataset", async () => {
        try {
            return await (0, supertest_1.default)("http://localhost:4321")
                .get("/datasets")
                .then((res) => {
                console.log(res.body.result);
                (0, chai_1.expect)(res.status).to.be.equal(200);
                (0, chai_1.expect)(res.body.result).to.deep.equal([
                    { id: "abc", kind: "sections", numRows: 64612 },
                    { id: "def", kind: "rooms", numRows: 364 }
                ]);
            })
                .catch((err) => {
                chai_1.expect.fail("error");
            });
        }
        catch (err) {
            chai_1.expect.fail("error");
        }
    });
    it("DELETE test for courses dataset", async () => {
        try {
            return await (0, supertest_1.default)("http://localhost:4321")
                .put("/dataset/" + "abc" + "/" + "sections")
                .send(sections)
                .set("Content-Type", "application/x-zip-compressed")
                .then(async () => {
                return await (0, supertest_1.default)("http://localhost:4321")
                    .delete("/dataset/" + "abc")
                    .then((res2) => {
                    (0, chai_1.expect)(res2.status).to.be.equal(200);
                    (0, chai_1.expect)(res2.body.result).to.be.equal("abc");
                }).catch((err) => {
                    chai_1.expect.fail("error");
                });
            });
        }
        catch (err) {
            chai_1.expect.fail("error");
        }
    });
    it("DELETE test for courses dataset InsightError", async () => {
        try {
            await (0, supertest_1.default)("http://localhost:4321")
                .put("/dataset/" + "abc" + "/" + "sections")
                .send(sections)
                .set("Content-Type", "application/x-zip-compressed");
            const res = await (0, supertest_1.default)("http://localhost:4321").delete("/dataset/__");
            (0, chai_1.expect)(res.status).to.be.equal(400);
        }
        catch (err) {
            chai_1.expect.fail("error");
        }
    });
    it("DELETE test for courses dataset NotFoundError", async () => {
        try {
            await (0, supertest_1.default)("http://localhost:4321")
                .put("/dataset/" + "abc" + "/" + "sections")
                .send(sections)
                .set("Content-Type", "application/x-zip-compressed");
            const res = await (0, supertest_1.default)("http://localhost:4321").delete("/dataset/aslkdfjlsk");
            (0, chai_1.expect)(res.status).to.be.equal(404);
        }
        catch (err) {
            chai_1.expect.fail("error");
        }
    });
});
//# sourceMappingURL=Server.spec.js.map