/** @format */

import { IMPRESS } from '../src/impress_dev.js';

let template = /*html*/ `
<link href="css/app.css" rel="stylesheet" type="text/css">
<h1>ASTEROIDS</h1>
<h2>Enter bitcoin or</h2>
<h2>press S to start</h2>
<h3>Z left - X right - K thrust - L fire - Space shield</h3>
<p>©2023 polymathic design</p>
`;

export class ASTROIDSTITLE extends IMPRESS {
	constructor(node) {
		super(node);
		this.name = 'asteroids-title';
		this.template = template;		
	}		
}

IMPRESS.register(ASTROIDSTITLE);