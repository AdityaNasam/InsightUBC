import Section from "./Section";
import {InsightDatasetKind} from "./IInsightFacade";

export default class Dataset {
	public readonly name: string;
	public readonly sections: any[];
	public readonly rows: number;
	public readonly kind: InsightDatasetKind;

	constructor(name: string, sections: any[], rows: number, kind: InsightDatasetKind) {
		this.name = name;
		this.sections = sections;
		this.rows = rows;
		this.kind = kind;
	}

	public getName(): string {
		return this.name;
	};

	public getRows(): number {
		return this.sections.length;
	}
}
