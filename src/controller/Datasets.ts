import Dataset from "./Dataset";

export default class Datasets {
	private readonly datasets: Dataset[];
	private readonly name: string;
	private readonly numrows: number;

	constructor(name: string, datasets: Dataset[], numrows: number) {
		this.datasets = datasets;
		this.name = name;
		this.numrows = numrows;
	}

	public getName(): string {
		return this.name;
	};
}

