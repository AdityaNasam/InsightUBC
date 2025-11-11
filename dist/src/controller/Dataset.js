"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Dataset {
    name;
    sections;
    rows;
    kind;
    constructor(name, sections, rows, kind) {
        this.name = name;
        this.sections = sections;
        this.rows = rows;
        this.kind = kind;
    }
    getName() {
        return this.name;
    }
    ;
    getRows() {
        return this.sections.length;
    }
}
exports.default = Dataset;
//# sourceMappingURL=Dataset.js.map