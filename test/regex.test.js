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
			assert(a.deterministic);
			assert.equal(a.singleton, 'abc');
			assert.equal(a.initial.noOfTransitions, 0)
			assert(!a.initial.accept);			
			// assert(a != null);
		
		});
		it('match any char', () => {
			// assert(a != null);
			let a = new Regexp('.').toAutomaton();
			
			let s = a.initial;
			assert.equal(a.singleton, null);
			assert.equal(s.noOfTransitions, 1);
			assert.equal(s.trans[0].min, 0);
			assert.equal(s.trans[0].max, 0xffff);

			assert(s.trans[0].to.accept);
		});
		it ('match char range', () => {
			let a = new Regexp('[a-z]').toAutomaton();
			// console.log(a.initial);
			assert.equal(a.singleton, null);
			assert.equal(a.deterministic, true);
			assert.equal(a.noOfStates(), 2);
			let s = a.initial;
			assert.equal(s.noOfTransitions, 1);
			assert.equal(s.trans[0].min, 'a'.charCodeAt(0));
			assert.equal(s.trans[0].max, 'z'.charCodeAt(0));
			assert(s.trans[0].to.accept);
		});

		it ('match char class', () => {
			// let a = new Regexp['[abc]'].toAutomaton();

			let a = new Regexp('[atz]').toAutomaton();
			assert.equal(a.noOfStates(), 2);
			assert.equal(a.deterministic, true);
			assert.equal(a.initial.noOfTransitions, 3);
			let s = a.initial;
			assert.equal(s.trans[0].to, s.trans[1].to);
			assert.equal(s.trans[0].to, s.trans[2].to);
			assert.equal(s.trans[0].to.accept, true);
		});
	});
});