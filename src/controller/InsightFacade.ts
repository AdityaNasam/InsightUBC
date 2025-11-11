import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError
} from "./IInsightFacade";
import JSZip from "jszip";
import fs from "fs-extra";
import Section from "./Section";
import Dataset from "./Dataset";
import Query from "./Query";
import Room from "./Room";
import {parse} from "parse5";
import http from "http";
import DatasetProcessor from "./DatasetProcessor";
import Transformations from "./Transformations";


/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	private allDatasets: Dataset[];

	constructor() {
		this.allDatasets = [];
		// console.log("InsightFacadeImpl::init()");
		if (fs.existsSync("./data/allDatasets.json")) {
			try {
				let data = fs.readFileSync("./data/allDatasets.json", "utf8");
				this.allDatasets = JSON.parse(data);
			} catch (err) {
				console.error("failed to read json");
				this.allDatasets = [];
			}
		}
	}

	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		if (id === "") {
			return Promise.reject(new InsightError("Empty Dataset"));
		} else if (id.includes("_")) {
			return Promise.reject(new InsightError("Underscore in ID"));
		} else if (id.trim().length === 0) {
			return Promise.reject(new InsightError("White Spaces"));
		}
		for (const ds of this.allDatasets) {
			// console.log(ds);
			if (ds.name === id) {
				// console.log(ds.name);
				// console.log(id);
				// console.log(ds.name);
				return Promise.reject(new InsightError("Dataset already added"));
			}
		}
		if (kind === InsightDatasetKind.Rooms) {
			return this.roomsHelper(content, id, kind);
		} else if (kind === InsightDatasetKind.Sections) {
			return this.sectionsHelper(content, id, kind);

		}
		return Promise.reject(new InsightError("invalid kind"));
	}

// json . parse (json format is wrong)
	public async roomsHelper(content: string, id: string, kind: InsightDatasetKind): Promise<string[]> {
		const zip = new JSZip();
		let rooms: Room[] = [];
		let datap: DatasetProcessor = new DatasetProcessor(content, id);
		let allPromises: Array<Promise<Room>> = [];
		let queue: any[] = [];
		try {
			await zip.loadAsync(content, {base64: true});
			const indexhtm = zip.file("index.htm");
			if (indexhtm) {
				const indexContent = await indexhtm.async("string");
				const parseIndex = parse(indexContent) as any;
				queue.push(parseIndex);
				while (queue.length > 0) {
					const node = queue.shift();
					if (node.nodeName === "tbody") {
						for (const tbody of node.childNodes) {
							if (tbody.nodeName === "tr") {
								let trooms: Room[] = [];
								let shortname: any = "", fullname: any = "", address: any = "", path: any = "";
								allPromises.push(datap.getBuildingDet(tbody, content, trooms,
									shortname, fullname, address, path));
							}
						}
					}

					if (node.childNodes) {
						for (const childNode of node.childNodes) {
							queue.push(childNode);
						}
					}
				}
				// console.time("promises");
				const allRooms = await Promise.all(allPromises);
				// console.timeEnd("promises");
				rooms = allRooms.filter((room) => room !== undefined);
				rooms = rooms.flat();
			} else {
				throw new InsightError("index.htm not found in the zip folder");
			}
		} catch {
			return Promise.reject(new InsightError("Not a valid zip file"));
		}
		// console.log(rooms.length);
		if (rooms.length === 0) {
			return Promise.reject(new InsightError("no valid sections"));
		}
		const datasets = new Dataset(id, rooms, rooms.length, kind);
		return Promise.resolve(await this.persistData(datasets));
	}

	public async sectionsHelper(content: string, id: string, kind: InsightDatasetKind): Promise<string[]> {
		const zip = new JSZip();
		const sections: Section[] = [];

		try {
			const file = await zip.loadAsync(content, {base64: true});

			const promArr: any[] = [];
			file.forEach((relativePath, nfile) => {
				promArr.push(nfile.async("string").then(secfunc));

				function secfunc(sect: string) {
					try {
						const jsObject = JSON.parse(sect);
						for (const sec of jsObject.result) {
							let year: any = sec["Year"];
							if (sec["Section"] === "overall") {
								year = 1900;
							}
							const section = new Section(
								String(sec["id"]), sec["Course"], sec["Title"], sec["Professor"], sec["Subject"],
								Number(year), sec["Avg"], sec["Pass"], sec["Fail"], sec["Audit"]
							);
							sections.push(section);
						}
					} catch (error) {
						console.error("");
					}
				}
			});

			await Promise.all(promArr);

			if (sections.length === 0) {
				return Promise.reject(new InsightError("no valid sections"));
			}

			const datasets = new Dataset(id, sections, sections.length, kind);
			return Promise.resolve(await this.persistData(datasets));

		} catch (error) {
			console.log(error);
			return Promise.reject(new InsightError("Not a valid zip file"));
		}
	}

	public removeDataset(id: string): Promise<string> {
		if (id === "") {
			return Promise.reject(new InsightError("Empty String Id"));
		} else if (id.includes("_")) {
			return Promise.reject(new InsightError("Underscore in ID"));
		} else if (id.trim().length === 0) {
			return Promise.reject(new InsightError("White Spaces"));
		}
		if (!this.allDatasets) {
			return Promise.reject(new InsightError("Empty Dataset"));
		}
		let remaining: Dataset[] = [];
		for (let i = 0; i < this.allDatasets.length; i++) {
			let ds = this.allDatasets[i];
			if (ds.name === id) {
				remaining = this.allDatasets.splice(i);
				this.allDatasets = remaining;
				fs.writeFile("./data/allDatasets.json", JSON.stringify(this.allDatasets));
				return Promise.resolve(id);
			}
		}
		return Promise.reject(new NotFoundError("Non-existent ID"));
	}

// every time remove dataset also remove from private field and then save again to disk
	public performQuery(query: unknown): Promise<InsightResult[]> {
		// query as any;
		// query["WHERE:"];
		try {
			let query1: Query = new Query(query);
			let trans1: Transformations = new Transformations(query);
			query1.validateQuery();
			query1.validateBody();
			query1.validateOptions();
			let result;
			if (trans1.getTransformations() !== null) {
				result = trans1.filterTransformations(query1.getBody(), query1.getOptions(),
					trans1.getTransformations(), this.allDatasets);
			} else {
				result = query1.filter(query1.getBody(), query1.getOptions(), this.allDatasets);
			}
			// console.log(Object.keys(datasets));
			return Promise.resolve(result);
		} catch (err) {
			return Promise.reject(err);
		}
	}

	public listDatasets(): Promise<InsightDataset[]> {
		const listOfData: InsightDataset[] = [];
		this.allDatasets.forEach((ds) => {
			let ld: InsightDataset = {id: ds.name, kind: ds.kind, numRows: ds.rows};
			listOfData.push(ld);
		});
		return Promise.resolve(listOfData);
	}

	private async persistData(datasets: Dataset): Promise<string[]> {
		this.allDatasets.push(datasets);
		if (!fs.existsSync("./data/")) {
			fs.mkdirSync("./data/");
		}
		await fs.promises.writeFile("./data/allDatasets.json", JSON.stringify(this.allDatasets),
			{encoding: "utf-8"});
		const ids: string[] = [];
		this.allDatasets.forEach((ds) => {
			ids.push(ds.name);
		});
		return ids;
	}
}

