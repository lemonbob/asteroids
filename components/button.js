/** @format */

import { IMPRESS } from '../src/impress_dev.js';

let template = /*html*/ `
<link href="css/app.css" rel="stylesheet" type="text/css">
<button style="color:#fff"> COMPONENT IN SLOT BUTTON {this.props.score}</button>
`;

export class BUTTON extends IMPRESS {
	constructor(node) {
		super(node);
		this.name = 'my-button';
		this.template = template;		
	}		
}

IMPRESS.register(BUTTON);