/** @format */

const _pi = Math.PI;
const _pi90 = _pi / 2;
const _pi45 = _pi / 4;
const _pi360 = _pi * 2;
const _pi30 = _pi360 / 12;
const _degToRadians = 360 / _pi360;
let _guid = 10;
let _getNewGuid = () => _guid++;

export class BOB {
	constructor(svg, mass) {
		this.guid = _getNewGuid();
		this.mass = mass;
		this.timeStamp = undefined;
		this.position = { cx: Math.random() * 1920, cy: Math.random() * 1080 };
		this.radius = 20;
		this.rotation = 0;
		this.velocity = { dx: 0, dy: 0, dr: 0 };
		this.template = ``;
		this.node = null;
	}

	setTransform() {	
		let matrix = `translate(${this.position.cx},${this.position.cy}) rotate(${this.rotation})`;
		this.node.setAttribute('transform', matrix);
	}
	move(timeStamp, elapsedTime, aspectRatio) {
		this.position.cx += this.velocity.dx * elapsedTime;
		this.position.cy += this.velocity.dy * elapsedTime;
		if (this.position.cy + 100 < 0) this.position.cy = 1920 / aspectRatio + 100;
		if (this.position.cy > 1920 / aspectRatio + 100) this.position.cy = 0 - 100;
		if (this.position.cx + 100 < 0) this.position.cx = 1920 + 100;
		if (this.position.cx > 1920 + 100) this.position.cx = 0 - 100;
		this.rotation += this.velocity.dr * elapsedTime;
		if (this.rotation < 0) this.rotation = 360 + this.rotation;
		if (this.rotation > 360) this.rotation = this.rotation % 360;
	}
	normaliseSpeed() {
		let speed = Math.sqrt(this.velocity.dx * this.velocity.dx + this.velocity.dy * this.velocity.dy);
		if (this.maxSpeed != undefined && speed > this.maxSpeed) {
			let angle = Math.atan(this.velocity.dy / this.velocity.dx);
			let signX = Math.sign(this.velocity.dx);
			let signY = Math.sign(this.velocity.dy);

			this.velocity.dx = Math.cos(angle) * this.maxSpeed;
			this.velocity.dy = Math.sin(angle) * this.maxSpeed;
			if (Math.sign(this.velocity.dy) !== signY) this.velocity.dy *= -1;
			if (Math.sign(this.velocity.dx) !== signX) this.velocity.dx *= -1;
		}
	}
	destroy() {
		this.node.remove();
	}
}

/**
 * ASTEROID CHILD CLASS
 */
export class ASTEROID extends BOB {
	constructor(svg, size, parentAsteroid, isStartNewGame = false) {
		super(svg, size * 1000);
		this.size = size;
		this.score = Math.ceil(1200 / this.size);
		this.radius = 20 * this.size;
		this.maxSpeed = 500;
		this.velocity.dr = (Math.random() * 20 * (5 - this.size)) * Math.sign(Math.random() - 0.5); //degree of rotations per second
		if (parentAsteroid == undefined) {
			if (isStartNewGame === true) {
				let angle = Math.random() * _pi360;
				let h = svg.getAttribute('viewBox').split(' ')[3] * 1;
				let w = 1920;
				let cx = Math.sin(angle);
				let cy = -Math.cos(angle);

				this.position.cx = cx * (w / 2) + w / 2;
				this.position.cy = cy * (h / 2) + h / 2;
				this.velocity.dx = (Math.random() * 10 + 10) * -Math.sign(cx);
				this.velocity.dy = (Math.random() * 10 + 10) * -Math.sign(cy);
			} else {
				this.velocity.dx = (Math.random() * 10 + 10) * Math.sign(Math.random() - 0.5);
				this.velocity.dy = (Math.random() * 10 + 10) * Math.sign(Math.random() - 0.5);
			}
		} else {
			this.position.cx = parentAsteroid.position.cx;
			this.position.cy = parentAsteroid.position.cy;
			this.velocity.dx = parentAsteroid.velocity.dx;
			this.velocity.dy = parentAsteroid.velocity.dy;
		}
		this.template = `<g ast-id="${this.guid}" class="asteroids_path"><path d="${this.getPath()}"/></g>`;
		svg.insertAdjacentHTML('beforeend', this.template);
		this.node = svg.lastChild;
		this.setTransform();
	}
	getPath() {
		let path = '';
		for (let i = 0; i < 12; i++) {
			let vR = ((3 - Math.random()) / 3) * this.radius;

			if (path === '') path += `M${Math.sin(_pi30 * i) * vR},${Math.cos(_pi30 * i) * vR}`;
			else path += `L${Math.sin(_pi30 * i) * vR},${Math.cos(_pi30 * i) * vR}`;
		}
		path += 'z';
		return path;
	}
}

