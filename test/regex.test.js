const assert = require('assert');
const jsfa = require('../index.js');
const Regexp = jsfa.Regexp;

describe('Regexp', () => {
	describe('#constructor()', () => {
		it('should parse simple regex str', () => {			
			console.error(Regexp);
			console.error(jsfa);
			let r = new Regexp("xyz");

		});
	});
});