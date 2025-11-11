"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Datasets {
    datasets;
    name;
    numrows;
    constructor(name, datasets, numrows) {
        this.datasets = datasets;
        this.name = name;
        this.numrows = numrows;
    }
    getName() {
        return this.name;
    }
    ;
}
exports.default = Datasets;
//# sourceMappingURL=Datasets.js.map