/**
 * PLAYER SHIP CHILD CLASS
 */
export class SHIP extends BOB {
	constructor(svg) {
		super(svg, 2000);
		this.lives = 3;
		this.level = 1;
		this.radius = 20;
		let h = svg.getAttribute('viewBox').split(' ')[3] * 1;
		let w = 1920;
		this.position.cx = w / 2;
		this.position.cy = h / 2;
		this.maxSpeed = 500;
		this.isShieldOn = false;
		this.template = `<g ast-id="${this.guid}" class="asteroids_path"><path d="${this.getPath()}"/><path class="asteroids_path asteroids_shield" d="M0,-${this.radius * 1.1}A${this.radius * 1.1},${this.radius * 1.1},0,1,1,-0.01,-${
			this.radius * 1.1
		}z"/></g>`;
		svg.insertAdjacentHTML('beforeend', this.template);
		this.node = svg.lastChild;
		this.setTransform();
	}
	getPath() {
		let path = `M0,-${this.radius}L${this.radius * 0.7},${this.radius * 0.7}A${this.radius},${this.radius},0,0,0,-${this.radius * 0.7},${this.radius * 0.7}z`;
		return path;
	}
	rotate(direction) {
		if (direction < 0) this.velocity.dr = -60;
		else if (direction > 0) this.velocity.dr = 60;
		else this.velocity.dr = 0;
	}
	thrust() {
		let rad = this.rotation / _degToRadians;

		this.velocity.dx += Math.sin(rad) * 7;
		this.velocity.dy += -Math.cos(rad) * 7;
		this.normaliseSpeed();
	}
	shield(isOn) {
		if (isOn === true && this.isShieldOn != isOn) {
			this.isShieldOn = isOn;
			let shieldPath = this.node.querySelector('.asteroids_shield');
			if (shieldPath != undefined) shieldPath.classList.add('asteroids_shield--active');
		} else if (this.isShieldOn != isOn) {
			this.isShieldOn = isOn;
			let shieldPath = this.node.querySelector('.asteroids_shield');
			if (shieldPath != undefined) shieldPath.classList.remove('asteroids_shield--active');
		}
	}
}

/**
 * MISSILE CHILD CLASS
 */
export class MISSILE extends BOB {
	constructor(svg, ship) {
		super(svg, ship.level * 500);

		let dx = Math.sin(ship.rotation / _degToRadians);
		let dy = -Math.cos(ship.rotation / _degToRadians);
		this.radius = 2;
		this.missileSpeed = 200;
		this.lifetime = 3000; //how long the item exists
		this.velocity.dr = 180; //degree of rotations per second
		this.velocity.dx = ship.velocity.dx + dx * this.missileSpeed;
		this.velocity.dy = ship.velocity.dy + dy * this.missileSpeed;
		this.position.cx = ship.position.cx + dx * ship.radius;
		this.position.cy = ship.position.cy + dy * ship.radius;
		this.template = `<g ast-id="${this.guid}" class="asteroids_path"><path d="${this.getPath()}"/></g>`;
		svg.insertAdjacentHTML('beforeend', this.template);
		this.node = svg.lastChild;
		this.setTransform();
	}
	getPath() {
		let path = `M0,-${this.radius}A${this.radius},${this.radius},0,1,1,-0.01,-${this.radius}z`;
		return path;
	}
}

/**
 * MISSILE CHILD CLASS
 */
export class EXPLOSION extends BOB {
	constructor(svg, bob) {
		super(svg, 10);
		let direction = Math.random() * _pi360;
		let speed = Math.random() * 40 + 40;
		this.velocity.dx = Math.sin(direction) * speed;
		this.velocity.dy = -Math.cos(direction) * speed;
		this.radius = 2;
		this.lifetime = 500; //how long the item exists
		this.position.cx = bob.position.cx;
		this.position.cy = bob.position.cy;
		this.template = `<g ast-id="${this.guid}" class="asteroids_path"><path class="asteroids_explosion--1" d="${this.getPath()}"/></g>`;
		svg.insertAdjacentHTML('beforeend', this.template);
		this.node = svg.lastChild;
		this.setTransform();
	}
	getPath() {
		let path = `M-1,-1H1V1H-1z`;
		return path;
	}
}
