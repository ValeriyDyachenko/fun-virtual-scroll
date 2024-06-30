import { JSONData, JSONGenerator, JSONItem } from './JSONGenerator.ts';
import { SearchEngine } from './SearchEngine.ts';
import { AnimationManager } from './AnimationManager.ts';
import { HTMLInputGenerator, InputGenerator } from './InputGenerator.ts';
import { HeightTree } from './HeightTree.ts';

class VirtualScroll {
	private abortController: AbortController | null = null;

	private bigJsonObject: JSONData = new Map();

	private filteredIdsArray: string[] = [];

	private vList: HTMLElement;

	private listContainer: HTMLElement;

	private backgroundImage: HTMLElement;

	private fieldHeight = 90;

	private lastScrollTop = 0;

	private lastRenderTime = 0;

	private renderInterval = 16;

	private textUpdateEventListeners: Map<string, Map<HTMLInputElement | HTMLTextAreaElement, (event: Event) => void>> = new Map();

	private itemHeightCache: Map<string, number> = new Map();

	private totalHeight = 0;

	private jsonGenerator: JSONGenerator;

	private searchEngine: SearchEngine;

	private animationManager: AnimationManager;

	private inputGenerator: InputGenerator;

	private heightTree: HeightTree;

	private virtualScrollbar: HTMLElement;

	private virtualScrollThumb: HTMLElement;

	private virtualScrollHeight: number = 0;

	private virtualScrollTop: number = 0;

	private isDragging: boolean = false;

	private lastTouchY: number = 0;

