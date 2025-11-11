"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const IInsightFacade_1 = require("./IInsightFacade");
const jszip_1 = __importDefault(require("jszip"));
const parse5_1 = require("parse5");
const Room_1 = __importDefault(require("./Room"));
const http_1 = __importDefault(require("http"));
class DatasetProcessor {
    id;
    content;
    constructor(id, content) {
        this.id = id;
        this.content = content;
    }
    async getRooms(roomPath, content) {
        const zip = new jszip_1.default();
        await zip.loadAsync(content, { base64: true });
        if (roomPath !== undefined) {
            const trPath = roomPath.substring(2);
            const roomFile = await zip.file(trPath);
            if (roomFile) {
                const roomContent = await roomFile.async("string");
                const parsedRoom = (0, parse5_1.parse)(roomContent);
                return parsedRoom;
            }
            else {
                throw new Error("room not found in the zip folder");
            }
        }
    }
    async getBuildingDet(rows, content, rooms, shortName, fullName, addr, roomPath) {
        let allRooms;
        for (const td of rows.childNodes) {
            if (td.nodeName === "td") {
                if ((td.attrs[0].value) === "views-field views-field-field-building-code") {
                    shortName = td.childNodes[0].value;
                    shortName = shortName.trim();
                }
                if ((td.attrs[0].value) === "views-field views-field-field-building-address") {
                    addr = td.childNodes[0].value;
                }
                if ((td.attrs[0].value) === "views-field views-field-title") {
                    fullName = td.childNodes[1].childNodes[0].value;
                    roomPath = td.childNodes[1].attrs[0].value;
                }
            }
        }
        addr = addr.trim();
        let encAddr = encodeURIComponent(addr);
        const fullEncAddr = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team175/" + encAddr;
        let lat = [0];
        let lon = [0];
        await this.geolocation(fullEncAddr, lat, lon);
        const r = await this.getRooms(roomPath, content);
        allRooms = await this.getRoomDet(r, fullName, shortName, addr, lat, lon, rooms);
        return Promise.resolve(allRooms);
    }
    validateRoom(room) {
        if (!room.fullname ||
            !room.shortname ||
            !room.number ||
            !room.name ||
            !room.address ||
            !room.lat ||
            !room.lon ||
            !room.seats ||
            !room.type ||
            !room.furniture ||
            !room.href) {
            return false;
        }
        return true;
    }
    async getRoomDet(node, fname, sname, addr, lat, lon, rooms) {
        if (node.nodeName === "tbody") {
            const promises = [];
            for (const tbody of node.childNodes) {
                if (tbody.nodeName === "tr") {
                    const promise = this.setRoomDet(tbody, fname, sname, addr, lat, lon);
                    promises.push(promise);
                }
            }
            const results = await Promise.all(promises);
            results.forEach((nroom) => {
                rooms.push(nroom);
            });
        }
        if (node.childNodes) {
            const promises = [];
            for (const childNode of node.childNodes) {
                promises.push(this.getRoomDet(childNode, fname, sname, addr, lat, lon, rooms));
            }
            await Promise.all(promises);
        }
        return Promise.resolve(rooms);
    }
    async geolocation(address, lat, lon) {
        return new Promise((resolve, reject) => {
            http_1.default.get(address, (resp) => {
                let data = "";
                resp.on("data", (chunk) => {
                    data += chunk;
                });
                resp.on("end", () => {
                    try {
                        const georesp = JSON.parse(data);
                        if (georesp.length === 0) {
                            resolve({ error: "nothing found" });
                        }
                        else {
                            lat[0] = georesp.lat;
                            lon[0] = georesp.lon;
                            resolve({ lat: lat[0], lon: lon[0] });
                        }
                    }
                    catch (error) {
                        reject(error);
                    }
                });
            }).on("error", (err) => {
                reject(new IInsightFacade_1.InsightError("geolocation error"));
            });
        });
    }
    async setRoomDet(row, fname, sname, addr, lat, lon) {
        return new Promise((resolve, reject) => {
            let roomNumber = "";
            let capacity = 0;
            let furniture = "";
            let type = "";
            let href = "";
            let name = "";
            for (const td of row.childNodes) {
                if (td.nodeName === "td") {
                    if ((td.attrs[0].value) === "views-field views-field-field-room-number") {
                        roomNumber = td.childNodes[1].childNodes[0].value;
                        name = sname + "_" + roomNumber;
                    }
                    if ((td.attrs[0].value) === "views-field views-field-field-room-capacity") {
                        capacity = td.childNodes[0].value.trim();
                    }
                    if ((td.attrs[0].value) === "views-field views-field-field-room-furniture") {
                        furniture = td.childNodes[0].value.trim();
                    }
                    if ((td.attrs[0].value) === "views-field views-field-field-room-type") {
                        type = td.childNodes[0].value.trim();
                    }
                    if ((td.attrs[0].value) === "views-field views-field-nothing") {
                        href = td.childNodes[1].attrs[0].value;
                    }
                }
            }
            let room = new Room_1.default(fname, sname, roomNumber, name, addr, lat, lon, capacity, type, furniture, href);
            resolve(room);
        });
    }
}
exports.default = DatasetProcessor;
//# sourceMappingURL=DatasetProcessor.js.map