export type JSONValues = number | string | boolean | Date
export type JSONItem = Record<string, JSONValues> & Record<symbol, number>
export type JSONData = JSONItem[]

export class JSONGenerator {
	private secretId = Symbol('id');

	getSecretId() {
		return this.secretId;
	}

	generateRandomData(count: number): JSONData {
		return Array.from({ length: count }, (_, i) => ({
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
	}
}