	private rafId: number | null = null;

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
		this.heightTree = new HeightTree(0);
		this.virtualScrollbar = document.createElement('div');
		this.virtualScrollbar.className = 'virtual-scrollbar';
		this.virtualScrollThumb = document.createElement('div');
		this.virtualScrollThumb.className = 'virtual-scroll-thumb';
		this.virtualScrollbar.appendChild(this.virtualScrollThumb);
		this.vList.appendChild(this.virtualScrollbar);
		this.setupVirtualScroll();
	}

	public async generateRandomData(count: number, callbacks: { beforeCallback?: () => void, afterCallback?: () => void} = {}): Promise<void> {
		callbacks?.beforeCallback?.();
		const abortController = this.updateAbortController();
		this.destroy();
		this.setScrollListeners();
		this.setupVirtualScroll();

		this.bigJsonObject = await this.jsonGenerator.generateRandomData(count, abortController.signal);
		if (abortController.signal.aborted) return;

		await this.updateFilteredIndexes(abortController.signal);
		if (abortController.signal.aborted) return;

		this.updateVirtualScroll();
		this.updateBackgroundPosition();
		this.renderList('up', 0);
		callbacks?.afterCallback?.();
	}

	public async searchByKey(key: string, callbacks: { beforeCallback?: () => void, afterCallback?: () => void} = {}): Promise<void> {
		callbacks?.beforeCallback?.();
		const abortController = this.updateAbortController();
		this.searchEngine.searchByKey(key);
		this.itemHeightCache.clear();

		await this.updateFilteredIndexes(abortController.signal);
		if (abortController.signal.aborted) return;

		this.resetListAndRender();
		callbacks?.afterCallback?.();
	}

	public async searchByValue(value: string, callbacks: { beforeCallback?: () => void, afterCallback?: () => void} = {}): Promise<void> {
		callbacks?.beforeCallback?.();
		const abortController = this.updateAbortController();
		this.searchEngine.searchByValue(value);
		this.itemHeightCache.clear();

		await this.updateFilteredIndexes(abortController.signal);
		if (abortController.signal.aborted) return;

		this.resetListAndRender();
		callbacks?.afterCallback?.();
	}

	public saveJSONToFile(): void {
		const jsonObject = Object.fromEntries(this.bigJsonObject);
		const jsonString = JSON.stringify(jsonObject, null, 2);
		const blob = new Blob([jsonString], { type: 'application/json' });
		const url = URL.createObjectURL(blob);

		const link = document.createElement('a');
		link.href = url;
		link.download = 'virtual_scroll_data.json';

		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}

	private updateAbortController(): AbortController {
		if (this.abortController) {
			this.abortController.abort();
		}
		const abortController = new AbortController();
		this.abortController = abortController;
		return abortController;
	}

	private setupVirtualScroll(): void {
		this.vList.tabIndex = 0;
		this.vList.style.overflow = 'hidden';
		this.virtualScrollbar.addEventListener('mousedown', this.startDragging);
		this.vList.addEventListener('wheel', this.handleWheel, { passive: false });
		this.vList.addEventListener('touchstart', this.handleTouchStart, { passive: false });
		this.vList.addEventListener('touchmove', this.handleTouchMove, { passive: false });
		window.addEventListener('keydown', this.handleKeyDown);
		this.vList.addEventListener('scroll', this.handleScroll);

		// Firefox
		this.vList.addEventListener('DOMMouseScroll', this.handleFirefoxScroll, { passive: false });
	}

	private processChunks = (bigJsonObject: JSONData, searchEngine: SearchEngine, signal: AbortSignal, chunk = 10_000): Promise<string[]> => {
		return new Promise((resolve) => {
			const filteredIds: string[] = [];
			const entries = Array.from(bigJsonObject.entries());
			let index = 0;

			function processChunk() {
				const end = Math.min(index + chunk, entries.length);
				if (signal.aborted) {
					resolve(filteredIds);
					return;
				}
				for (let i = index; i < end; i += 1) {
					const [id, item] = entries[i];
					const match = searchEngine.itemMatchesSearch(item);
					if (match.isSearchDisabled || match.matchedKeys.size) {
						filteredIds.push(id);
					}
				}

				index = end;

				if (index < entries.length) {
					requestAnimationFrame(processChunk);
				} else {
					resolve(filteredIds);
				}
			}

			requestAnimationFrame(processChunk);
		});
	};

	private async updateFilteredIndexes(signal: AbortSignal, callbacks: { beforeCallback?: () => void, afterCallback?: () => void} = {}): Promise<void> {
		callbacks?.beforeCallback?.();
		if (!this.searchEngine.getSearchValueTerm() && !this.searchEngine.getSearchKeyTerm()) {
			// for the super large JSON over 5_000_000_000 fields we may make it a bit faster
			// with chunks and requestAnimationFrame like implemented in the else block
			this.filteredIdsArray = [...this.bigJsonObject.keys()];
		} else {
			this.filteredIdsArray = await this.processChunks(this.bigJsonObject, this.searchEngine, signal);
		}
		if (signal.aborted) return;

		await this.updateHeightTree(signal);
		if (signal.aborted) return;

		callbacks?.afterCallback?.();
	}

	private updateHeightTree(signal: AbortSignal): Promise<void> {
		return new Promise<void>((resolve) => {
			this.heightTree = new HeightTree(this.filteredIdsArray.length);
			let index = 0;
			const chunkSize = 10_000;

			const processChunk = () => {
				const endIndex = Math.min(index + chunkSize, this.filteredIdsArray.length);
				if (signal.aborted) {
					resolve();
					return;
				}
				for (; index < endIndex; index += 1) {
					const itemId = this.filteredIdsArray[index];
					const item = this.bigJsonObject.get(itemId)!;
					const height = this.getItemHeight(item, itemId);
					this.heightTree.update(index, height);
				}

				if (index < this.filteredIdsArray.length) {
					requestAnimationFrame(processChunk);
				} else {
					this.updateListContainerHeight();
					resolve();
				}
			};

			requestAnimationFrame(processChunk);
		});
	}

	private updateListContainerHeight(): void {
		this.totalHeight = this.heightTree.getTotalHeight();
		this.listContainer.style.height = `${this.totalHeight}px`;
		this.virtualScrollHeight = this.totalHeight;
		this.updateVirtualScroll();
	}

	private getItemHeight(item: JSONItem, itemId: string): number {
		if (!this.itemHeightCache.has(itemId)) {
			const match = this.searchEngine.itemMatchesSearch(item);
			const matchedFieldsCnt = match.isSearchDisabled ? Object.keys(item).length : match.matchedKeys.size;
			this.itemHeightCache.set(itemId, matchedFieldsCnt * this.fieldHeight);
		}
		return this.itemHeightCache.get(itemId)!;
	}

	private resetListAndRender(): void {
		this.lastScrollTop = 0;
		this.vList.scrollTop = 0;
		this.virtualScrollTop = 0;
		this.updateVirtualScroll();
		this.renderList('up', 0);
	}

	private renderList(scrollDirection: 'up' | 'down', scrollSpeed: number): void {
		const scrollTop = this.virtualScrollTop;
		const viewportHeight = this.vList.clientHeight;

		this.removeTextUpdateEventListeners();
		this.listContainer.innerHTML = '';

		if (this.filteredIdsArray.length === 0) {
			return;
		}

		const startIndex = this.findStartIndex(scrollTop);
		let totalHeight = this.calculateTotalHeightBefore(startIndex);

		const fragment = document.createDocumentFragment();
		const maxItemsToRender = Math.ceil(viewportHeight / this.fieldHeight) * 3;
		let renderedItems = 0;

		for (let i = startIndex; i < this.filteredIdsArray.length; i += 1) {
			const itemId = this.filteredIdsArray[i];
			const item = this.bigJsonObject.get(itemId)!;
			const listItem = this.createListItem(item, itemId);
			const itemHeight = this.getItemHeight(item, itemId);

			listItem.style.position = 'absolute';
			listItem.style.top = `${totalHeight - scrollTop}px`;
			listItem.style.left = '20px';
			listItem.style.right = '20px';

			fragment.appendChild(listItem);
			this.addTextUpdateEventListenersToItem(listItem);

			totalHeight += itemHeight;
			renderedItems += 1;

			if (renderedItems >= maxItemsToRender || totalHeight > scrollTop + viewportHeight * 3) {
				break;
			}
		}

		this.listContainer.appendChild(fragment);

		const visibleFields = document.querySelectorAll('.field');
		this.animationManager.animateFields(scrollDirection, scrollSpeed, visibleFields);
	}

	private findStartIndex(scrollTop: number): number {
		let left = 0;
		let right = this.filteredIdsArray.length - 1;
		while (left < right) {
			const mid = Math.floor((left + right) / 2);
			const height = this.heightTree.query(0, mid);
			if (height < scrollTop) {
				left = mid + 1;
			} else {
				right = mid;
			}
		}
		return left;
	}

	private calculateTotalHeightBefore(index: number): number {
		return this.heightTree.query(0, index - 1);
	}

	private createListItem(item: JSONItem, key: string): HTMLElement {
		const listItem = document.createElement('div');
		listItem.className = 'list-item';
		listItem.dataset.index = key;
		const match = this.searchEngine.itemMatchesSearch(item);
		listItem.innerHTML = Object.entries(item)
			.filter(([key]) => {
				return match.isSearchDisabled || match.matchedKeys.has(key);
			})
			.map(([fieldName, value], i) => {
				return this.createField(fieldName, value, fieldName, key, i === 0);
			}).join('');
		return listItem;
	}

	private createField(label: string, value: unknown, field: string, key: string, isGroupStart = false): string {
		const inputElement = this.inputGenerator.createInput(field, value, key);
		return `
      <div class="field${isGroupStart ? ' group-start' : ''}" data-field="${field}">
        <label>${label}:</label>
        ${inputElement}
      </div>
    `;
	}

	private addTextUpdateEventListenersToItem(listItem: HTMLElement): void {
		const inputs = listItem.querySelectorAll('input, textarea');
		const itemKey = listItem.dataset.index as string;
		inputs.forEach((input) => {
			const { field } = (input.closest('.field') as HTMLElement).dataset;
			const listener = this.createTextUpdateInputListener(itemKey, field as string);
			input.addEventListener('input', listener);

			if (!this.textUpdateEventListeners.has(itemKey)) {
				this.textUpdateEventListeners.set(itemKey, new Map());
			}
			this.textUpdateEventListeners.get(itemKey)!.set(input as HTMLInputElement | HTMLTextAreaElement, listener);
		});
	}

	private createTextUpdateInputListener(key: string, field: string): (event: Event) => void {
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

			const item = this.bigJsonObject.get(key);
			if (item) {
				item[field] = value;
				this.bigJsonObject.set(key, item);
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
		this.vList.addEventListener('wheel', this.handleWheel);
		this.virtualScrollbar.addEventListener('mousedown', this.startDragging);
	}

	private handleScroll = (): void => {
		const currentTime = Date.now();
		const currentScrollTop = this.virtualScrollTop;

		const scrollDirection = currentScrollTop > this.lastScrollTop ? 'down' : 'up';
		const scrollSpeed = Math.abs(currentScrollTop - this.lastScrollTop) / (currentTime - this.lastRenderTime);

		if (currentTime - this.lastRenderTime > this.renderInterval) {
			this.updateBackgroundPosition();
			this.renderList(scrollDirection, scrollSpeed);

			this.lastScrollTop = currentScrollTop;
			this.lastRenderTime = currentTime;
		} else {
			this.scheduleRender(scrollDirection, scrollSpeed);
		}
	};

	private updateBackgroundPosition(): void {
		const scrollPercentage = this.virtualScrollTop / (this.virtualScrollHeight - this.vList.clientHeight);
		this.backgroundImage.style.transform = `translateY(${-scrollPercentage * 89}%)`;
	}

	private updateVirtualScroll(): void {
		const thumbHeight = Math.max(30, (this.vList.clientHeight / this.virtualScrollHeight) * this.virtualScrollbar.clientHeight);
		const thumbTop = (this.virtualScrollTop / (this.virtualScrollHeight - this.vList.clientHeight)) * (this.virtualScrollbar.clientHeight - thumbHeight);

		this.virtualScrollThumb.style.height = `${thumbHeight}px`;
		this.virtualScrollThumb.style.top = `${thumbTop}px`;
	}

	private handleWheel = (e: WheelEvent): void => {
		e.preventDefault();
		const delta = e.deltaY || -(e.detail || 0) * 40;
		this.scrollBy(delta);
	};

	private handleFirefoxScroll = (e: Event): void => {
		e.preventDefault();
		const delta = -(e as Event & {detail: number}).detail * 40;
		this.scrollBy(delta);
	};

	private scrollBy(delta: number): void {
		this.virtualScrollTop = Math.max(0, Math.min(this.virtualScrollTop + delta, this.virtualScrollHeight - this.vList.clientHeight));
		this.updateVirtualScroll();
		this.handleScroll();
	}

	private startDragging = (e: MouseEvent): void => {
		e.preventDefault();
		this.isDragging = true;
		document.addEventListener('mousemove', this.drag);
		document.addEventListener('mouseup', this.stopDragging);
	};

	private drag = (e: MouseEvent): void => {
		if (!this.isDragging) return;
		const scrollbarRect = this.virtualScrollbar.getBoundingClientRect();
		const thumbHeight = parseFloat(this.virtualScrollThumb.style.height);
		const scrollableHeight = scrollbarRect.height - thumbHeight;
		const scrollPercentage = Math.max(0, Math.min((e.clientY - scrollbarRect.top - thumbHeight / 2) / scrollableHeight, 1));
		this.virtualScrollTop = scrollPercentage * (this.virtualScrollHeight - this.vList.clientHeight);
		this.updateVirtualScroll();
		this.handleScroll();
	};

	private stopDragging = (): void => {
		this.isDragging = false;
		document.removeEventListener('mousemove', this.drag);
		document.removeEventListener('mouseup', this.stopDragging);
	};

	private handleTouchStart = (e: TouchEvent): void => {
		e.preventDefault();
		this.lastTouchY = e.touches[0].clientY;
	};

	private handleTouchMove = (e: TouchEvent): void => {
		e.preventDefault();
		const touchY = e.touches[0].clientY;
		const deltaY = this.lastTouchY - touchY;
		this.scrollBy(deltaY);
		this.lastTouchY = touchY;
	};

	private handleKeyDown = (e: KeyboardEvent): void => {
		let delta = 0;
		switch (e.key) {
		case 'ArrowUp':
			delta = -this.fieldHeight;
			break;
		case 'ArrowDown':
			delta = this.fieldHeight;
			break;
		case 'PageUp':
			delta = -this.vList.clientHeight;
			break;
		case 'PageDown':
			delta = this.vList.clientHeight;
			break;
		case 'Home':
			this.virtualScrollTop = 0;
			this.updateBackgroundPosition();
			break;
		case 'End':
			this.virtualScrollTop = this.virtualScrollHeight - this.vList.clientHeight;
			this.updateBackgroundPosition();
			break;
		default:
			return;
		}

		if (delta !== 0) {
			this.scrollBy(delta);
		} else {
			this.updateVirtualScroll();
			const scrollDirection = this.virtualScrollTop > this.lastScrollTop ? 'down' : 'up';
			const scrollSpeed = Math.abs(this.virtualScrollTop - this.lastScrollTop) / (Date.now() - this.lastRenderTime);
			this.renderList(scrollDirection, scrollSpeed);
		}

		e.preventDefault();
	};

	private scheduleRender(scrollDirection: 'up' | 'down', scrollSpeed: number): void {
		if (this.rafId === null) {
			this.renderList(scrollDirection, scrollSpeed);
		} else {
			cancelAnimationFrame(this.rafId);
			this.rafId = requestAnimationFrame(() => {
				this.renderList(scrollDirection, scrollSpeed);
				this.rafId = null;
			});
		}
	}

	private destroy(): void {
		this.vList.removeEventListener('wheel', this.handleWheel);
		this.vList.removeEventListener('DOMMouseScroll', this.handleFirefoxScroll);
		this.vList.removeEventListener('touchstart', this.handleTouchStart);
		this.vList.removeEventListener('touchmove', this.handleTouchMove);
		window.removeEventListener('keydown', this.handleKeyDown);
		this.virtualScrollbar.removeEventListener('mousedown', this.startDragging);
		document.removeEventListener('mousemove', this.drag);
		document.removeEventListener('mouseup', this.stopDragging);
		this.removeTextUpdateEventListeners();
		if (this.rafId !== null) {
			cancelAnimationFrame(this.rafId);
		}
	}
}

export { VirtualScroll };

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
