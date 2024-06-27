export interface InputGenerator {
    createInput(field: string, value: unknown, itemIndex: number): string;
}

export class HTMLInputGenerator implements InputGenerator {
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

	createInput(field: string, value: unknown, itemIndex: number): string {
		if (field === 'id') {
			return `<span>${value}</span>`;
		} if (typeof value === 'string') {
			if (/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(value)) {
				return `<input type="email" value="${value}" data-type="email">`;
			} if (this.isValidDate(value)) {
				return `<input type="date" value="${this.formatDate(new Date(value))}" data-type="date">`;
			} if (value.length > 100) {
				return `<textarea data-type="text">${value}</textarea>`;
			}
			return `<input type="text" value="${value}" data-type="text">`;
		} if (typeof value === 'number') {
			return `<input type="number" value="${value}" data-type="number">`;
		} if (value instanceof Date) {
			return `<input type="date" value="${this.formatDate(value)}" data-type="date">`;
		} if (typeof value === 'boolean') {
			return `
        <label><input type="radio" name="${field}_${itemIndex}" value="true" ${value ? 'checked' : ''} data-type="boolean"> True</label>
        <label><input type="radio" name="${field}_${itemIndex}" value="false" ${value ? '' : 'checked'} data-type="boolean"> False</label>
      `;
		}
		return '';
	}
}
