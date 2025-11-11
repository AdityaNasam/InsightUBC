"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const IInsightFacade_1 = require("./IInsightFacade");
const Query_1 = __importDefault(require("./Query"));
const decimal_js_1 = __importDefault(require("decimal.js"));
class Transformations {
    query;
    query1;
    constructor(query) {
        this.query = query;
        this.query1 = new Query_1.default(this.query);
    }
    getTransformations() {
        if (this.checkTransformations(this.query)) {
            return this.query.TRANSFORMATIONS;
        }
        return null;
    }
    checkTransformations(query) {
        let temp = "TRANSFORMATIONS";
        if (Object.keys(query).includes(temp)) {
            return true;
        }
        return false;
    }
    transformations(options, transformations, dataset) {
        let key = Object.keys(transformations);
        let value = Object.values(transformations);
        let keys = Object.values(value)[0];
        let a = this.groups(transformations, dataset);
        let b = this.apply(transformations.APPLY, a);
        return this.columns(options, transformations, b, a);
    }
    groups(transformations, dataset) {
        this.checkGroup(transformations.GROUP);
        let key = Object.keys(transformations);
        let value = Object.values(transformations);
        let variables = value[0];
        let dataId = variables[0].split("_");
        let data;
        try {
            if (dataId[0] === dataset[0].name) {
                data = dataset[0];
            }
            else if (dataId[0] === dataset[1].name) {
                data = dataset[1];
            }
            else {
                throw new IInsightFacade_1.InsightError("Non-Existent dataset");
            }
        }
        catch (err) {
            throw new IInsightFacade_1.InsightError("Non-Existent ID");
        }
        let arr;
        let temp = [];
        for (let a of variables) {
            let param = a.split("_")[1];
            temp.push(param);
        }
        const result = this.groupBy(data.sections, function (item) {
            let temp1 = [];
            for (let a of temp) {
                temp1.push(item[a]);
            }
            return [temp1];
        });
        return result;
    }
    groupBy(array, f) {
        const groups = {};
        array.forEach(function (o) {
            const group = JSON.stringify(f(o));
            groups[group] = groups[group] || [];
            groups[group].push(o);
        });
        return Object.keys(groups).map(function (group) {
            return groups[group];
        });
    }
    apply(apply, dataset) {
        let keyArr = [];
        for (let a in apply) {
            let dataArr = [];
            for (let d of dataset) {
                let key = Object.keys(apply[a]);
                let value = Object.values(apply[a]);
                let key1 = Object.keys(value[0]);
                let param = Object.values(value[0]);
                let feature = param[0].split("_");
                if (key1.includes("MIN")) {
                    dataArr.push(this.min(feature[1], d));
                }
                else if (key1.includes("MAX")) {
                    dataArr.push(this.max(feature[1], d));
                }
                else if (key1.includes("AVG")) {
                    dataArr.push(this.avg(feature[1], d));
                }
                else if (key1.includes("SUM")) {
                    dataArr.push(this.sum(feature[1], d));
                }
                else if (key1.includes("COUNT")) {
                    dataArr.push(this.count(feature[1], d));
                }
            }
            keyArr.push(dataArr);
        }
        return keyArr;
    }
    min(parameter, dataset) {
        let min = dataset[0][parameter];
        for (let a of dataset) {
            if (a[parameter] < min) {
                min = a[parameter];
            }
        }
        return min;
    }
    max(parameter, dataset) {
        let max = parseInt(dataset[0][parameter], 10);
        for (let a of dataset) {
            if ((a[parameter]) > max) {
                max = parseInt(a[parameter], 10);
            }
        }
        return max;
    }
    avg(parameter, dataset) {
        let b, sum = 0, count = 0, total = 0;
        for (let a of dataset) {
            sum = new decimal_js_1.default(a[parameter]);
            total = decimal_js_1.default.add(total, sum);
            count++;
        }
        b = total.toNumber() / count;
        return Number(b.toFixed(2));
    }
    sum(parameter, dataset) {
        let sum = 0;
        for (let a of dataset) {
            sum = sum + parseInt(a[parameter], 10);
        }
        return sum;
    }
    count(parameter, dataset) {
        let count = 0;
        let tempArr = [];
        for (let a of dataset) {
            if (!tempArr.includes(a[parameter])) {
                tempArr.push(a[parameter]);
                count++;
            }
        }
        return count;
    }
    checkApply(query) {
        if (typeof query !== "object" || JSON.stringify(query) === "{}") {
            throw new IInsightFacade_1.InsightError("Wrong query");
        }
    }
    checkGroup(query) {
        this.checkApply(query);
        if (query.length === 0) {
            throw new IInsightFacade_1.InsightError("Empty Group");
        }
    }
    order(options, dataset) {
        let key = Object.keys(options);
        let value = Object.values(options);
        let order = Object.values(value)[1];
        let insight = [];
        if (key[1] === "ORDER") {
            if (JSON.stringify(order) !== "") {
                let dir = order["dir"];
                let keys = order["keys"];
                for (let a in dataset) {
                    if (keys.length === 1) {
                        if (dir === "UP") {
                            insight = dataset.sort((n1, n2) => {
                                if (n1[keys[0]] > n2[keys[0]]) {
                                    return 1;
                                }
                                else if (n1[keys[0]] < n2[keys[0]]) {
                                    return -1;
                                }
                                return 0;
                            });
                        }
                        else if (dir === "DOWN") {
                            insight = dataset.sort((n1, n2) => {
                                if (n1[keys[0]] < n2[keys[0]]) {
                                    return 1;
                                }
                                else if (n1[keys[0]] > n2[keys[0]]) {
                                    return -1;
                                }
                                return 0;
                            });
                        }
                    }
                    else if (keys.length === 2) {
                        insight = dataset.sort((c, b) => c[keys[0]] - b[keys[0]] || c[keys[1]] - b[keys[1]]);
                    }
                }
            }
        }
        else {
            insight = dataset;
        }
        return insight;
    }
    checkOrderColumnsApply(options, transformations) {
        let value = Object.values(options.COLUMNS);
        this.checkGroup(transformations.GROUP);
        this.checkApply(transformations.APPLY);
        let valueT = Object.values(transformations);
        let applyLength = Object.values(transformations.APPLY).length;
        let tempArr = [];
        for (let a of valueT[0]) {
            tempArr.push(a);
        }
        for (let a = 0; a < applyLength; a++) {
            tempArr.push(Object.keys(transformations.APPLY[a])[0]);
        }
        for (let b of value) {
            if (!tempArr.includes(b)) {
                throw new IInsightFacade_1.InsightError("Column label not in group and apply");
            }
        }
    }
    columns(options, transformations, dataApply, dataset) {
        this.checkOrderColumnsApply(options, transformations);
        let key = Object.keys(options);
        let value = Object.values(options);
        let keys = Object.values(value)[0];
        let insightArr = [];
        this.checkGroup(transformations.GROUP);
        let keyG = Object.keys(transformations);
        let valueG = Object.values(transformations);
        let variables = valueG[0];
        let temp = [];
        let applyNum = Object.values(transformations.APPLY).length;
        let applyTemp = [];
        for (let i = 0; i < applyNum; i++) {
            applyTemp.push(Object.keys(transformations.APPLY[i])[0]);
        }
        for (let a of keys) {
            let param = a.split("_")[1];
            if (typeof param === "undefined") {
                param = a.split("_")[0];
            }
            temp.push(param);
        }
        for (let i = 0; i < dataset.length; i++) {
            let count = 0;
            let insight = {};
            for (let a of temp) {
                let section = (Object.values(dataset[i]))[0][a];
                if (typeof section === "undefined") {
                    for (let b in applyTemp) {
                        if (a === applyTemp[b]) {
                            section = dataApply[b][i];
                        }
                    }
                }
                insight[keys[count]] = section;
                count++;
            }
            insightArr.push(insight);
        }
        insightArr = this.order(options, insightArr);
        return insightArr;
    }
    filterTransformations(body, options, transformations, dataset) {
        let results = [];
        results = this.query1.whereHelper(body, dataset);
        return this.transformations(options, transformations, results);
    }
}
exports.default = Transformations;
//# sourceMappingURL=Transformations.js.map