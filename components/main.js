/** @format */

import { IMPRESS } from '../src/impress_dev.js';
import { ASTROIDSHEADER } from './header.js';
import { ASTROIDSTITLE } from './title.js';
import { ASTEROID, SHIP, MISSILE, EXPLOSION } from '../modules/bob.js';
import { $collisionDetection, $getDistance } from '../modules/gameInterface.js';

let template = /*html*/ `
<link href="css/app.css" rel="stylesheet" type="text/css">
<asteroids-header class="asteroids-header" i-event='{"click":"this.test"}' i-props='{"score":"this.data.score", "hiScore":"this.data.hiScore", "lives":"this.data.ship.lives", "level":"this.data.ship.level"}'></asteroids-header>
<i-if i-prop:condition='{this.data.isGameEnded}'>
	<asteroids-title></asteroids-title>
</i-if>
<svg id="game" viewBox="{this.data.viewBox}" preserveAspectRatio="none"></svg>
`;

class IAPP extends IMPRESS {
	constructor(node) {
		super(node);
		this.name = 'i-app';
		this.template = template;

		this.data = {
			startingAsteroidCount: 4,
			bobs: new Map(),
			asteroids: new Map(),
			missiles: new Map(),
			explosions: new Map(),
			previousTimeStamp: undefined,
			aspectRatio: 1920 / 1080,
			viewBox: '0 0 1920 1080',
			isInit: false,
			isGameEnded: true,
			rotateLeftFlag: false,
			rotateRightFlag: false,
			thrustFlag: false,
			missileFlag: false,
			missileFlagReset: false,
			titleClass: '',
			score: 0,
			hiScore: '00',
			aspectRatio: 1,
			ship: { lives: 3, level: 1 },
			sfx: new Map(),
			beatState: true,
			beatSpeed: 1000,
			beatTimeStamp: 0,
			testArray: [1,2,3]
		};
		//this.iDefine('isDebug', true);
	}

	test() {
		console.log('SLOT TOGGLE');
		this.iSetState(['data', 'isGameEnded'], !this.data.isGameEnded);
		this.iSetState(['data', 'score'], this.data.score + 1);
	}
	test2() {
		console.log('BUTTON CLICK');
		this.iSetState(['data', 'score'], this.data.score + 1);
	}

