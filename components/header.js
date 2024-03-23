/** @format */

import { IMPRESS } from '../src/impress_dev.js';

let template = /*html*/ `
<link href="css/app.css" rel="stylesheet" type="text/css">
<div>{this.props.score}</div>
<div class="hi-score">{this.props.hiScore}</div>
<div>Level {this.props.level}</div>
`;

export class ASTROIDSHEADER extends IMPRESS {
	constructor(node) {
		super(node);
		this.name = 'asteroids-header';
		this.template = template;

		this.data = {};		
	}		
}

IMPRESS.register(ASTROIDSHEADER);