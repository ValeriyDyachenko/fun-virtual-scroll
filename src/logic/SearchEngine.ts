import { JSONItem, JSONValues } from './JSONGenerator.ts';

export class SearchEngine {
	private searchKeyTerm = '';

	private searchValueTerm = '';

	searchByKey(key: string): void {
		this.searchKeyTerm = key.toLowerCase();
		this.searchValueTerm = '';
	}

	searchByValue(value: string): void {
		this.searchValueTerm = value.toLowerCase();
		this.searchKeyTerm = '';
	}

	itemMatchesSearch(item: JSONItem): boolean {
		if (this.searchKeyTerm) {
			return Object.keys(item).some(key =>
				key.toLowerCase().includes(this.searchKeyTerm));
		}
		if (this.searchValueTerm) {
			return Object.values(item).some(value =>
				String(value).toLowerCase().includes(this.searchValueTerm));
		}
		return true;
	}

	fieldMatchesSearch(key: string, value: JSONValues): boolean {
		if (this.searchKeyTerm) {
			return key.toLowerCase().includes(this.searchKeyTerm);
		}
		if (this.searchValueTerm) {
			return String(value).toLowerCase().includes(this.searchValueTerm);
		}
		return true;
	}
}
