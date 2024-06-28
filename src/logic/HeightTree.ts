export class HeightTree {
	readonly tree: number[] = [];

	readonly size: number = 0;

	constructor(size: number) {
		this.size = size;
		this.tree = new Array(2 * size).fill(0);
	}

	update(_index: number, height: number): void {
		let index = _index + this.size;
		this.tree[index] = height;
		while (index > 1) {
			index = Math.floor(index / 2);
			this.tree[index] = this.tree[2 * index] + this.tree[2 * index + 1];
		}
	}

	query(_left: number, _right: number): number {
		let left = _left + this.size;
		let right = _right + this.size;
		let sum = 0;
		while (left < right) {
			if (left % 2 === 1) {
				sum += this.tree[left];
				left += 1;
			}
			if (right % 2 === 0) {
				sum += this.tree[right];
				right -= 1;
			}
			left = Math.floor(left / 2);
			right = Math.floor(right / 2);
		}
		if (left === right) {
			sum += this.tree[left];
		}
		return sum;
	}

	getTotalHeight(): number {
		return this.tree[1];
	}
}
