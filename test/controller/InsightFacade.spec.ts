import {
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError,
} from "../../src/controller/IInsightFacade";
import {clearDisk, getContentFromArchives} from "../resources/archives/TestUtil";
import InsightFacade from "../../src/controller/InsightFacade";
import chai, {expect} from "chai";
import chaiAsPromised from "chai-as-promised";
import {folderTest} from "@ubccpsc310/folder-test";
import fs from "fs-extra";

chai.use(chaiAsPromised);

type Input = unknown;
type Output = Promise<InsightResult[]>;
type Error = "InsightError" | "ResultTooLargeError";

describe("InsightFacade", function () {
	describe("addDataset", function () {
		let sections: string;
		let rooms: string;
		let invSections: string;
		let nonZip: string;
		let facade: InsightFacade;
		let invPair: string;

		before(function () {
			sections = getContentFromArchives("pair.zip");
			rooms = getContentFromArchives("campus.zip");
			invSections = getContentFromArchives("test.zip");
			nonZip = getContentFromArchives("test.txt");
			invPair = getContentFromArchives("invpair.zip");
		});
		beforeEach(function () {
			clearDisk();
			facade = new InsightFacade();
		});
		it("should successfully add a dataset", function () {
			const result = facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.have.members(["ubc"]);
		});

		it("should successfully add a rooms dataset", function () {
			const result = facade.addDataset("ubc", rooms, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.have.members(["ubc"]);
		});

		it("should successfully add another dataset", async function () {
			await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
			const result = facade.addDataset("sfu", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.have.members(["ubc", "sfu"]);
		});

		it("should successfully add another rooms dataset", async function () {
			await facade.addDataset("ubc", rooms, InsightDatasetKind.Rooms);
			const result = facade.addDataset("sfu", rooms, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.have.members(["ubc", "sfu"]);
		});

		it("should reject with a id containing whitespace + underscore", function () {
			const result = facade.addDataset("_ ", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject with a id containing whitespace + underscore - kind rooms", function () {
			const result = facade.addDataset("_ ", rooms, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject adding dataset that is not a zip file", function () {
			const result = facade.addDataset("ubc", nonZip, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject adding dataset that is not a zip file  - kind room", function () {
			const result = facade.addDataset("ubc", nonZip, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject adding dataset that does not contain any valid sections", function () {
			const result = facade.addDataset("ubc", invSections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject adding dataset that contains an invalid section", function () {
			const result = facade.addDataset("ubc", invPair, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject with an empty dataset id", function () {
			const result = facade.addDataset("", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject with an empty dataset id - kind rooms", function () {
			const result = facade.addDataset("", rooms, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject with an underscore dataset id", function () {
			const result = facade.addDataset("_", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject with an underscore dataset id - kind rooms", function () {
			const result = facade.addDataset("_", rooms, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject with an whitespace dataset id", function () {
			const result = facade.addDataset("   ", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject with an whitespace dataset id - kind rooms", function () {
			const result = facade.addDataset("   ", rooms, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject with an already added dataset id", async function () {
			await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
			const result = facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject with an already added dataset id - kind rooms", async function () {
			await facade.addDataset("ubc", rooms, InsightDatasetKind.Rooms);
			const result = facade.addDataset("ubc", rooms, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should disallow adding same dataset id after crash", async function () {
			await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
			let facade2 = new InsightFacade();
			const result = facade2.addDataset("ubc", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});
	});
	describe("InsightFacade", function () {
		describe("removeDataset", function () {
			let sections: string;
			let rooms: string;
			let facade: InsightFacade;

			before(function () {
				sections = getContentFromArchives("pair.zip");
				rooms = getContentFromArchives("campus.zip");
			});
			beforeEach(function () {
				clearDisk();
				facade = new InsightFacade();
			});
			it("should successfully remove a dataset", async function () {
				await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
				const result = facade.removeDataset("ubc");
				return expect(result).to.eventually.deep.equal("ubc");
			});

			it("should successfully remove a dataset - kind rooms", async function () {
				await facade.addDataset("ubc", rooms, InsightDatasetKind.Rooms);
				const result = facade.removeDataset("ubc");
				return expect(result).to.eventually.deep.equal("ubc");
			});

			it("should reject removal of dataset with non-existent id", function () {
				const result = facade.removeDataset("flowers");
				return expect(result).to.eventually.be.rejectedWith(NotFoundError);
			});

			it("should reject removal of dataset with non-existent id - kind rooms", async function () {
				await facade.addDataset("ubc", rooms, InsightDatasetKind.Rooms);
				const result = facade.removeDataset("flowers");
				return expect(result).to.eventually.be.rejectedWith(NotFoundError);
			});

			it("should reject removal of an empty dataset id", function () {
				const result = facade.removeDataset("");
				return expect(result).to.eventually.be.rejectedWith(InsightError);
			});
		});
	});

	describe("listDatasets", function () {
		let sections: string;
		let rooms: string;
		let facade: InsightFacade;
		let facade2: InsightFacade;

		before(function () {
			sections = getContentFromArchives("pair.zip");
			rooms = getContentFromArchives("campus.zip");
		});
		beforeEach(function () {
			clearDisk();
			facade = new InsightFacade();
		});
		it("should list a single added dataset", async function () {
			await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
			const dataset1 = await facade.listDatasets();
			return expect(dataset1).to.deep.equal([{id: "ubc", kind: InsightDatasetKind.Sections, numRows: 64612}]);
		});

		it("should list a single added dataset -kind rooms", async function () {
			await facade.addDataset("ubc", rooms, InsightDatasetKind.Rooms);
			const dataset1 = await facade.listDatasets();
			return expect(dataset1).to.deep.equal([{id: "ubc", kind: InsightDatasetKind.Rooms, numRows: 364}]);
		});

		it("should list all added datasets after crash", async function () {
			await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
			facade2 = new InsightFacade();
			await facade2.addDataset("sfu", sections, InsightDatasetKind.Sections);
			const datasets = await facade2.listDatasets();
			return expect(datasets).to.deep.equal([
				{id: "ubc", kind: InsightDatasetKind.Sections, numRows: 64612},
				{id: "sfu", kind: InsightDatasetKind.Sections, numRows: 64612},
			]);
		});

		it("should list all added datasets after crash - kind rooms", async function () {
			await facade.addDataset("ubc", rooms , InsightDatasetKind.Rooms);
			facade2 = new InsightFacade();
			await facade2.addDataset("sfu", rooms , InsightDatasetKind.Rooms);
			const datasets = await facade2.listDatasets();
			return expect(datasets).to.deep.equal([
				{id: "ubc", kind: InsightDatasetKind.Sections, numRows: 364},
				{id: "sfu", kind: InsightDatasetKind.Sections, numRows: 364},
			]);
		});

		it("should list multiple added dataset", async function () {
			await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
			await facade.addDataset("kpu", sections, InsightDatasetKind.Sections);
			await facade.addDataset("sfu", sections, InsightDatasetKind.Sections);
			const datasets = await facade.listDatasets();
			return expect(datasets).to.deep.equal([
				{id: "ubc", kind: InsightDatasetKind.Sections, numRows: 64612},
				{id: "kpu", kind: InsightDatasetKind.Sections, numRows: 64612},
				{id: "sfu", kind: InsightDatasetKind.Sections, numRows: 64612},
			]);
		});

		it("should list multiple added dataset - kind rooms", async function () {
			await facade.addDataset("ubc", rooms, InsightDatasetKind.Rooms);
			await facade.addDataset("kpu", rooms, InsightDatasetKind.Rooms);
			await facade.addDataset("sfu", rooms, InsightDatasetKind.Rooms);
			const datasets = await facade.listDatasets();
			return expect(datasets).to.deep.equal([
				{id: "ubc", kind: InsightDatasetKind.Rooms, numRows: 364},
				{id: "kpu", kind: InsightDatasetKind.Rooms, numRows: 364},
				{id: "sfu", kind: InsightDatasetKind.Rooms, numRows: 364},
			]);
		});
		it("should list an empty array", function () {
			const dataset1 = facade.listDatasets();
			return expect(dataset1).to.eventually.have.members([]);
		});
	});
	describe("performQuery", function () {
		let sections: string;
		let rooms: string;
		let facade: InsightFacade;

		before(async function () {
			clearDisk();
			fs.mkdirpSync("./data/");
			sections = getContentFromArchives("pair.zip");
			rooms = getContentFromArchives("campus.zip");
			facade = new InsightFacade();
			await facade.addDataset("sections", sections, InsightDatasetKind.Sections);
			await facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
		});

		function errorValidator(error: any): error is Error {
			return error === "InsightError" || error === "ResultTooLargeError";
		}

		function assertOnError(actual: any, expected: Error): void {
			if (expected === "ResultTooLargeError") {
				expect(actual).to.be.instanceof(ResultTooLargeError);
			} else {
				expect(actual).to.be.instanceof(InsightError);
			}
		}

		function assertOnResult(actual: unknown, expected: any): void {
			expect(actual).to.have.length(expected.length);
			expect(actual).to.have.deep.members(expected);
		}

		async function target(input: Input): Output {
			const facade1 = new InsightFacade();
			return await facade1.performQuery(input);
		}

		folderTest<Input, Output, Error>("performQuery tests", target, "./test/resources/queries", {
			errorValidator,
			assertOnError,
			assertOnResult,
		});
	});
});
