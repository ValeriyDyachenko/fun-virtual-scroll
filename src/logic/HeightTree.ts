/* eslint-disable no-bitwise */
/* eslint-disable no-plusplus */
/* eslint-disable no-param-reassign */

export class HeightTree {
	readonly tree: number[];

	readonly size: number;

	constructor(size: number) {
		this.size = size;
		this.tree = new Array(2 * size);
	}

	update(index: number, height: number): void {
		index += this.size;
		this.tree[index] = height;
		while (index > 1) {
			index >>= 1;
			this.tree[index] = this.tree[index << 1] + this.tree[(index << 1) | 1];
		}
	}

	query(left: number, right: number): number {
		left += this.size;
		right += this.size;
		let sum = 0;
		while (left < right) {
			if (left & 1) {
				sum += this.tree[left++];
			}
			if (!(right & 1)) {
				sum += this.tree[right--];
			}
			left >>>= 1;
			right >>>= 1;
		}
		if (left === right) {
			sum += this.tree[left];
		}
		return sum;
	}

	getTotalHeight(): number {
		return this.tree[1] || 0;
	}
}
