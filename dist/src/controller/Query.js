"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const IInsightFacade_1 = require("./IInsightFacade");
const Dataset_1 = __importDefault(require("./Dataset"));
const Section_1 = __importDefault(require("./Section"));
const Room_1 = __importDefault(require("./Room"));
const QueryExtend_1 = __importDefault(require("./QueryExtend"));
class Query {
    query;
    constructor(query) {
        this.query = query;
    }
    validateQuery() {
        if (typeof this.query !== "object" || JSON.stringify(this.query) === "{}") {
            throw new IInsightFacade_1.InsightError("Not an Object");
        }
        try {
            JSON.parse(JSON.stringify(this.query));
        }
        catch (err) {
            throw new IInsightFacade_1.InsightError("Syntax error");
        }
        const numKeys = Object.keys(this.query);
        let arr = ["WHERE", "OPTIONS", "TRANSFORMATIONS"];
        for (let i of numKeys) {
            if (!arr.includes(i)) {
                throw new IInsightFacade_1.InsightError("More keys than expected");
            }
        }
    }
    validQueryValues(query) {
        if (typeof query !== "object" || JSON.stringify(query) === "{}") {
            throw new IInsightFacade_1.InsightError("Wrong query");
        }
    }
    checkEmpty(query) {
        if (query === "") {
            throw new IInsightFacade_1.InsightError("Empty");
        }
    }
    checkSecKeys(key, value, dataId) {
        let sec;
        if (dataId === "sections") {
            sec = new Section_1.default("", "", "", "", "", 0, 0, 0, 0, 0);
        }
        else if (dataId === "rooms") {
            sec = new Room_1.default("", "", "", "", "", 0, 0, 0, "", "", "");
        }
        else {
            throw new IInsightFacade_1.InsightError("Non-existent ID");
        }
        if (typeof sec[key] !== typeof value) {
            throw new IInsightFacade_1.InsightError("Type");
        }
    }
    checkID(query, dataset) {
        let check = 0;
        for (let ds of dataset) {
            if (ds.name === query) {
                check = 1;
            }
        }
        if (check === 0) {
            throw new IInsightFacade_1.InsightError("Non existent ID");
        }
    }
    validateBody() {
        if (typeof this.query.WHERE !== "object") {
            throw new IInsightFacade_1.InsightError("Where is not an object");
        }
    }
    validateOptions() {
        if (typeof this.query.OPTIONS !== "object" || JSON.stringify(this.query.OPTIONS) === "{}") {
            throw new IInsightFacade_1.InsightError("Options is not an object");
        }
        this.validateColumns();
    }
    validateColumns() {
        if (typeof this.query.OPTIONS.COLUMNS !== "object" || this.query.OPTIONS.COLUMNS === null) {
            throw new IInsightFacade_1.InsightError("COLUMNS is not an object");
        }
        if (this.query.OPTIONS.COLUMNS instanceof Array === false) {
            throw new IInsightFacade_1.InsightError("COLUMNS is not an array");
        }
    }
    getBody() {
        return this.query.WHERE;
    }
    getOptions() {
        return this.query.OPTIONS;
    }
    filter(body, options, dataset) {
        let results = [];
        results = this.whereHelper(body, dataset);
        return this.columns(options, results);
    }
    columns(options, dataset) {
        let key = Object.keys(options);
        let value = Object.values(options);
        let keys = Object.values(value)[0];
        let sections;
        let arrType = keys[0].split("_");
        let order = Object.values(value)[1];
        let insightArr = [];
        let data;
        if (arrType[0] === "sections") {
            data = dataset[0];
        }
        else {
            data = dataset[1];
        }
        if (key[1] === "ORDER") {
            if (JSON.stringify(order) !== "") {
                let orderParam = order.split("_");
                this.checkID(orderParam[0], dataset);
                sections = data.sections.sort((n1, n2) => {
                    if (n1[orderParam[1]] > n2[orderParam[1]]) {
                        return 1;
                    }
                    else if (n1[orderParam[1]] < n2[orderParam[1]]) {
                        return -1;
                    }
                    return 0;
                });
            }
            else {
                sections = data.sections;
            }
        }
        else {
            sections = data.sections;
        }
        for (let i = 0; i < data.rows; i++) {
            let insight = {};
            for (let count in keys) {
                let keysVal = keys[count].split("_");
                this.checkID(keysVal[0], dataset);
                let keysParam = keysVal[1];
                let section = sections[i];
                insight[keys[count]] = section[keysParam];
            }
            insightArr.push(insight);
        }
        if (insightArr.length > 5000) {
            throw new IInsightFacade_1.ResultTooLargeError(">5000");
        }
        return insightArr;
    }
    whereHelper(query, dataset) {
        let results = [];
        let query1 = new QueryExtend_1.default(this.query);
        if (Object.keys(query).length === 0) {
            results = dataset;
        }
        else if ("GT" in query || "LT" in query || "EQ" in query) {
            results = query1.comparator(query, dataset);
        }
        else if ("AND" in query || "OR" in query) {
            results = query1.logic(query, dataset);
        }
        else if ("IS" in query) {
            results = this.IS(query, dataset);
        }
        else if ("NOT" in query) {
            results = this.NOT(query, dataset);
        }
        return results;
    }
    IS(query, dataset) {
        let result = [];
        let secArr = [];
        let key = Object.keys(query);
        let variable = Object.keys(query[key[0]]);
        let value = Object.values(query[key[0]]);
        let var1 = variable[0].split("_");
        let param = var1[1];
        let dataId = var1[0];
        this.checkSecKeys(param, value[0], dataId);
        this.validQueryValues(key);
        this.validQueryValues(variable);
        this.checkEmpty(param);
        this.checkEmpty(dataId);
        this.checkID(dataId, dataset);
        let i;
        if (dataId === "sections") {
            i = dataset[0];
        }
        else {
            i = dataset[1];
        }
        let sections = i.sections;
        for (let secCount = 0; secCount < i.rows; secCount++) {
            let section = sections[secCount];
            if (i.name === dataId) {
                if (section[var1[1]] === value[0]) {
                    secArr.push(section);
                }
                else if (value[0].startsWith("*") && value[0].endsWith("*")) {
                    let value2 = value[0].replace("*", "");
                    let value1 = value2.replace("*", "");
                    if (section[param].includes(value1)) {
                        secArr.push(section);
                    }
                }
                else if (value[0].endsWith("*")) {
                    let value1 = value[0].replace("*", "");
                    if (section[param].startsWith(value1)) {
                        secArr.push(section);
                    }
                }
                else if (value[0].startsWith("*")) {
                    let value1 = value[0].replace("*", "");
                    if (section[param].endsWith(value1)) {
                        secArr.push(section);
                    }
                }
            }
        }
        let data = new Dataset_1.default(i.name, secArr, secArr.length, IInsightFacade_1.InsightDatasetKind.Sections);
        result.push(data);
        return result;
    }
    NOT(query, dataset) {
        let result = [];
        let sections = [];
        let key = Object.keys(query);
        let variable = query[key[0]];
        let arrType = Object.keys(variable[Object.keys(variable)[0]])[0].split("_");
        let value1 = this.whereHelper(variable, dataset);
        let i;
        if (arrType[0] === "sections") {
            i = dataset[0];
        }
        else {
            i = dataset[1];
        }
        this.checkID(value1[0].name, dataset);
        let a = new Set(dataset[0].sections);
        let b = new Set(value1[0].sections);
        let c = new Set([...a].filter((x) => !b.has(x)));
        sections = Array.from(c);
        let data = new Dataset_1.default(i.name, sections, sections.length, IInsightFacade_1.InsightDatasetKind.Sections);
        result.push(data);
        return result;
    }
}
exports.default = Query;
//# sourceMappingURL=Query.js.map