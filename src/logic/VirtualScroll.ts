import { JSONGenerator } from './JSONGenerator.ts';
import { SearchEngine } from './SearchEngine.ts';
import { AnimationManager } from './AnimationManager.ts';
import { HTMLInputGenerator, InputGenerator } from './InputGenerator.ts';

type JSONValues = number | string | boolean | Date
type JSONItem = Record<string, JSONValues>
type JSONData = JSONItem[]

class VirtualScroll {
	private bigJsonObject: JSONData = [];

	private filteredIndexes: number[] = [];

	private vList: HTMLElement;

	private listContainer: HTMLElement;

	private backgroundImage: HTMLElement;

	private fieldHeight = 90;

	private lastScrollTop = 0;

	private isScrolling = false;

	private lastRenderTime = 0;

	private renderInterval = 16;

	private textUpdateEventListeners: Map<number, Map<HTMLInputElement | HTMLTextAreaElement, (event: Event) => void>> = new Map();

	private totalHeight = 0;

	private secretIdKey = '_id';

	private jsonGenerator: JSONGenerator;

	private searchEngine: SearchEngine;

	private animationManager: AnimationManager;

	private inputGenerator: InputGenerator;

	constructor(
		vList: HTMLElement,
		listContainer: HTMLElement,
		backgroundImage: HTMLElement,
		jsonGenerator: JSONGenerator,
		searchEngine: SearchEngine,
		animationManager: AnimationManager,
		inputGenerator: InputGenerator
	) {
		this.vList = vList;
		this.listContainer = listContainer;
		this.backgroundImage = backgroundImage;
		this.jsonGenerator = jsonGenerator;
		this.searchEngine = searchEngine;
		this.animationManager = animationManager;
		this.inputGenerator = inputGenerator;
		this.setScrollListeners();
	}

	public generateRandomData(count: number): void {
		this.bigJsonObject = this.jsonGenerator.generateRandomData(count).map((item, index) => ({
			...item,
			[this.secretIdKey]: index,
		}));
		this.updateFilteredIndexes();
		this.renderList();
		this.insertFirefoxWorkaround();
	}

	public searchByKey(key: string): void {
		this.searchEngine.searchByKey(key);
		this.updateFilteredIndexes();
		this.resetListAndRender();
	}

	public searchByValue(value: string): void {
		this.searchEngine.searchByValue(value);
		this.updateFilteredIndexes();
		this.resetListAndRender();
	}

	public saveJSONToFile(): void {
		const jsonString = JSON.stringify(this.bigJsonObject, null, 2);
		const blob = new Blob([jsonString], { type: 'application/json' });
		const url = URL.createObjectURL(blob);

		const link = document.createElement('a');
		link.href = url;
		link.download = 'virtual_scroll_data.json';

		// Firefox
		document.body.appendChild(link);

		link.click();

		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}

	private updateFilteredIndexes(): void {
		this.filteredIndexes = this.bigJsonObject.reduce((acc: number[], item, index) => {
			if (this.searchEngine.itemMatchesSearch(item)) {
				acc.push(index);
			}
			return acc;
		}, []);

		this.updateTotalHeight();
	}

	private updateTotalHeight(): void {
		this.totalHeight = this.filteredIndexes.reduce((acc, index) => {
			const item = this.bigJsonObject[index];
			return acc + this.getItemHeight(item);
		}, 0);
		this.updateListContainerHeight();
	}

	private updateListContainerHeight(): void {
		this.listContainer.style.height = `${this.totalHeight}px`;
	}

	private getItemHeight(item: JSONItem): number {
		const visibleFieldsCount = Object.entries(item)
			.filter(([key, value]) => key !== this.secretIdKey && this.searchEngine.fieldMatchesSearch(key, value))
			.length;
		return visibleFieldsCount * this.fieldHeight;
	}

	private resetListAndRender(): void {
		this.lastScrollTop = 0;
		this.vList.scrollTop = 0;
		this.renderList();
	}

	private renderList(): void {
		const { scrollTop } = this.vList;
		const viewportHeight = this.vList.clientHeight;

		this.removeTextUpdateEventListeners();

		this.listContainer.innerHTML = '';
		let totalHeight = 0;
		let startIndex = 0;

		for (let i = 0; i < this.filteredIndexes.length; i += 1) {
			const itemIndex = this.filteredIndexes[i];
			const item = this.bigJsonObject[itemIndex];
			const itemHeight = this.getItemHeight(item);
			if (totalHeight + itemHeight > scrollTop) {
				startIndex = i;
				break;
			}
			totalHeight += itemHeight;
		}

		for (let i = startIndex; i < this.filteredIndexes.length; i += 1) {
			const itemIndex = this.filteredIndexes[i];
			const item = this.bigJsonObject[itemIndex];
			const listItem = this.createListItem(item);
			const itemHeight = this.getItemHeight(item);

			listItem.style.position = 'absolute';
			listItem.style.top = `${totalHeight}px`;
			listItem.style.left = '20px';
			listItem.style.right = '20px';
			this.listContainer.appendChild(listItem);
			this.addTextUpdateEventListenersToItem(listItem);

			totalHeight += itemHeight;

			if (totalHeight > scrollTop + viewportHeight * 3) {
				break;
			}
		}
	}