	//START GAME
	afterMount() {
		this.svgNode = this._impressInternal.iNode.querySelector('#game');

		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				if (entry.contentBoxSize) {
					this.data.aspectRatio = entry.contentBoxSize[0].inlineSize / entry.contentBoxSize[0].blockSize;
					if (isFinite(this.data.aspectRatio) === false) this.data.aspectRatio = 0.7;
					this.iSetState('this.data.viewBox', `0 0 1920 ${Math.round(1920 / this.data.aspectRatio)}`);
				}
			}
			if (this.data.isInit === false) {
				this.data.isInit = true;
				this.createNewAsteroids();
				requestAnimationFrame(() => this.gameLoop());
			}
		});
		resizeObserver.observe(this.svgNode);
		document.addEventListener('keydown', (e) => this.keyboardcontroller(e));
		document.addEventListener('keyup', (e) => this.keyboardcontroller(e));

		//audio files
		this.data.sfx.set('fire', new Audio('sfx/fire.wav'));
		this.data.sfx.set('beat-true', new Audio('sfx/beat1.wav'));
		this.data.sfx.set('beat-false', new Audio('sfx/beat2.wav'));
		this.data.sfx.set('explosion', new Audio('sfx/explode2.wav'));
		this.data.sfx.get('fire').volume = 0.25;
		this.data.sfx.get('explosion').volume = 0.25;
	}

	keyboardcontroller(e) {
		if (this.data.isGameEnded === false) {
			if (e.type === 'keyup') {
				if (e.key === 'z') this.data.rotateLeftFlag = false;
				else if (e.key === 'x') this.data.rotateRightFlag = false;
				else if (e.key === 'k') this.data.thrustFlag = false;
				else if (e.code === 'Space') this.data.ship.shield(false);
				else if (e.key === 'l') this.data.missileFlagReset = false;
			} else if (e.type === 'keydown') {
				if (e.key === 'z') this.data.rotateLeftFlag = true;
				else if (e.key === 'x') this.data.rotateRightFlag = true;
				else if (e.key === 'k') this.data.thrustFlag = true;
				else if (e.code === 'Space') this.data.ship.shield(true);
				else if (e.key === 'l' && this.data.missileFlagReset === false) {
					this.data.missileFlag = true;
					this.data.missileFlagReset = true;
				}
			}
		} else if (e.type === 'keyup' && e.key.toLowerCase() === 's') {
			this.startNewGame();
		}
	}

	startNewGame() {
		this.data.ship = new SHIP(this.svgNode);
		this.data.bobs.set(this.data.ship.guid, this.data.ship);
		this.data.thrustFlag = false;
		this.data.missileFlag = false;
		this.data.rotateLeftFlag = false;
		this.data.rotateRightFlag = false;
		this.iSetState('this.data.isGameEnded', false);
		this.iSetState('this.data.score', 0);
		this.iSetState('this.data.ship');
		this.createNewAsteroids();		
	}

	createNewAsteroids(count = this.data.startingAsteroidCount) {
		this.data.asteroids.forEach((v) => v.destroy());
		this.data.missiles.forEach((v) => v.destroy());
		this.data.asteroids.clear();
		this.data.missiles.clear();

		while (this.data.asteroids.size < count) {
			let asteroid = new ASTEROID(this.svgNode, 4, undefined, true);
			this.data.asteroids.set(asteroid.guid, asteroid);
			if (this.data.ship.template != undefined) {
				if ($getDistance(this.data.ship, asteroid) < 300) {
					asteroid.destroy();
					this.data.asteroids.delete(asteroid.guid);
				}
			}
		}
		this.data.beatSpeed = this.data.asteroids.size * 260 + 200;
	}

	drawGameElements(timeStamp, elapsedTime, gameElements, collisionTestElements) {
		gameElements.forEach((v, guid) => {
			if (v.timeStamp == undefined) v.timeStamp = timeStamp;
			if (v.lifetime === 0 && v.score != undefined) {
				if (v instanceof ASTEROID) this.data.beatSpeed = Math.max(this.data.beatSpeed - v.size * 10, 200);

				this.iSetState('this.data.score', this.data.score + v.score);
				if (typeof this.data.hiScore !== 'number') this.iSetState('this.data.hiScore', this.data.score);
				else if (this.data.score > this.data.hiScore) this.iSetState('this.data.hiScore', this.data.score);
			}
			v.move(timeStamp, elapsedTime, this.data.aspectRatio);
			v.setTransform();
			let isCollision;
			if (collisionTestElements != undefined) {
				isCollision = $collisionDetection(this.svgNode, v, collisionTestElements, this.data.explosions);
			}
			if (v.lifetime != undefined && timeStamp - v.timeStamp > v.lifetime) {
				if (isCollision != undefined) {
					this.data.sfx.get('explosion').currentTime = 0;
					this.data.sfx.get('explosion').play();
				}

				if (v instanceof SHIP) this.iSetState('this.data.isGameEnded', true);
				v.destroy();
				gameElements.delete(guid);
			}
		});
	}

	/**
	 * Master request animation frame game loop
	 * @param {Number} timeStamp
	 */
	gameLoop(timeStamp) {
		if (this.data.previousTimeStamp != undefined) {
			let elapsedTime = (timeStamp - this.data.previousTimeStamp) / 1000;

			if (this.data.isGameEnded === false) {
				if (this.data.rotateLeftFlag === true) this.data.ship.rotate(-1);
				else if (this.data.rotateRightFlag === true) this.data.ship.rotate(1);
				else this.data.ship.rotate(0);
				if (this.data.thrustFlag === true) this.data.ship.thrust();
				if (this.data.missileFlag === true) {
					this.data.missileFlag = false;
					//add a new missile if the shield is not on
					if (this.data.ship.isShieldOn !== true) {
						this.data.sfx.get('fire').currentTime = 0;
						this.data.sfx.get('fire').play();
						let missile = new MISSILE(this.svgNode, this.data.ship, timeStamp);
						this.data.missiles.set(missile.guid, missile);
					}
				}
			}
			this.drawGameElements(timeStamp, elapsedTime, this.data.bobs, this.data.asteroids);
			this.drawGameElements(timeStamp, elapsedTime, this.data.asteroids);
			this.drawGameElements(timeStamp, elapsedTime, this.data.missiles, this.data.asteroids);
			this.drawGameElements(timeStamp, elapsedTime, this.data.explosions);
			if (this.data.asteroids.size === 0 && this.data.isGameEnded === false) {
				this.data.ship.level++;
				this.iSetState('this.data.ship.level');
				this.createNewAsteroids(this.data.startingAsteroidCount + Math.round(this.data.ship.level * 0.3));
			}
			if (this.data.isGameEnded === false) {
				if (timeStamp - this.data.beatTimeStamp > this.data.beatSpeed) {
					if (this.data.isGameEnded === false) {
						this.data.sfx.get(`beat-${this.data.beatState}`).play();
						this.data.beatState = !this.data.beatState;
					}
					this.data.beatTimeStamp = timeStamp;
				}
			}
		}

		this.data.previousTimeStamp = timeStamp;
		requestAnimationFrame((timeStamp) => this.gameLoop(timeStamp));
	}
}

IMPRESS.register(IAPP);
