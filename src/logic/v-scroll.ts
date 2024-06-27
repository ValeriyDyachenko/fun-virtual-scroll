type JSONValues = number | string | boolean | Date
type JSONItem = Record<string, JSONValues> & Record<symbol, number>
type JSONData = JSONItem[]

class VScrollAPI {
	private bigJsonObject: JSONData = [];

	private secretId = Symbol('id');

	private filteredIndexes: number[] = [];

	private vList: HTMLElement = document.getElementById('v-list') as HTMLElement;

	private listContainer: HTMLElement = document.getElementById('list-container') as HTMLElement;

	private backgroundImage: HTMLElement = document.getElementById('background-image') as HTMLElement;

	private animationLayer: HTMLElement = document.getElementById('animation-layer') as HTMLElement;

	private fieldHeight = 90;

	private lastScrollTop = 0;

	private isScrolling = false;

	private maxAnimatedItems = 5;

	private lastAnimationTime = 0;

	private lastRenderTime = 0;

	private renderInterval = 16;

	private textUpdateEventListeners: Map<number, Map<HTMLInputElement | HTMLTextAreaElement, (event: Event) => void>> = new Map();

	private searchKeyTerm = '';

	private searchValueTerm = '';

	private totalHeight = 0;

	constructor() {
		this.setScrollListeners();
	}

