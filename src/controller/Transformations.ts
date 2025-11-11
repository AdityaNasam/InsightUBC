import {InsightDataset, InsightDatasetKind, InsightError, InsightResult, ResultTooLargeError} from "./IInsightFacade";
import InsightFacade from "./InsightFacade";
import Dataset from "./Dataset";
import Section from "./Section";
import Query from "./Query";
import Room from "./Room";
import Decimal from "decimal.js";

export default class Transformations{

	private readonly query: any;
	private query1: Query;
	constructor(query: any) {
		this.query = query;
		this.query1 = new Query(this.query);
	}

	public getTransformations(){

		if(this.checkTransformations(this.query)) {
			return this.query.TRANSFORMATIONS;
		}
		return null;
	}

	public checkTransformations(query: any) {
		let temp = "TRANSFORMATIONS";
		if(Object.keys(query).includes(temp)) {
			return true;
		}
		return false;
	}

	public transformations(options: any, transformations: any, dataset: Dataset[]) {
		let key = Object.keys(transformations);
		let value = Object.values(transformations);
		let keys: any = Object.values(value)[0];
		let a = this.groups(transformations,dataset);
		let b = this.apply(transformations.APPLY,a);
		return this.columns(options,transformations,b,a);
	}

	public groups(transformations: any, dataset: Dataset[]) {
		// console.log(Object.values(dataset[1])[0]);
		// console.log(dataset.length);
		this.checkGroup(transformations.GROUP);
		let key = Object.keys(transformations);
		let value: any = Object.values(transformations);
		let variables = value[0];
		// console.log(variables);
		let dataId = variables[0].split("_");
		let data: Dataset;
		try {
			if (dataId[0] === dataset[0].name) {
				data = dataset[0];
			} else if (dataId[0] === dataset[1].name) {
				data = dataset[1];
			} else {
				throw new InsightError("Non-Existent dataset");
			}
		} catch(err) {
			throw new InsightError("Non-Existent ID");
		}
		// console.log(data);
		let arr: any[][];
		let temp: any = [];
		for(let a of variables) {
			let param = a.split("_")[1];
			temp.push(param);
		}
		const result = this.groupBy(data.sections, function(item: any) {
			let temp1 = [];
			for(let a of temp) {
				temp1.push(item[a]);
			}
			return [temp1];
		});
		return result;
	}

	// https://codereview.stackexchange.com/questions/37028/grouping-elements-in-array-by-multiple-properties
	public groupBy( array: any , f: any ) {
		const groups: any = {};
		array.forEach( function( o: any ) {
			const group: any = JSON.stringify( f(o) );
			groups[group] = groups[group] || [];
			groups[group].push( o );
		});
		return Object.keys(groups).map( function( group ) {
			return groups[group];
		});
	}

	public apply(apply: any, dataset: Dataset[]) {
		// console.log(apply);
		let keyArr = [];
		for(let a in apply) {
			let dataArr = [];
			for(let d of dataset) {
				let key = Object.keys(apply[a]);
				let value: any = Object.values(apply[a]);
				let key1 = Object.keys(value[0]);
				let param: any = Object.values(value[0]);
				let feature = param[0].split("_");
				if(key1.includes("MIN")) {
					dataArr.push(this.min(feature[1],d));
				} else if(key1.includes("MAX")) {
					dataArr.push(this.max(feature[1],d));
				} else if(key1.includes("AVG")) {
					dataArr.push(this.avg(feature[1],d));
				} else if(key1.includes("SUM")) {
					dataArr.push(this.sum(feature[1],d));
				} else if(key1.includes("COUNT")) {
					dataArr.push(this.count(feature[1],d));
				}
			}
			keyArr.push(dataArr);
		}
		return keyArr;
	}

	public min(parameter: any, dataset: any) {
		let min: number = (dataset[0][parameter] as number);
		for(let a of dataset) {
			if((a[parameter] as number) < min) {
				min = (a[parameter] as number);
			}
		}
		return min;
	}

	public max(parameter: any, dataset: any) {
		let max: number = parseInt(dataset[0][parameter],10);
		for(let a of dataset) {
			if((a[parameter]) > max) {
				max = parseInt(a[parameter],10);
			}
		}
		return max;
	}

	public avg(parameter: any, dataset: any) {
		let b: number , sum: any = 0, count: number = 0, total: any = 0;
		for(let a of dataset) {
			sum = new Decimal(a[parameter]);
			total = Decimal.add(total,sum);
			count++;
		}
		b = total.toNumber() / count;
		return Number(b.toFixed(2));
	}

