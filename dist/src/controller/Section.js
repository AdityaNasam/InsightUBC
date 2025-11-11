"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Section {
    uuid;
    id;
    title;
    instructor;
    dept;
    year;
    avg;
    pass;
    fail;
    audit;
    constructor(uuid, id, title, instructor, dept, year, avg, pass, fail, audit) {
        this.uuid = uuid;
        this.id = id;
        this.title = title;
        this.instructor = instructor;
        this.dept = dept;
        this.year = year;
        this.avg = avg;
        this.pass = pass;
        this.fail = fail;
        this.audit = audit;
    }
    getUuid() {
        return this.uuid;
    }
    ;
}
exports.default = Section;
//# sourceMappingURL=Section.js.map