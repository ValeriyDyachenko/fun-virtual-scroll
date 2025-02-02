export type JSONValues = number | string | boolean | Date
export type JSONItem = Record<string, JSONValues>
export type JSONData = Map<string, JSONItem>

export class JSONGenerator {
	async generateRandomData(dataSize: number, signal: AbortSignal, callbacks: { beforeCallback?: () => void, afterCallback?: () => void} = {}): Promise<JSONData> {
		callbacks?.beforeCallback?.();
		const data: JSONData = new Map();
		const fieldNames = {
			isVegan: ['isVegan', 'vegetarian', 'plantBased', 'meatFree', 'veganLifestyle'],
			name: ['name', 'fullName', 'displayName', 'userName', 'alias'],
			email: ['email', 'emailAddress', 'contactEmail', 'userEmail', 'primaryEmail'],
			age: ['age', 'yearsOld', 'ageInYears', 'userAge', 'personAge'],
			address: ['address', 'location', 'residenceAddress', 'livingPlace', 'homeAddress'],
			about: ['about', 'bio', 'description', 'personalInfo', 'userDescription'],
			registered: ['registered', 'joinDate', 'memberSince', 'registrationDate', 'accountCreated'],
			favoriteDate: ['favoriteDate', 'specialDay', 'memorableDate', 'significantDate', 'importantDay'],
			hobby: ['hobby', 'interest', 'pastime', 'leisure', 'recreation'],
			height: ['height', 'heightInCm', 'stature', 'bodyHeight', 'verticalMeasurement'],
			longText: ['longText', 'biography', 'detailedDescription', 'personalStatement', 'extendedInfo'],
			favoriteNumber: ['favoriteNumber', 'luckyNumber', 'preferredDigit', 'numericalPreference', 'chosenNumber'],
			isActiveUser: ['isActiveUser', 'accountActive', 'currentlyActive', 'userStatus', 'engagementStatus'],
			hasPets: ['hasPets', 'petOwner', 'animalCompanion', 'hasFurryFriends', 'caresForAnimals'],
		};

		const hobbies = ['reading', 'swimming', 'cycling', 'painting', 'cooking', 'gaming', 'hiking', 'photography'];

		const getRandomFieldName = (field: keyof typeof fieldNames) =>
			fieldNames[field][Math.floor(Math.random() * fieldNames[field].length)];

		let nextIndexForGenerate = 0;
		const chunkSize = 10_000;

		const makeNextChunk = () => {
			const limit = Math.min(nextIndexForGenerate + chunkSize, dataSize);
			for (; nextIndexForGenerate < limit; nextIndexForGenerate += 1) {
				const item: JSONItem = { id: nextIndexForGenerate };

				if (Math.random() < 0.5) item[getRandomFieldName('isVegan')] = Math.random() < 0.5;
				if (Math.random() < 0.5) item[getRandomFieldName('name')] = `Person ${nextIndexForGenerate + 1}`;
				if (Math.random() < 0.5) item[getRandomFieldName('email')] = `person${nextIndexForGenerate + 1}@example.com`;
				if (Math.random() < 0.5) item[getRandomFieldName('age')] = Math.floor(Math.random() * 50) + 20;
				if (Math.random() < 0.5) item[getRandomFieldName('address')] = `${Math.floor(Math.random() * 1000)} Main St, City ${nextIndexForGenerate + 1}`;
				if (Math.random() < 0.5) item[getRandomFieldName('about')] = `This is a description about Person ${nextIndexForGenerate + 1}.`;
				// eslint-disable-next-line prefer-destructuring
				if (Math.random() < 0.5) item[getRandomFieldName('registered')] = new Date(Date.now() - Math.random() * 157680000000).toISOString().split('T')[0];
				// eslint-disable-next-line prefer-destructuring
				if (Math.random() < 0.5) item[getRandomFieldName('favoriteDate')] = new Date(Date.now() - Math.random() * 3153600000000).toISOString().split('T')[0];
				if (Math.random() < 0.5) item[getRandomFieldName('hobby')] = hobbies[Math.floor(Math.random() * hobbies.length)];
				if (Math.random() < 0.5) item[getRandomFieldName('height')] = Math.floor(Math.random() * 50) + 150;
				if (Math.random() < 0.5) {
					// eslint-disable-next-line max-len
					item[getRandomFieldName('longText')] = 'This is a long text field that contains more than 100 characters. It\'s used to test how the application handles large amounts of text. This sentence is just to make sure we exceed the 100 character limit.';
				}
				if (Math.random() < 0.5) item[getRandomFieldName('favoriteNumber')] = Math.floor(Math.random() * 100);
				if (Math.random() < 0.5) item[getRandomFieldName('isActiveUser')] = Math.random() < 0.5;
				if (Math.random() < 0.5) item[getRandomFieldName('hasPets')] = Math.random() < 0.5;

				data.set(crypto.randomUUID(), item);
			}
		};

		return new Promise((resolve) => {
			const task = () => {
				if (signal?.aborted) {
					resolve(data);
					return;
				}

				makeNextChunk();
				if (nextIndexForGenerate >= dataSize) {
					callbacks?.afterCallback?.();
					resolve(data);
				} else {
					requestAnimationFrame(task);
				}
			};
			requestAnimationFrame(task);
		});
	}
}
