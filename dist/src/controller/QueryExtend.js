"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Query_1 = __importDefault(require("./Query"));
const Dataset_1 = __importDefault(require("./Dataset"));
const IInsightFacade_1 = require("./IInsightFacade");
class QueryExtend {
    query;
    query1;
    constructor(query) {
        this.query = query;
        this.query1 = new Query_1.default(this.query);
    }
    logic(query, dataset) {
        let result = [];
        let sections = [];
        let key = Object.keys(query);
        let variable = Object.keys(query[key[0]]);
        this.query1.validQueryValues(key);
        this.query1.validQueryValues(variable);
        let value1 = this.query1.whereHelper(query[key[0]][variable[0]], dataset);
        this.query1.checkID(value1[0].name, dataset);
        if (key[0] === "AND") {
            sections = (this.query1.whereHelper(query[key[0]][variable[1]], value1))[0].sections;
        }
        else if (key[0] === "OR") {
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
        let data = new Dataset_1.default(value1[0].name, sections, sections.length, IInsightFacade_1.InsightDatasetKind.Sections);
        result.push(data);
        return result;
    }
    comparator(query, dataset) {
        let result = [];
        let secArr = [];
        let key = Object.keys(query);
        let variable = Object.keys(query[key[0]]);
        let value = Object.values(query[key[0]]);
        let var1 = variable[0].split("_");
        let param = var1[1];
        let dataId = var1[0];
        this.query1.validQueryValues(key);
        this.query1.validQueryValues(variable);
        this.query1.checkEmpty(param);
        this.query1.checkEmpty(dataId);
        this.query1.checkID(dataId, dataset);
        this.query1.checkSecKeys(param, value[0], dataId);
        let i;
        if (dataId === dataset[0].name) {
            i = dataset[0];
        }
        else if (dataId === dataset[1].name) {
            i = dataset[1];
        }
        else {
            throw new IInsightFacade_1.InsightError("Non-existent ID");
        }
        let id = i.name;
        let sections = i.sections;
        let numRows = i.rows;
        for (let secCount = 0; secCount < numRows; secCount++) {
            let section = sections[secCount];
            if (id === var1[0]) {
                if (key[0] === "GT") {
                    if (section[param] > value[0]) {
                        secArr.push(section);
                    }
                }
                else if (key[0] === "EQ") {
                    if (section[param] === value[0]) {
                        secArr.push(section);
                    }
                }
                else if (key[0] === "LT") {
                    if (section[param] < value[0]) {
                        secArr.push(section);
                    }
                }
            }
        }
        let data = new Dataset_1.default(i.name, secArr, secArr.length, i.kind);
        result.push(data);
        return result;
    }
}
exports.default = QueryExtend;
//# sourceMappingURL=QueryExtend.js.map