"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const IInsightFacade_1 = require("./IInsightFacade");
const jszip_1 = __importDefault(require("jszip"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const Section_1 = __importDefault(require("./Section"));
const Dataset_1 = __importDefault(require("./Dataset"));
const Query_1 = __importDefault(require("./Query"));
const parse5_1 = require("parse5");
const DatasetProcessor_1 = __importDefault(require("./DatasetProcessor"));
const Transformations_1 = __importDefault(require("./Transformations"));
class InsightFacade {
    allDatasets;
    constructor() {
        this.allDatasets = [];
        if (fs_extra_1.default.existsSync("./data/allDatasets.json")) {
            try {
                let data = fs_extra_1.default.readFileSync("./data/allDatasets.json", "utf8");
                this.allDatasets = JSON.parse(data);
            }
            catch (err) {
                console.error("failed to read json");
                this.allDatasets = [];
            }
        }
    }
    addDataset(id, content, kind) {
        if (id === "") {
            return Promise.reject(new IInsightFacade_1.InsightError("Empty Dataset"));
        }
        else if (id.includes("_")) {
            return Promise.reject(new IInsightFacade_1.InsightError("Underscore in ID"));
        }
        else if (id.trim().length === 0) {
            return Promise.reject(new IInsightFacade_1.InsightError("White Spaces"));
        }
        for (const ds of this.allDatasets) {
            if (ds.name === id) {
                return Promise.reject(new IInsightFacade_1.InsightError("Dataset already added"));
            }
        }
        if (kind === IInsightFacade_1.InsightDatasetKind.Rooms) {
            return this.roomsHelper(content, id, kind);
        }
        else if (kind === IInsightFacade_1.InsightDatasetKind.Sections) {
            return this.sectionsHelper(content, id, kind);
        }
        return Promise.reject(new IInsightFacade_1.InsightError("invalid kind"));
    }
    async roomsHelper(content, id, kind) {
        const zip = new jszip_1.default();
        let rooms = [];
        let datap = new DatasetProcessor_1.default(content, id);
        let allPromises = [];
        let queue = [];
        try {
            await zip.loadAsync(content, { base64: true });
            const indexhtm = zip.file("index.htm");
            if (indexhtm) {
                const indexContent = await indexhtm.async("string");
                const parseIndex = (0, parse5_1.parse)(indexContent);
                queue.push(parseIndex);
                while (queue.length > 0) {
                    const node = queue.shift();
                    if (node.nodeName === "tbody") {
                        for (const tbody of node.childNodes) {
                            if (tbody.nodeName === "tr") {
                                let trooms = [];
                                let shortname = "", fullname = "", address = "", path = "";
                                allPromises.push(datap.getBuildingDet(tbody, content, trooms, shortname, fullname, address, path));
                            }
                        }
                    }
                    if (node.childNodes) {
                        for (const childNode of node.childNodes) {
                            queue.push(childNode);
                        }
                    }
                }
                const allRooms = await Promise.all(allPromises);
                rooms = allRooms.filter((room) => room !== undefined);
                rooms = rooms.flat();
            }
            else {
                throw new IInsightFacade_1.InsightError("index.htm not found in the zip folder");
            }
        }
        catch {
            return Promise.reject(new IInsightFacade_1.InsightError("Not a valid zip file"));
        }
        if (rooms.length === 0) {
            return Promise.reject(new IInsightFacade_1.InsightError("no valid sections"));
        }
        const datasets = new Dataset_1.default(id, rooms, rooms.length, kind);
        return Promise.resolve(await this.persistData(datasets));
    }
    async sectionsHelper(content, id, kind) {
        const zip = new jszip_1.default();
        const sections = [];
        try {
            const file = await zip.loadAsync(content, { base64: true });
            const promArr = [];
            file.forEach((relativePath, nfile) => {
                promArr.push(nfile.async("string").then(secfunc));
                function secfunc(sect) {
                    try {
                        const jsObject = JSON.parse(sect);
                        for (const sec of jsObject.result) {
                            let year = sec["Year"];
                            if (sec["Section"] === "overall") {
                                year = 1900;
                            }
                            const section = new Section_1.default(String(sec["id"]), sec["Course"], sec["Title"], sec["Professor"], sec["Subject"], Number(year), sec["Avg"], sec["Pass"], sec["Fail"], sec["Audit"]);
                            sections.push(section);
                        }
                    }
                    catch (error) {
                        console.error("");
                    }
                }
            });
            await Promise.all(promArr);
            if (sections.length === 0) {
                return Promise.reject(new IInsightFacade_1.InsightError("no valid sections"));
            }
            const datasets = new Dataset_1.default(id, sections, sections.length, kind);
            return Promise.resolve(await this.persistData(datasets));
        }
        catch (error) {
            console.log(error);
            return Promise.reject(new IInsightFacade_1.InsightError("Not a valid zip file"));
        }
    }
    removeDataset(id) {
        if (id === "") {
            return Promise.reject(new IInsightFacade_1.InsightError("Empty String Id"));
        }
        else if (id.includes("_")) {
            return Promise.reject(new IInsightFacade_1.InsightError("Underscore in ID"));
        }
        else if (id.trim().length === 0) {
            return Promise.reject(new IInsightFacade_1.InsightError("White Spaces"));
        }
        if (!this.allDatasets) {
            return Promise.reject(new IInsightFacade_1.InsightError("Empty Dataset"));
        }
        let remaining = [];
        for (let i = 0; i < this.allDatasets.length; i++) {
            let ds = this.allDatasets[i];
            if (ds.name === id) {
                remaining = this.allDatasets.splice(i);
                this.allDatasets = remaining;
                fs_extra_1.default.writeFile("./data/allDatasets.json", JSON.stringify(this.allDatasets));
                return Promise.resolve(id);
            }
        }
        return Promise.reject(new IInsightFacade_1.NotFoundError("Non-existent ID"));
    }
    performQuery(query) {
        try {
            let query1 = new Query_1.default(query);
            let trans1 = new Transformations_1.default(query);
            query1.validateQuery();
            query1.validateBody();
            query1.validateOptions();
            let result;
            if (trans1.getTransformations() !== null) {
                result = trans1.filterTransformations(query1.getBody(), query1.getOptions(), trans1.getTransformations(), this.allDatasets);
            }
            else {
                result = query1.filter(query1.getBody(), query1.getOptions(), this.allDatasets);
            }
            return Promise.resolve(result);
        }
        catch (err) {
            return Promise.reject(err);
        }
    }
    listDatasets() {
        const listOfData = [];
        this.allDatasets.forEach((ds) => {
            let ld = { id: ds.name, kind: ds.kind, numRows: ds.rows };
            listOfData.push(ld);
        });
        return Promise.resolve(listOfData);
    }
    async persistData(datasets) {
        this.allDatasets.push(datasets);
        if (!fs_extra_1.default.existsSync("./data/")) {
            fs_extra_1.default.mkdirSync("./data/");
        }
        await fs_extra_1.default.promises.writeFile("./data/allDatasets.json", JSON.stringify(this.allDatasets), { encoding: "utf-8" });
        const ids = [];
        this.allDatasets.forEach((ds) => {
            ids.push(ds.name);
        });
        return ids;
    }
}
exports.default = InsightFacade;
//# sourceMappingURL=InsightFacade.js.map