	public generateRandomData(count: number): void {
		this.bigJsonObject = Array.from({ length: count }, (_, i) => ({
			[this.secretId]: i,
			id: i,
			isVegan: Math.round(Math.random()) === 1,
			name: `Person ${i + 1}`,
			email: `person${i + 1}@example.com`,
			age: Math.floor(Math.random() * 50) + 20,
			address: `${Math.floor(Math.random() * 1000)} Main St, City ${i + 1}`,
			about: `This is a description about Person ${i + 1}.`,
			registered: new Date(Date.now() - Math.random() * 5 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
		}));
		this.updateFilteredIndexes();
		this.renderList();
	}

	public searchByKey(key: string): void {
		this.searchKeyTerm = key.toLowerCase();
		this.searchValueTerm = '';
		this.updateFilteredIndexes();
		this.resetListAndRender();
	}

	public searchByValue(value: string): void {
		this.searchValueTerm = value.toLowerCase();
		this.searchKeyTerm = '';
		this.updateFilteredIndexes();
		this.resetListAndRender();
	}

	private updateFilteredIndexes(): void {
		this.filteredIndexes = this.bigJsonObject.reduce((acc: number[], item, index) => {
			if (this.itemMatchesSearch(item)) {
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

	private resetListAndRender(): void {
		this.lastScrollTop = 0;
		this.vList.scrollTop = 0;
		this.renderList();
	}

	private updateListContainerHeight(): void {
		this.listContainer.style.height = `${this.totalHeight}px`;
	}

	private getItemHeight(item: JSONItem): number {
		const visibleFieldsCount = Object.entries(item)
			.filter(([key, value]) => (key as string | symbol) !== this.secretId && this.fieldMatchesSearch(key, value))
			.length;
		return visibleFieldsCount * this.fieldHeight;
	}

	private itemMatchesSearch(item: JSONItem): boolean {
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

	private fieldMatchesSearch(key: string, value: JSONValues): boolean {
		if (this.searchKeyTerm) {
			return key.toLowerCase().includes(this.searchKeyTerm);
		}
		if (this.searchValueTerm) {
			return String(value).toLowerCase().includes(this.searchValueTerm);
		}
		return true;
	}

	private createField(label: string, value: unknown, field: string, itemIndex: number, isGroupStart = false): string {
		let inputElement = '';

		if (field === 'id') {
			inputElement = `<span>${value}</span>`;
		} else if (typeof value === 'string') {
			if (/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(value)) {
				inputElement = `<input type="email" value="${value}" data-type="email">`;
			} else if (this.isValidDate(value)) {
				inputElement = `<input type="date" value="${this.formatDate(new Date(value))}" data-type="date">`;
			} else if (value.length > 100) {
				inputElement = `<textarea data-type="text">${value}</textarea>`;
			} else {
				inputElement = `<input type="text" value="${value}" data-type="text">`;
			}
		} else if (typeof value === 'number') {
			inputElement = `<input type="number" value="${value}" data-type="number">`;
		} else if (value instanceof Date) {
			inputElement = `<input type="date" value="${this.formatDate(value)}" data-type="date">`;
		} else if (typeof value === 'boolean') {
			inputElement = `
        <label><input type="radio" name="${field}_${itemIndex}" value="true" ${value ? 'checked' : ''} data-type="boolean"> True</label>
        <label><input type="radio" name="${field}_${itemIndex}" value="false" ${value ? '' : 'checked'} data-type="boolean"> False</label>
      `;
		}

		return `
      <div class="field${isGroupStart ? ' group-start' : ''}" data-field="${field}">
        <label>${label}:</label>
        ${inputElement}
      </div>
    `;
	}

	private isValidDate(dateString: string): boolean {
		const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
		const match = dateString.match(dateRegex);

		if (!match) {
			return false;
		}

		const [, year, month, day] = match.map(Number);

		if (month < 1 || month > 12) {
			return false;
		}

		const maxDay = new Date(year, month, 0).getDate();
		return !(day < 1 || day > maxDay);
	}

	private formatDate(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	private createListItem(item: JSONItem): HTMLElement {
		const listItem = document.createElement('div');
		listItem.className = 'list-item';
		listItem.dataset.index = item[this.secretId].toString();
		listItem.innerHTML = Object.entries(item)
			.filter(([key, value]) => (key as string | symbol) !== this.secretId && this.fieldMatchesSearch(key, value))
			.map(([key, value], i) => {
				return this.createField(key, value, key, item[this.secretId], i === 0);
			}).join('');
		return listItem;
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

	private createFlyingField(field: HTMLElement, direction: 'up' | 'down', strength: number): void {
		const flyingField = field.cloneNode(true) as HTMLElement;
		flyingField.className = 'flying-field';

		// Очищаем содержимое flyingField
		flyingField.innerHTML = '';

		// Добавляем убитый смайлик
		const deadSmile = document.createElement('span');
		deadSmile.textContent = 'x_x';
		deadSmile.style.position = 'absolute';
		deadSmile.style.top = '50%';
		deadSmile.style.left = '50%';
		deadSmile.style.transform = 'translate(-50%, -50%)';
		deadSmile.style.fontSize = '24px';
		deadSmile.style.fontWeight = 'bold';
		deadSmile.style.color = '#000000';
		flyingField.appendChild(deadSmile);

		const { width, height, left } = field.getBoundingClientRect();
		flyingField.style.width = `${width}px`;
		flyingField.style.height = `${height}px`;
		flyingField.style.left = `${left}px`;
		flyingField.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'; // Добавляем полупрозрачный фон

		const startY = direction === 'up' ? window.innerHeight : -height;
		flyingField.style.top = `${startY}px`;

		let randomX: number;
		let randomY: number;
		let randomRotate: number;
		let randomScale: number;
		let jumpDuration: number;
		let fallDuration: number;

		if (direction === 'up') {
			const maxJumpHeight = window.innerHeight;
			const minJumpHeight = window.innerHeight * 0.1;
			const jumpHeight = minJumpHeight + (maxJumpHeight - minJumpHeight) * strength ** 0.5;

			jumpDuration = 0.6 + strength * 0.4;
			fallDuration = 0.4 + strength * 0.2;

			randomX = (Math.random() - 0.5) * window.innerWidth * (0.2 + strength * 0.8);
			randomY = -jumpHeight;
			randomRotate = (Math.random() - 0.5) * 360 * (0.2 + strength * 0.8);
			randomScale = 1 + (Math.random() - 0.5) * strength * 0.5;

			flyingField.style.transition = `transform ${jumpDuration}s cubic-bezier(0.25, 0.1, 0.25, 1)`;

			requestAnimationFrame(() => {
				flyingField.style.transform = `translate(${randomX}px, ${randomY}px) rotate(${randomRotate}deg) scale(${randomScale})`;
			});

			setTimeout(() => {
				flyingField.style.transition = `transform ${fallDuration}s cubic-bezier(0.55, 0.055, 0.675, 0.19)`;
				flyingField.style.transform = `translate(${randomX}px, ${window.innerHeight}px) rotate(${randomRotate}deg) scale(${randomScale})`;

				setTimeout(() => {
					this.animationLayer.removeChild(flyingField);
				}, fallDuration * 1000);
			}, jumpDuration * 1000);
		} else {
			randomX = (Math.random() - 0.5) * window.innerWidth;
			randomY = window.innerHeight * 1.5;
			randomRotate = (Math.random() - 0.5) * 720;
			randomScale = 1;

			flyingField.style.transition = 'transform 1.2s cubic-bezier(0.25, 0.1, 0.25, 1)';

			requestAnimationFrame(() => {
				flyingField.style.transform = `translate(${randomX}px, ${randomY}px) rotate(${randomRotate}deg) scale(${randomScale})`;
			});

			setTimeout(() => {
				this.animationLayer.removeChild(flyingField);
			}, 1200);
		}

		this.animationLayer.appendChild(flyingField);
	}

	private animateFields(scrollDirection: 'up' | 'down', scrollSpeed: number): void {
		const currentTime = Date.now();
		if (currentTime - this.lastAnimationTime < 100) return;

		const fieldsToAnimate = Math.min(Math.ceil(scrollSpeed / 10), this.maxAnimatedItems);
		if (fieldsToAnimate === 0) return;

		const visibleFields = document.querySelectorAll('.field');
		const animatedFields: HTMLElement[] = [];

		for (let i = 0; i < visibleFields.length && animatedFields.length < fieldsToAnimate; i += 1) {
			const field = visibleFields[i] as HTMLElement;
			const { top, bottom } = field.getBoundingClientRect();
			if ((scrollDirection === 'up' && top < 0) ||
				(scrollDirection === 'down' && bottom > window.innerHeight)) {
				animatedFields.push(field);
			}
		}

		animatedFields.forEach((field) => {
			const strength = Math.min(scrollSpeed / 100, 1); // Нормализуем скорость прокрутки до значения от 0 до 1
			this.createFlyingField(field, scrollDirection, strength);
		});

		this.lastAnimationTime = currentTime;
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
			this.animateFields(scrollDirection, scrollSpeed);

			this.lastScrollTop = scrollTop;
			this.lastRenderTime = currentTime;
		}

		this.stopScrolling();
		this.renderList();
	};

	private startScrolling = (): void => {
		if (!this.isScrolling) {
			this.isScrolling = true;
			requestAnimationFrame(this.handleScroll);
		}
	};

	private stopScrolling = (): void => {
		this.isScrolling = false;
	};

	private addTextUpdateEventListenersToItem(listItem: HTMLElement): void {
		const inputs = listItem.querySelectorAll('input, textarea');
		const itemIndex = parseInt(listItem.dataset.index as string, 10);
		inputs.forEach((input) => {
			const { field } = (input.closest('.field') as HTMLInputElement)!.dataset;
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
			const item = this.bigJsonObject[itemIndex];
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
}

export const vScrollAPI = new VScrollAPI();
