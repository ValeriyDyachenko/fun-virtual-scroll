export type JSONValues = number | string | boolean | Date
export type JSONItem = Record<string, JSONValues>
export type JSONData = Map<string, JSONItem>

export class JSONGenerator {
	generateRandomData(count: number): JSONData {
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

		for (let i = 0; i < count; i += 1) {
			const item: JSONItem = { id: i };

			if (Math.random() < 0.5) item[getRandomFieldName('isVegan')] = Math.random() < 0.5;
			if (Math.random() < 0.5) item[getRandomFieldName('name')] = `Person ${i + 1}`;
			if (Math.random() < 0.5) item[getRandomFieldName('email')] = `person${i + 1}@example.com`;
			if (Math.random() < 0.5) item[getRandomFieldName('age')] = Math.floor(Math.random() * 50) + 20;
			if (Math.random() < 0.5) item[getRandomFieldName('address')] = `${Math.floor(Math.random() * 1000)} Main St, City ${i + 1}`;
			if (Math.random() < 0.5) item[getRandomFieldName('about')] = `This is a description about Person ${i + 1}.`;
			if (Math.random() < 0.5) item[getRandomFieldName('registered')] = new Date(Date.now() - Math.random() * 157680000000).toISOString().split('T')[0];

			if (Math.random() < 0.5) item[getRandomFieldName('favoriteDate')] = new Date(Date.now() - Math.random() * 3153600000000).toISOString().split('T')[0];
			if (Math.random() < 0.5) item[getRandomFieldName('hobby')] = hobbies[Math.floor(Math.random() * hobbies.length)];
			if (Math.random() < 0.5) item[getRandomFieldName('height')] = Math.floor(Math.random() * 50) + 150;
			if (Math.random() < 0.5) item[getRandomFieldName('longText')] = 'This is a long text field that contains more than 100 characters. It\'s used to test how the application handles large amounts of text. This sentence is just to make sure we exceed the 100 character limit.';
			if (Math.random() < 0.5) item[getRandomFieldName('favoriteNumber')] = Math.floor(Math.random() * 100);
			if (Math.random() < 0.5) item[getRandomFieldName('isActiveUser')] = Math.random() < 0.5;
			if (Math.random() < 0.5) item[getRandomFieldName('hasPets')] = Math.random() < 0.5;

			data.set(crypto.randomUUID(), item);
		}
		return data;
	}
}
