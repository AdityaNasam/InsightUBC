import {InsightDataset, InsightError, InsightResult, ResultTooLargeError} from "./IInsightFacade";
import InsightFacade from "./InsightFacade";
import Dataset from "./Dataset";
import Section from "./Section";
import JSZip from "jszip";
import {parse} from "parse5";
import Room from "./Room";
import http from "http";

export default class DatasetProcessor {
	private readonly id: string;
	private readonly content: string;

	constructor(id: string, content: string) {
		this.id = id;
		this.content = content;
	}

	public async getRooms(roomPath: string | undefined, content: string): Promise<any> {
		const zip = new JSZip();
		await zip.loadAsync(content, {base64: true});
		if (roomPath !== undefined) {
			const trPath = roomPath.substring(2);
			// console.log(trPath);
			const roomFile = await zip.file(trPath);
			// console.log(roomFile);
			if (roomFile) {
				// console.log(roomFile);
				const roomContent = await roomFile.async("string");
				const parsedRoom = parse(roomContent) as any;
				// console.log(parsedRoom);
				return parsedRoom;

			} else {
				throw new Error("room not found in the zip folder");

			}
		}
	}

	public async getBuildingDet(rows: any, content: string, rooms: any, shortName: string,
		fullName: string, addr: string, roomPath: string): Promise<any> {
		let allRooms: any;
		for (const td of rows.childNodes) {
			if (td.nodeName === "td") {
				// console.log(td.attrs[0].value);
				if ((td.attrs[0].value) === "views-field views-field-field-building-code") {
					shortName = td.childNodes[0].value;
					shortName = shortName.trim();
					// console.log(td.childNodes[0].value);
				}
				if ((td.attrs[0].value) === "views-field views-field-field-building-address") {
					addr = td.childNodes[0].value;
					// nRoom.addres = addr;
					// console.log(nRoom.address);
					// console.log(rows.childNodes[0].value);
				}
				if ((td.attrs[0].value) === "views-field views-field-title") {
					// console.log(td.attrs[0].value);
					//   console.log(rows.childNodes[1].childNodes[0].value);
					fullName = td.childNodes[1].childNodes[0].value;
					// nRoom.fullname = fullName;
					// console.log(rows.childNodes[1].attrs[0].value);
					roomPath = td.childNodes[1].attrs[0].value;
					// console.log(nRoom.fullname);
				}
			}
		}
		addr = addr.trim();
		let encAddr = encodeURIComponent(addr);
		const fullEncAddr = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team175/" + encAddr;
		let lat: number[] = [0];
		let lon: number[] = [0];
		await this.geolocation(fullEncAddr, lat, lon);
		// console.log(lat);
		const r = await this.getRooms(roomPath, content);
		allRooms = await this.getRoomDet(r, fullName, shortName, addr, lat, lon, rooms);
		// console.log(allRooms);
		// console.log(allRooms);
		return Promise.resolve(allRooms);
	}

	public validateRoom(room: Room): boolean {
		// Check if all required properties are present
		if (
			!room.fullname ||
			!room.shortname ||
			!room.number ||
			!room.name ||
			!room.address ||
			!room.lat ||
			!room.lon ||
			!room.seats ||
			!room.type ||
			!room.furniture ||
			!room.href
		) {
			return false;
		}

		return true;
	}

	public async getRoomDet(node: any, fname: any, sname: any,
		addr: any, lat: any, lon: any, rooms: Room[]): Promise<Room[]> {
		if (node.nodeName === "tbody") {
			// console.time("getRoomDet");
			const promises = [];
			for (const tbody of node.childNodes) {
				if (tbody.nodeName === "tr") {
					const promise = this.setRoomDet(tbody, fname, sname, addr, lat, lon);
					promises.push(promise);
				}
			}
			const results = await Promise.all(promises);
			results.forEach((nroom) => {
				// if (this.validateRoom(nroom)) {
				rooms.push(nroom);
				// }
			});
			// console.timeEnd("getRoomDet");
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

	public async geolocation(address: string, lat: number[], lon: number[]): Promise<any> {
		return new Promise<any>((resolve, reject) => {
			http.get(address, (resp) => {
				let data = "";
				resp.on("data", (chunk) => {
					data += chunk;
				});
				resp.on("end", () => {
					try {
						const georesp = JSON.parse(data);
						// console.log(georesp.lat);
						if (georesp.length === 0) {
							resolve({error: "nothing found"});
						} else {
							lat[0] = georesp.lat; // update lat[0] directly
							lon[0] = georesp.lon; // update lon[0] directly
							resolve({lat: lat[0], lon: lon[0]});
						}
					} catch (error) {
						reject(error);
					}
				});
			}).on("error", (err) => {
				reject(new InsightError("geolocation error"));
			});
		});
	}

	private async setRoomDet(row: any, fname: any, sname: any, addr: any,
							 lat: any, lon: any): Promise<Room> {
		return new Promise((resolve, reject) => {
			let roomNumber: string = "";
			let capacity: number = 0;
			let furniture: string = "";
			let type: string = "";
			let href: string = "";
			let name: string = "";
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
			let room = new Room(fname, sname, roomNumber, name, addr, lat, lon, capacity, type, furniture, href);
			// if (!rooms.includes(room) && this.validateRoom(room)) {
			//  console.log(room);
			resolve(room);
		});
	}
}
