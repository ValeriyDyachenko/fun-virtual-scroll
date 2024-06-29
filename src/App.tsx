import './App.css';
import { useState } from 'react';
import { vScrollAPI } from './logic/VirtualScroll.ts';

function App() {
	const [isWaiting, setIsWaiting] = useState(true);

	const generateJSONData = (initialCount: number) => {
		vScrollAPI.generateRandomData(initialCount, {
			beforeCallback: () => setIsWaiting(true),
			afterCallback: () => setIsWaiting(false),
		});
	};

	const [cardsCount, setCardsCount] = useState(() => {
		const initialCount = 10_000;
		generateJSONData(initialCount);
		return initialCount;
	});

	return (
		<>
			<div className="app-config">
				<div className="config-block">
					<div>Set count and press Generate button</div>
					<div>(card contains up to 15 random fields)</div>
					{' '}
					<input
						type="number"
						value={cardsCount}
						onChange={e => setCardsCount(Number(e.target.value))}
					/>
					<button
						className="button"
						type="button"
						onClick={() => {
							generateJSONData(cardsCount);
						}}
					>
						Generate Random JSON
					</button>
				</div>
				<br />
				<div className="config-block">
					<div>
						try to use search:
					</div>
					<br />
					Search By Key:
					{' '}
					<input
						onChange={(e) => {
							vScrollAPI.searchByKey(e.target.value);
						}}
						type="text"
					/>
				</div>
				<div className="config-block">
					Search By Value:
					{' '}
					<input
						onChange={(e) => {
							vScrollAPI.searchByValue(e.target.value);
						}}
						type="text"
					/>
				</div>
				<br />
				<div className="config-block">
					click to download edited JSON file:
					<button className="button" type="button" onClick={() => vScrollAPI.saveJSONToFile()}>Save JSON</button>
				</div>
			</div>
			{isWaiting && <div className="waiting-for-something" />}
			{isWaiting && <img className="travolta" src="/travolta.gif" alt="travolta-waiting" />}
		</>
	);
}

export default App;
