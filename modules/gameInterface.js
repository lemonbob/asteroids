/** @format */
import { ASTEROID, SHIP, MISSILE, EXPLOSION } from './bob.js';

const _pi = Math.PI;
const _pi30 = _pi / 6;
const _pi45 = _pi * 0.25;
const _pi90 = _pi * 0.5;
const _pi270 = _pi * 1.5;
const _pi360 = _pi * 2;
const _degToRadians = 360 / _pi360;

const $collisionDetection = (svgNode, bob, bobMap, explosionMap) => {
	let collisionGuid;
	bobMap.forEach((v, guid) => {
		let dist = $getDistance(v, bob);

		if (dist * 1.1 < v.radius + bob.radius) {
			collisionGuid = guid;
			if (v instanceof ASTEROID && bob instanceof MISSILE) {
				v.lifetime = 0;
				$createExplosion(svgNode, v, explosionMap);
				if (v.size > 1) {
					let res1 = $getVectorsOfCollision(bob, v);

					//create two new asteroids and set drifting tangentially to the angle of explosion
					for (let i = 0; i < 2; i++) {
						let asteroid = new ASTEROID(svgNode, v.size - 1, v);
						let explosiveAngle = res1.angleOfContactToTarget;

						if (i === 0) {
							explosiveAngle += _pi90;
							asteroid.velocity.dx += (Math.sin(explosiveAngle) * 60000) / asteroid.mass;
							asteroid.velocity.dy += (-Math.cos(explosiveAngle) * 60000) / asteroid.mass;
						} else {
							explosiveAngle -= _pi90;
							asteroid.velocity.dx += (Math.sin(explosiveAngle) * 60000) / asteroid.mass;
							asteroid.velocity.dy += (-Math.cos(explosiveAngle) * 60000) / asteroid.mass;
						}
						asteroid.velocity.dx += res1.targetVector.dx;
						asteroid.velocity.dy += res1.targetVector.dy;
						asteroid.normaliseSpeed();
						bobMap.set(asteroid.guid, asteroid);
					}
				}
				bob.lifetime = 0;
				$createExplosion(svgNode, bob, explosionMap);
			} else if (v instanceof ASTEROID && bob instanceof SHIP) {
				if (bob.isShieldOn !== true) {
					bob.lifetime = 0;
					bob.lives--;
					$createExplosion(svgNode, bob, explosionMap);
				} else {
					let res1 = $getVectorsOfCollision(bob, v, false, dist);
					let res2 = $getVectorsOfCollision(v, bob, false, dist);

					bob.velocity.dx = res1.sourceVector.dx;
					bob.velocity.dy = res1.sourceVector.dy;
					v.velocity.dx = res1.targetVector.dx;
					v.velocity.dy = res1.targetVector.dy;

					v.velocity.dx += res2.sourceVector.dx;
					v.velocity.dy += res2.sourceVector.dy;
					bob.velocity.dx += res2.targetVector.dx;
					bob.velocity.dy += res2.targetVector.dy;

					v.normaliseSpeed();
					bob.normaliseSpeed();
				}
			}
		}
		//gravity
		/*if (v instanceof ASTEROID && bob instanceof SHIP) {
			let angle = $getAngle(v.position.cx, v.position.cy, bob.position.cx, bob.position.cy);
			let gravity = (v.mass * v.mass) / 200;
			dist = Math.max(dist, v.radius + bob.radius);
			bob.velocity.dx += (Math.sin(angle) * gravity) / (dist * dist);
			bob.velocity.dy += (-Math.cos(angle) * gravity) / (dist * dist);
		}*/
	});
	return collisionGuid;
};

const $createExplosion = (svgNode, bob, explosionMap) => {
	if (explosionMap != undefined) {
		for (let i = 0; i < 12; i++) {
			let explosion = new EXPLOSION(svgNode, bob);
			explosionMap.set(explosion.guid, explosion);
		}
	}
};

const $getAngle = (cx1, cy1, cx2, cy2) => {
	let dx = cx1 - cx2;
	let dy = cy1 - cy2;
	let angle = Math.atan(dx / dy);

	if (dx >= 0 && dy < 0) angle = 0 - angle;
	else if (dx >= 0 && dy >= 0) angle = _pi - angle;
	else if (dx < 0 && dy >= 0) angle = _pi - angle;
	else if (dx < 0 && dy < 0) angle = _pi360 - angle;
	return angle;
};

