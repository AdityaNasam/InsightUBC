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
const IInsightFacade_1 = require("../../src/controller/IInsightFacade");
const TestUtil_1 = require("../resources/archives/TestUtil");
const InsightFacade_1 = __importDefault(require("../../src/controller/InsightFacade"));
const chai_1 = __importStar(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const folder_test_1 = require("@ubccpsc310/folder-test");
const fs_extra_1 = __importDefault(require("fs-extra"));
chai_1.default.use(chai_as_promised_1.default);
describe("InsightFacade", function () {
    describe("addDataset", function () {
        let sections;
        let rooms;
        let invSections;
        let nonZip;
        let facade;
        let invPair;
        before(function () {
            sections = (0, TestUtil_1.getContentFromArchives)("pair.zip");
            rooms = (0, TestUtil_1.getContentFromArchives)("campus.zip");
            invSections = (0, TestUtil_1.getContentFromArchives)("test.zip");
            nonZip = (0, TestUtil_1.getContentFromArchives)("test.txt");
            invPair = (0, TestUtil_1.getContentFromArchives)("invpair.zip");
        });
        beforeEach(function () {
            (0, TestUtil_1.clearDisk)();
            facade = new InsightFacade_1.default();
        });
        it("should successfully add a dataset", function () {
            const result = facade.addDataset("ubc", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.have.members(["ubc"]);
        });
        it("should successfully add a rooms dataset", function () {
            const result = facade.addDataset("ubc", rooms, IInsightFacade_1.InsightDatasetKind.Rooms);
            return (0, chai_1.expect)(result).to.eventually.have.members(["ubc"]);
        });
        it("should successfully add another dataset", async function () {
            await facade.addDataset("ubc", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            const result = facade.addDataset("sfu", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.have.members(["ubc", "sfu"]);
        });
        it("should successfully add another rooms dataset", async function () {
            await facade.addDataset("ubc", rooms, IInsightFacade_1.InsightDatasetKind.Rooms);
            const result = facade.addDataset("sfu", rooms, IInsightFacade_1.InsightDatasetKind.Rooms);
            return (0, chai_1.expect)(result).to.eventually.have.members(["ubc", "sfu"]);
        });
        it("should reject with a id containing whitespace + underscore", function () {
            const result = facade.addDataset("_ ", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject with a id containing whitespace + underscore - kind rooms", function () {
            const result = facade.addDataset("_ ", rooms, IInsightFacade_1.InsightDatasetKind.Rooms);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject adding dataset that is not a zip file", function () {
            const result = facade.addDataset("ubc", nonZip, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject adding dataset that is not a zip file  - kind room", function () {
            const result = facade.addDataset("ubc", nonZip, IInsightFacade_1.InsightDatasetKind.Rooms);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject adding dataset that does not contain any valid sections", function () {
            const result = facade.addDataset("ubc", invSections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject adding dataset that contains an invalid section", function () {
            const result = facade.addDataset("ubc", invPair, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject with an empty dataset id", function () {
            const result = facade.addDataset("", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject with an empty dataset id - kind rooms", function () {
            const result = facade.addDataset("", rooms, IInsightFacade_1.InsightDatasetKind.Rooms);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject with an underscore dataset id", function () {
            const result = facade.addDataset("_", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject with an underscore dataset id - kind rooms", function () {
            const result = facade.addDataset("_", rooms, IInsightFacade_1.InsightDatasetKind.Rooms);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject with an whitespace dataset id", function () {
            const result = facade.addDataset("   ", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject with an whitespace dataset id - kind rooms", function () {
            const result = facade.addDataset("   ", rooms, IInsightFacade_1.InsightDatasetKind.Rooms);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject with an already added dataset id", async function () {
            await facade.addDataset("ubc", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            const result = facade.addDataset("ubc", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should reject with an already added dataset id - kind rooms", async function () {
            await facade.addDataset("ubc", rooms, IInsightFacade_1.InsightDatasetKind.Rooms);
            const result = facade.addDataset("ubc", rooms, IInsightFacade_1.InsightDatasetKind.Rooms);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
        it("should disallow adding same dataset id after crash", async function () {
            await facade.addDataset("ubc", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            let facade2 = new InsightFacade_1.default();
            const result = facade2.addDataset("ubc", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
        });
    });
    describe("InsightFacade", function () {
        describe("removeDataset", function () {
            let sections;
            let rooms;
            let facade;
            before(function () {
                sections = (0, TestUtil_1.getContentFromArchives)("pair.zip");
                rooms = (0, TestUtil_1.getContentFromArchives)("campus.zip");
            });
            beforeEach(function () {
                (0, TestUtil_1.clearDisk)();
                facade = new InsightFacade_1.default();
            });
            it("should successfully remove a dataset", async function () {
                await facade.addDataset("ubc", sections, IInsightFacade_1.InsightDatasetKind.Sections);
                const result = facade.removeDataset("ubc");
                return (0, chai_1.expect)(result).to.eventually.deep.equal("ubc");
            });
            it("should successfully remove a dataset - kind rooms", async function () {
                await facade.addDataset("ubc", rooms, IInsightFacade_1.InsightDatasetKind.Rooms);
                const result = facade.removeDataset("ubc");
                return (0, chai_1.expect)(result).to.eventually.deep.equal("ubc");
            });
            it("should reject removal of dataset with non-existent id", function () {
                const result = facade.removeDataset("flowers");
                return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.NotFoundError);
            });
            it("should reject removal of dataset with non-existent id - kind rooms", async function () {
                await facade.addDataset("ubc", rooms, IInsightFacade_1.InsightDatasetKind.Rooms);
                const result = facade.removeDataset("flowers");
                return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.NotFoundError);
            });
            it("should reject removal of an empty dataset id", function () {
                const result = facade.removeDataset("");
                return (0, chai_1.expect)(result).to.eventually.be.rejectedWith(IInsightFacade_1.InsightError);
            });
        });
    });
    describe("listDatasets", function () {
        let sections;
        let rooms;
        let facade;
        let facade2;
        before(function () {
            sections = (0, TestUtil_1.getContentFromArchives)("pair.zip");
            rooms = (0, TestUtil_1.getContentFromArchives)("campus.zip");
        });
        beforeEach(function () {
            (0, TestUtil_1.clearDisk)();
            facade = new InsightFacade_1.default();
        });
        it("should list a single added dataset", async function () {
            await facade.addDataset("ubc", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            const dataset1 = await facade.listDatasets();
            return (0, chai_1.expect)(dataset1).to.deep.equal([{ id: "ubc", kind: IInsightFacade_1.InsightDatasetKind.Sections, numRows: 64612 }]);
        });
        it("should list a single added dataset -kind rooms", async function () {
            await facade.addDataset("ubc", rooms, IInsightFacade_1.InsightDatasetKind.Rooms);
            const dataset1 = await facade.listDatasets();
            return (0, chai_1.expect)(dataset1).to.deep.equal([{ id: "ubc", kind: IInsightFacade_1.InsightDatasetKind.Rooms, numRows: 364 }]);
        });
        it("should list all added datasets after crash", async function () {
            await facade.addDataset("ubc", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            facade2 = new InsightFacade_1.default();
            await facade2.addDataset("sfu", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            const datasets = await facade2.listDatasets();
            return (0, chai_1.expect)(datasets).to.deep.equal([
                { id: "ubc", kind: IInsightFacade_1.InsightDatasetKind.Sections, numRows: 64612 },
                { id: "sfu", kind: IInsightFacade_1.InsightDatasetKind.Sections, numRows: 64612 },
            ]);
        });
        it("should list all added datasets after crash - kind rooms", async function () {
            await facade.addDataset("ubc", rooms, IInsightFacade_1.InsightDatasetKind.Rooms);
            facade2 = new InsightFacade_1.default();
            await facade2.addDataset("sfu", rooms, IInsightFacade_1.InsightDatasetKind.Rooms);
            const datasets = await facade2.listDatasets();
            return (0, chai_1.expect)(datasets).to.deep.equal([
                { id: "ubc", kind: IInsightFacade_1.InsightDatasetKind.Sections, numRows: 364 },
                { id: "sfu", kind: IInsightFacade_1.InsightDatasetKind.Sections, numRows: 364 },
            ]);
        });
        it("should list multiple added dataset", async function () {
            await facade.addDataset("ubc", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            await facade.addDataset("kpu", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            await facade.addDataset("sfu", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            const datasets = await facade.listDatasets();
            return (0, chai_1.expect)(datasets).to.deep.equal([
                { id: "ubc", kind: IInsightFacade_1.InsightDatasetKind.Sections, numRows: 64612 },
                { id: "kpu", kind: IInsightFacade_1.InsightDatasetKind.Sections, numRows: 64612 },
                { id: "sfu", kind: IInsightFacade_1.InsightDatasetKind.Sections, numRows: 64612 },
            ]);
        });
        it("should list multiple added dataset - kind rooms", async function () {
            await facade.addDataset("ubc", rooms, IInsightFacade_1.InsightDatasetKind.Rooms);
            await facade.addDataset("kpu", rooms, IInsightFacade_1.InsightDatasetKind.Rooms);
            await facade.addDataset("sfu", rooms, IInsightFacade_1.InsightDatasetKind.Rooms);
            const datasets = await facade.listDatasets();
            return (0, chai_1.expect)(datasets).to.deep.equal([
                { id: "ubc", kind: IInsightFacade_1.InsightDatasetKind.Rooms, numRows: 364 },
                { id: "kpu", kind: IInsightFacade_1.InsightDatasetKind.Rooms, numRows: 364 },
                { id: "sfu", kind: IInsightFacade_1.InsightDatasetKind.Rooms, numRows: 364 },
            ]);
        });
        it("should list an empty array", function () {
            const dataset1 = facade.listDatasets();
            return (0, chai_1.expect)(dataset1).to.eventually.have.members([]);
        });
    });
    describe("performQuery", function () {
        let sections;
        let rooms;
        let facade;
        before(async function () {
            (0, TestUtil_1.clearDisk)();
            fs_extra_1.default.mkdirpSync("./data/");
            sections = (0, TestUtil_1.getContentFromArchives)("pair.zip");
            rooms = (0, TestUtil_1.getContentFromArchives)("campus.zip");
            facade = new InsightFacade_1.default();
            await facade.addDataset("sections", sections, IInsightFacade_1.InsightDatasetKind.Sections);
            await facade.addDataset("rooms", rooms, IInsightFacade_1.InsightDatasetKind.Rooms);
        });
        function errorValidator(error) {
            return error === "InsightError" || error === "ResultTooLargeError";
        }
        function assertOnError(actual, expected) {
            if (expected === "ResultTooLargeError") {
                (0, chai_1.expect)(actual).to.be.instanceof(IInsightFacade_1.ResultTooLargeError);
            }
            else {
                (0, chai_1.expect)(actual).to.be.instanceof(IInsightFacade_1.InsightError);
            }
        }
        function assertOnResult(actual, expected) {
            (0, chai_1.expect)(actual).to.have.length(expected.length);
            (0, chai_1.expect)(actual).to.have.deep.members(expected);
        }
        async function target(input) {
            const facade1 = new InsightFacade_1.default();
            return await facade1.performQuery(input);
        }
        (0, folder_test_1.folderTest)("performQuery tests", target, "./test/resources/queries", {
            errorValidator,
            assertOnError,
            assertOnResult,
        });
    });
});
//# sourceMappingURL=InsightFacade.spec.js.map