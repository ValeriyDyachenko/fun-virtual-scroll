import './App.css';
import { useState } from 'react';
import { vScrollAPI } from './logic/VirtualScroll.ts';

function App() {
	const [cardsCount, setCardsCount] = useState(() => {
		const initialCount = 10_000;
		vScrollAPI.generateRandomData(initialCount);
		return initialCount;
	});

	return (
		<div className="app-config">
			<div className="config-block">
				Cards Count:
				{' '}
				<input
					type="number"
					value={cardsCount}
					onChange={e => setCardsCount(Number(e.target.value))}
				/>
				<button
					className="generate-json-button"
					type="button"
					onClick={() => {
						vScrollAPI.generateRandomData(cardsCount);
					}}
				>
					Generate Random JSON
				</button>
			</div>

			<div className="config-block">
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

		</div>
	);
}

export default App;
