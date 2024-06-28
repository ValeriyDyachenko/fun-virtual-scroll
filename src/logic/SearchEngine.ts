import { JSONItem } from './JSONGenerator.ts';

export class SearchEngine {
	private searchKeyTerm = '';

	private searchValueTerm = '';

	getSearchKeyTerm() {
		return this.searchKeyTerm;
	}

	getSearchValueTerm() {
		return this.searchValueTerm;
	}

	searchByKey(key: string): void {
		this.searchKeyTerm = key.toLowerCase();
	}

	searchByValue(value: string): void {
		this.searchValueTerm = value.toLowerCase();
	}

	itemMatchesSearch(item: JSONItem): { isSearchDisabled: true } | { isSearchDisabled: false, matchedKeys: Set<string> } {
		if (!this.searchKeyTerm && !this.searchValueTerm) {
			return { isSearchDisabled: true };
		}
		const matchedKeys = new Set<string>();
		Object.entries(item).forEach(([key, value]) => {
			const lowercaseKey = key.toLowerCase();
			const lowercaseValue = String(value).toLowerCase();
			if (this.searchKeyTerm && this.searchValueTerm) {
				if (lowercaseKey.includes(this.searchKeyTerm) && lowercaseValue.includes(this.searchValueTerm)) {
					matchedKeys.add(key);
				}
			} else if (
				(this.searchKeyTerm && lowercaseKey.includes(this.searchKeyTerm)) ||
				(this.searchValueTerm && lowercaseValue.includes(this.searchValueTerm))
			) {
				matchedKeys.add(key);
			}
		});
		return { isSearchDisabled: false, matchedKeys };
	}
}
