import {InsightDataset, InsightDatasetKind, InsightError, InsightResult, ResultTooLargeError} from "./IInsightFacade";
import InsightFacade from "./InsightFacade";
import Dataset from "./Dataset";
import Section from "./Section";
import Room from "./Room";
import QueryExtend from "./QueryExtend";

export default class Query {
	private readonly query: any;
	constructor(query: any) {
		this.query = query;
	}

	public validateQuery(): void {
		if (typeof this.query !== "object" || JSON.stringify(this.query) === "{}") {
			throw new InsightError("Not an Object");
		}
		try{
			JSON.parse(JSON.stringify(this.query));
		} catch (err){
			throw new InsightError("Syntax error");
		}
		// if (Object.keys(this.query).length > 2) {
		// 	throw new InsightError("More keys than expected");
		// }
		const numKeys = Object.keys(this.query);
		let arr = ["WHERE","OPTIONS","TRANSFORMATIONS"];
		for (let i of numKeys) {
			if(!arr.includes(i)) {
				throw new InsightError("More keys than expected");
			}
		}
	}

	public validQueryValues(query: any) {
		if (typeof query !== "object" || JSON.stringify(query) === "{}") {
			throw new InsightError("Wrong query");
		}
	}

	public checkEmpty(query: any) {
		if (query === "") {
			throw new InsightError("Empty");
		}
	}

	public checkSecKeys(key: any, value: any, dataId: any) {
		let sec: any;
		if (dataId === "sections") {
			sec = new Section("", "", "", "", "", 0, 0, 0, 0, 0);
		} else if (dataId === "rooms") {
			sec = new Room("","","","","",0,0,0,"","","");
		} else {
			throw new InsightError("Non-existent ID");
		}
		if (typeof sec[key] !== typeof value) {
			throw new InsightError("Type");
		}
	}

	public checkID(query: any, dataset: Dataset[]) {
		let check = 0;
		for (let ds of dataset) {
			if (ds.name === query) {
				check = 1;
			}
		}
		if (check === 0) {
			throw new InsightError("Non existent ID");
		}
	}

	public validateBody(): void {
		if (typeof this.query.WHERE !== "object") {
			throw new InsightError("Where is not an object");
		}
	}

	public validateOptions(): void {
		if (typeof this.query.OPTIONS !== "object" || JSON.stringify(this.query.OPTIONS) === "{}") {
			throw new InsightError("Options is not an object");
		}
		this.validateColumns();
	}

	public validateColumns(): void {
		if (typeof this.query.OPTIONS.COLUMNS !== "object" || this.query.OPTIONS.COLUMNS === null) {
			throw new InsightError("COLUMNS is not an object");
		}
		if (this.query.OPTIONS.COLUMNS instanceof Array === false) {
			throw new InsightError("COLUMNS is not an array");
		}
	}

	public getBody() {
		return this.query.WHERE;
	}

	public getOptions() {
		return this.query.OPTIONS;
	}

	public filter(body: any, options: any, dataset: Dataset[]) {
		let results: any = [];
		// console.log(dataset.length);
		results = this.whereHelper(body, dataset);
		return this.columns(options, results);
	}

	public columns(options: any, dataset: Dataset[]) {
		let key = Object.keys(options);
		let value = Object.values(options);
		let keys: any = Object.values(value)[0];
		let sections: any[];
		let arrType = keys[0].split("_");
		let order: any = Object.values(value)[1];
		let insightArr: InsightResult[] = [];
		let data: Dataset;
		if(arrType[0] === "sections") {
			data = dataset[0];
		} else {
			data = dataset[1];
		}
		// console.log(dataset.length);
		// console.log(data.name);
		if (key[1] === "ORDER") {
			if (JSON.stringify(order) !== "") {
				let orderParam = order.split("_");
				this.checkID(orderParam[0], dataset);
				sections = data.sections.sort((n1: any, n2: any) => {
					if (n1[orderParam[1]] > n2[orderParam[1]]) {
						return 1;
					} else if (n1[orderParam[1]] < n2[orderParam[1]]) {
						return -1;
					}
					return 0;
				});
			} else {
				sections = data.sections;
			}
		} else {
			sections = data.sections;
		}
		for (let i = 0; i < data.rows; i++) {
			let insight: InsightResult = {};
			for (let count in keys) {
				let keysVal: any = keys[count].split("_");
				this.checkID(keysVal[0], dataset);
				let keysParam: string = keysVal[1];
				// i[keysVal[1]];
				let section: any = sections[i];
				insight[keys[count]] = section[keysParam];
			}
			insightArr.push(insight);
		}
		if (insightArr.length > 5000) {
			throw new ResultTooLargeError(">5000");
		}
		return insightArr;
	}

