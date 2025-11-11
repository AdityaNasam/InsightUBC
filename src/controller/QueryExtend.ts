import Query from "./Query";
import Dataset from "./Dataset";
import Section from "./Section";
import {InsightDatasetKind, InsightError} from "./IInsightFacade";

export default class QueryExtend{
	private readonly query: any;
	private query1: Query;
	constructor(query: any) {
		this.query = query;
		this.query1 = new Query(this.query);
	}

	public logic(query: any, dataset: Dataset[]) {
		let result: Dataset[] = [];
		let sections: Section[] = [];
		let key = Object.keys(query);
		let variable = Object.keys(query[key[0]]);
		this.query1.validQueryValues(key);
		this.query1.validQueryValues(variable);
		let value1: Dataset[] = this.query1.whereHelper(query[key[0]][variable[0]], dataset);
		this.query1.checkID(value1[0].name, dataset);
		if (key[0] === "AND") {
			sections = (this.query1.whereHelper(query[key[0]][variable[1]], value1))[0].sections;	// 	result.push(i);
		} else if (key[0] === "OR") {
			// let a = new Set<Section>(value1[0].sections);
			// let b = new Set<Section>(this.query1.whereHelper(query[key[0]][variable[1]], dataset)[0].sections);
			// let c = new Set([...a, ...b]);
			// sections = Array.from(c);
			// let a = value1[0].sections;
			// let b = this.query1.whereHelper(query[key[0]][variable[1]], dataset)[0].sections;
			// let c = [];
			// let map = new Map();
			// for (const item of a) {
			// 	if (!map.has(item)) {
			// 		c.push(item);
			// 		map.set(item, true);
			// 	}
			// }
			// for (const item of b) {
			// 	if (!map.has(item)) {
			// 		c.push(item);
			// 		map.set(item, true);
			// 	}
			// }
			// sections = c;
			let a = new Set(value1[0].sections);
			let b = this.query1.whereHelper(query[key[0]][variable[1]], dataset)[0].sections;
			sections = [...a];
			for (const item of b) {
				if (!a.has(item)) {
					sections.push(item);
					a.add(item);
				}
			}
		}
		let data: Dataset = new Dataset(value1[0].name, sections, sections.length, InsightDatasetKind.Sections);
		result.push(data);
		return result;
	}

	public comparator(query: any, dataset: Dataset[]) {
		let result: Dataset[] = [];
		let secArr: Section[] = [];
		let key = Object.keys(query);
		let variable = Object.keys(query[key[0]]);
		let value: any = Object.values(query[key[0]]);
		let var1: any = variable[0].split("_");
		let param: any = var1[1];
		let dataId: any = var1[0];
		this.query1.validQueryValues(key);
		this.query1.validQueryValues(variable);
		this.query1.checkEmpty(param);
		this.query1.checkEmpty(dataId);
		this.query1.checkID(dataId, dataset);
		this.query1.checkSecKeys(param, value[0], dataId);
		let i: Dataset;
		if(dataId === dataset[0].name) {
			i = dataset[0];
		} else if(dataId === dataset[1].name) {
			i = dataset[1];
		} else {
			throw new InsightError("Non-existent ID");
		}
		let id = i.name;
		let sections = i.sections;
		let numRows = i.rows;
		for (let secCount = 0; secCount < numRows; secCount++) {
			let section: any = sections[secCount];
			if (id === var1[0]) {
				if (key[0] === "GT") {
					if (section[param] > value[0]) {
						secArr.push(section);
					}
				} else if (key[0] === "EQ") {
					if (section[param] === value[0]) {
						secArr.push(section);
					}
				} else if (key[0] === "LT") {
					if (section[param] < value[0]) {
						secArr.push(section);
					}
				}
			}
		}
		let data: Dataset = new Dataset(i.name, secArr, secArr.length, i.kind);
		result.push(data);
		return result;
	}
}
