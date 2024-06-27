export class AnimationManager {
	private animationLayer: HTMLElement;

	private lastAnimationTime = 0;

	private maxAnimatedItems = 5;

	constructor(animationLayer: HTMLElement) {
		this.animationLayer = animationLayer;
	}

	animateFields(scrollDirection: 'up' | 'down', scrollSpeed: number, visibleFields: NodeListOf<Element>): void {
		const currentTime = Date.now();
		if (currentTime - this.lastAnimationTime < 100) return;

		const fieldsToAnimate = Math.min(Math.ceil(scrollSpeed / 10), this.maxAnimatedItems);
		if (fieldsToAnimate === 0) return;

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
			const strength = Math.min(scrollSpeed / 100, 1);
			this.createFlyingField(field, scrollDirection, strength);
		});

		this.lastAnimationTime = currentTime;
	}

	private createFlyingField(field: HTMLElement, direction: 'up' | 'down', strength: number): void {
		const flyingField = field.cloneNode(true) as HTMLElement;
		flyingField.className = 'flying-field';

		flyingField.innerHTML = '';

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
		flyingField.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';

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
}
