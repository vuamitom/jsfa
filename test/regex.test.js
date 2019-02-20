const assert = require('assert');
const jsfa = require('../index.js');
const Regexp = jsfa.Regexp;

describe('Regexp', () => {
	describe('#constructor()', () => {
		it('should parse simple regex str', () => {			
			let r = new Regexp(".{1}");
			assert.equal(r.toString(), '(.){1,1}');
			r = new Regexp('abc+d');
			assert.equal(r.toString(), 'ab(c){1,}d');
			r = new Regexp('tâm[0-9]');
			assert.equal(r.toString(), 'tâm[0-9]');
			r = new Regexp('[tâm]');
			assert.equal(r.toString(), '((t|â)|m)');
			r = new Regexp('[abc0-9]');
			assert.equal(r.toString(), '(((a|b)|c)|[0-9])');
			r = new Regexp('ab|xy|zt');
			assert.equal(r.toString(), '(ab|(xy|zt))');
		});
	});
	describe('#toAutomaton()', () => {
		it('basic cases', () => {
			
			let a = new Regexp('a').toAutomaton();

			a = new Regexp('abc').toAutomaton();
			// assert(a != null);
			a = new Regexp('.').toAutomaton();
			// assert(a != null);
			console.log(a);
		});
	});
});