	public sum(parameter: any, dataset: any) {
		let sum: number = 0;
		for(let a of dataset) {
			sum = sum + parseInt(a[parameter], 10);
		}
		// console.log(sum);
		return sum;
	}

	public count(parameter: any, dataset: any) {
		let count: number = 0;
		let tempArr: any = [];
		for(let a of dataset) {
			if(!tempArr.includes(a[parameter])) {
				tempArr.push(a[parameter]);
				count++;
			}
		}
		return count;
	}

	public checkApply(query: any) {
		if (typeof query !== "object" || JSON.stringify(query) === "{}") {
			throw new InsightError("Wrong query");
		}
	}

	public checkGroup(query: any) {
		this.checkApply(query);
		if(query.length === 0) {
			throw new InsightError("Empty Group");
		}
	}

	public order(options: any, dataset: any) {
		let key = Object.keys(options);
		let value = Object.values(options);
		let order: any = Object.values(value)[1];
		let insight: InsightResult[] = [];
		if(key[1] === "ORDER") {
			if (JSON.stringify(order) !== "") {
				let dir: any = order["dir"];
				let keys: any = order["keys"];
				for (let a in dataset) {
					if (keys.length === 1) {
						if(dir === "UP") {
							insight = dataset.sort((n1: any, n2: any) => {
								if (n1[keys[0]] > n2[keys[0]]) {
									return 1;
								} else if (n1[keys[0]] < n2[keys[0]]) {
									return -1;
								}
								return 0;
							});
						} else if(dir === "DOWN"){
							insight = dataset.sort((n1: any, n2: any) => {
								if (n1[keys[0]] < n2[keys[0]]) {
									return 1;
								} else if (n1[keys[0]] > n2[keys[0]]) {
									return -1;
								}
								return 0;
							});
						}
					} else if(keys.length === 2) {
						insight = dataset.sort((c: any, b: any) => c[keys[0]] - b[keys[0]] || c[keys[1]] - b[keys[1]]);
					}
				}
			}
		} else {
			insight = dataset;
		}
		return insight;
	}

	public checkOrderColumnsApply(options: any, transformations: any) {
		let value = Object.values(options.COLUMNS);
		this.checkGroup(transformations.GROUP);
		this.checkApply(transformations.APPLY);
		let valueT: any = Object.values(transformations);
		let applyLength = Object.values(transformations.APPLY).length;
		let tempArr = [];
		for(let a of valueT[0]) {
			tempArr.push(a);
		}
		for(let a = 0; a < applyLength; a++) {
			tempArr.push(Object.keys(transformations.APPLY[a])[0]);
		}
		for(let b of value) {
			if(!tempArr.includes(b)) {
				throw new InsightError("Column label not in group and apply");
			}
		}
	}

	public columns(options: any, transformations: any, dataApply: any, dataset: Dataset[]) {
		this.checkOrderColumnsApply(options, transformations);
		let key = Object.keys(options);
		let value = Object.values(options);
		let keys: any = Object.values(value)[0];
		let insightArr: InsightResult[] = [];
		this.checkGroup(transformations.GROUP);
		let keyG = Object.keys(transformations);
		let valueG: any = Object.values(transformations);
		let variables = valueG[0];
		let temp = [];
		let applyNum = Object.values(transformations.APPLY).length;
		let applyTemp = [];
		for(let i = 0;i < applyNum; i++) {
			applyTemp.push(Object.keys(transformations.APPLY[i])[0]);
		}
		for(let a of keys) {
			let param = a.split("_")[1];
			if(typeof param === "undefined") {
				param  = a.split("_")[0];
			}
			temp.push(param);
		}
		for (let i = 0; i < dataset.length; i++) {
			let count = 0;
			let insight: InsightResult = {};
			for(let a of temp) {
				let section: any = (Object.values(dataset[i]))[0][a];
				if(typeof section === "undefined") {
					for(let b in applyTemp) {
						if(a === applyTemp[b]) {
							section = dataApply[b][i];
						}
					}
				}
				insight[keys[count]] = section;
				count++;
			}
			insightArr.push(insight);
		}
		insightArr = this.order(options,insightArr);
		return insightArr;
	}

	public filterTransformations(body: any, options: any, transformations: any, dataset: Dataset[]) {
		let results: any = [];
		results = this.query1.whereHelper(body,dataset);
		return this.transformations(options,transformations,results);
	}
}