const $getSpeed = (dx, dy) => {
	let sqr = dx * dx + dy * dy;
	return sqr === 0 ? 0 : Math.sqrt(sqr);
};

const $getDistance = (bob1, bob2, dTime1 = 0, dTime2 = dTime1) => {
	let dx, dy;
	if (dTime1 === 0) {
		dx = bob1.position.cx - bob2.position.cx;
		dy = bob1.position.cy - bob2.position.cy;
	} else {
		dx = bob1.position.cx + bob1.velocity.dx * dTime1 - (bob2.position.cx + bob2.velocity.dx * dTime2);
		dy = bob1.position.cy + bob1.velocity.dy * dTime1 - (bob2.position.cy + bob2.velocity.dy * dTime2);
	}
	let dist = Math.sqrt(dx * dx + dy * dy);
	return dist;
};

/**
 * returns source and target result vectors
 * @param {Number} angleOfContactToTarget
 * @param {Number} angleOfTravelSource
 * @param {Number} speed
 * @returns {Object}
 */
const $getVectorsOfCollision = (bobSource, bobTarget, isCalculateMomentum = true, dist) => {
	let angleOfContactToTarget = $getAngle(bobSource.position.cx, bobSource.position.cy, bobTarget.position.cx, bobTarget.position.cy);
	let angleOfTravelSource = $getAngle(bobSource.velocity.dx, bobSource.velocity.dy, 0, 0);
	let sourceSpeed = $getSpeed(bobSource.velocity.dx, bobSource.velocity.dy);
	let modifiedAngleOfTravel = _pi360 - angleOfTravelSource;
	let ang = modifiedAngleOfTravel - (_pi90 - angleOfContactToTarget);
	let isMovingCloser = true;
	if (dist != undefined) {
		let distNext = $getDistance(bobSource, bobTarget, 0.0001);
		if (distNext >= dist) isMovingCloser = false;
	}
	let sourceVector = { dx: 0, dy: 0 };
	let targetVector = { dx: 0, dy: 0 };

	if (sourceSpeed !== 0 && isMovingCloser === true) {
		let s2 = Math.abs(Math.sin(ang) * sourceSpeed); //speed acting on collision
		let s3 = Math.abs(Math.cos(ang) * sourceSpeed); //speed retained in source

		sourceVector.dx = Math.sin(angleOfTravelSource + ang) * s3;
		sourceVector.dy = -Math.cos(angleOfTravelSource + ang) * s3;
		targetVector.dx = Math.sin(angleOfContactToTarget) * s2;
		targetVector.dy = Math.cos(angleOfContactToTarget) * s2;

		if (Math.sign(-Math.sin(angleOfContactToTarget)) !== Math.sign(targetVector.dx)) targetVector.dx *= -1;
		if (Math.sign(Math.cos(angleOfContactToTarget)) !== Math.sign(targetVector.dy)) targetVector.dy *= -1;

		let resultSourceAnglePlus = (angleOfContactToTarget + _pi90) % _pi360;
		let resultSourceAngleMinus = (angleOfContactToTarget + _pi270) % _pi360;
		let angleOfSourceResult =
			Math.min(Math.abs(resultSourceAnglePlus - angleOfTravelSource), Math.abs(resultSourceAngleMinus - angleOfTravelSource)) === Math.abs(resultSourceAnglePlus - angleOfTravelSource) ? resultSourceAnglePlus : resultSourceAngleMinus;

		if (Math.sign(sourceVector.dx) !== Math.sign(Math.sin(angleOfSourceResult))) sourceVector.dx *= -1;
		if (Math.sign(sourceVector.dy) !== Math.sign(-Math.cos(angleOfSourceResult))) sourceVector.dy *= -1;

		if (isCalculateMomentum === true) {
			targetVector.dx = targetVector.dx * (bobSource.mass / bobTarget.mass);
			targetVector.dy = targetVector.dy * (bobSource.mass / bobTarget.mass);
			sourceVector.dx = sourceVector.dx * (bobTarget.mass / bobSource.mass);
			sourceVector.dy = sourceVector.dy * (bobTarget.mass / bobSource.mass);
		}
	}
	return { targetVector, sourceVector, angleOfContactToTarget, angleOfTravelSource };
};

export { $collisionDetection, $getDistance };