	public whereHelper(query: any, dataset: Dataset[]) {
		let results: any = [];
		// this.validQueryValues(query);
		// console.log(dataset.length);
		let query1 = new QueryExtend(this.query);
		if (Object.keys(query).length === 0) {
			results = dataset;
			// console.log(dataset.length);
		} else if ("GT" in query || "LT" in query || "EQ" in query) {
			results = query1.comparator(query, dataset);
		} else if ("AND" in query || "OR" in query) {
			results = query1.logic(query, dataset);
		} else if ("IS" in query) {
			results = this.IS(query, dataset);
		} else if ("NOT" in query) {
			results = this.NOT(query, dataset);
		}
		return results;
	}

	public IS(query: any, dataset: Dataset[]) {
		let result: Dataset[] = [];
		let secArr: Section[] = [];
		let key = Object.keys(query);
		let variable = Object.keys(query[key[0]]);
		let value: any = Object.values(query[key[0]]);
		let var1 = variable[0].split("_");
		let param: any = var1[1];
		let dataId: any = var1[0];
		this.checkSecKeys(param, value[0], dataId);
		this.validQueryValues(key);
		this.validQueryValues(variable);
		this.checkEmpty(param);
		this.checkEmpty(dataId);
		this.checkID(dataId, dataset);
		let i: Dataset;
		if(dataId === "sections") {
			i = dataset[0];
		} else {
			i = dataset[1];
		}
		let sections = i.sections;
		for (let secCount = 0; secCount < i.rows; secCount++) {
			let section: any = sections[secCount];
			if (i.name === dataId) {
				if (section[var1[1]] === value[0]) {
					secArr.push(section);
				} else if (value[0].startsWith("*") && value[0].endsWith("*")) {
					let value2 = value[0].replace("*", "");
					let value1 = value2.replace("*", "");
					if (section[param].includes(value1)) {
						secArr.push(section);
					}
				} else if (value[0].endsWith("*")) {
					let value1: any = value[0].replace("*", "");
					if (section[param].startsWith(value1)) {
						secArr.push(section);
					}
				} else if (value[0].startsWith("*")) {
					let value1 = value[0].replace("*", "");
					if (section[param].endsWith(value1)) {
						secArr.push(section);
					}
				}
			}
		}
		let data: Dataset = new Dataset(i.name, secArr, secArr.length, InsightDatasetKind.Sections);
		result.push(data);
		return result;
	}

	public NOT(query: any, dataset: Dataset[]) {
		let result: Dataset[] = [];
		let sections: Section[] = [];
		let key = Object.keys(query);
		// console.log(key);
		let variable = query[key[0]];
		// console.log(variable);
		let arrType = Object.keys(variable[Object.keys(variable)[0]])[0].split("_");
		let value1: Dataset[] = this.whereHelper(variable, dataset);
		let i: Dataset;// let value = Object.values(query[key[0]]);
		if(arrType[0] === "sections") {
			i = dataset[0];
		} else {
			i = dataset[1];
		}
		this.checkID(value1[0].name, dataset);
		let a = new Set<Section>(dataset[0].sections);
		let b = new Set<Section>(value1[0].sections);
		let c = new Set([...a].filter((x) => !b.has(x)));
		// sections = dataset[0].sections.filter((sec)=> {
		// 	return !(value1[0].sections.includes(sec));
		// });
		sections = Array.from(c);
		let data: Dataset = new Dataset(i.name, sections, sections.length, InsightDatasetKind.Sections);
		result.push(data);
		return result;
	}
}