	private handleScroll = (): void => {
		const currentTime = Date.now();
		const { scrollTop } = this.vList;
		const scrollDirection = scrollTop > this.lastScrollTop ? 'down' : 'up';
		const scrollSpeed = Math.abs(scrollTop - this.lastScrollTop) / (currentTime - this.lastRenderTime);

		if (currentTime - this.lastRenderTime > this.renderInterval) {
			const scrollPercentage = scrollTop / (this.vList.scrollHeight - this.vList.clientHeight);
			this.backgroundImage.style.transform = `translateY(${-scrollPercentage * 89}%)`;

			this.renderList();
			const visibleFields = document.querySelectorAll('.field');
			this.animationManager.animateFields(scrollDirection, scrollSpeed, visibleFields);

			this.lastScrollTop = scrollTop;
			this.lastRenderTime = currentTime;
		}

		this.stopScrolling();
		this.renderList();
	};

	private createListItem(item: JSONItem): HTMLElement {
		const listItem = document.createElement('div');
		listItem.className = 'list-item';
		listItem.dataset.index = item[this.secretIdKey].toString();
		listItem.innerHTML = Object.entries(item)
			.filter(([key, value]) => key !== this.secretIdKey && this.searchEngine.fieldMatchesSearch(key, value))
			.map(([key, value], i) => {
				return this.createField(key, value, key, item[this.secretIdKey] as number, i === 0);
			}).join('');
		return listItem;
	}

	private createField(label: string, value: unknown, field: string, itemIndex: number, isGroupStart = false): string {
		const inputElement = this.inputGenerator.createInput(field, value, itemIndex);
		return `
      <div class="field${isGroupStart ? ' group-start' : ''}" data-field="${field}">
        <label>${label}:</label>
        ${inputElement}
      </div>
    `;
	}

	private addTextUpdateEventListenersToItem(listItem: HTMLElement): void {
		const inputs = listItem.querySelectorAll('input, textarea');
		const itemIndex = parseInt(listItem.dataset.index as string, 10);
		inputs.forEach((input) => {
			const { field } = (input.closest('.field') as HTMLElement).dataset;
			const listener = this.createTextUpdateInputListener(itemIndex, field as string);
			input.addEventListener('change', listener);

			if (!this.textUpdateEventListeners.has(itemIndex)) {
				this.textUpdateEventListeners.set(itemIndex, new Map());
			}
			this.textUpdateEventListeners.get(itemIndex)!.set(input as HTMLInputElement | HTMLTextAreaElement, listener);
		});
	}

	private createTextUpdateInputListener(itemIndex: number, field: string): (event: Event) => void {
		return (event: Event) => {
			const input = event.target as HTMLInputElement | HTMLTextAreaElement;
			const dataType = input.getAttribute('data-type');
			let value: string | number | boolean | Date;

			if (dataType === 'number') {
				value = Number(input.value);
			} else if (dataType === 'boolean') {
				value = input.value === 'true';
			} else if (dataType === 'date') {
				value = new Date(input.value);
			} else {
				value = input.value;
			}

			const item = this.bigJsonObject.find(item => item[this.secretIdKey] === itemIndex);
			if (item) {
				item[field] = value;
				this.updateFilteredIndexes();
				this.renderList();
			}
		};
	}

	private removeTextUpdateEventListeners(): void {
		this.textUpdateEventListeners.forEach((listeners) => {
			listeners.forEach((listener, input) => {
				input.removeEventListener('input', listener);
			});
		});
		this.textUpdateEventListeners.clear();
	}

	private setScrollListeners(): void {
		this.vList.addEventListener('scroll', this.startScrolling);
		this.vList.addEventListener('scrollend', this.stopScrolling);
	}

	private startScrolling = (): void => {
		if (!this.isScrolling) {
			this.isScrolling = true;
			requestAnimationFrame(this.handleScroll);
		}
	};

	private stopScrolling = (): void => {
		this.isScrolling = false;
	};

	private insertFirefoxWorkaround = () => {
		if (!document.getElementById('firefox-workaround')) {
			const workaround = document.createElement('div');
			workaround.id = 'firefox-workaround';
			const vList = document.getElementById('v-list');
			const listContainer = document.getElementById('list-container');
			vList?.insertBefore?.(workaround, listContainer);
		}
	};
}

const vScrollAPI = new VirtualScroll(
	document.getElementById('v-list') as HTMLElement,
	document.getElementById('list-container') as HTMLElement,
	document.getElementById('background-image') as HTMLElement,
	new JSONGenerator(),
	new SearchEngine(),
	new AnimationManager(document.getElementById('animation-layer') as HTMLElement),
	new HTMLInputGenerator()
);

export { vScrollAPI };
