const assert = require('assert');
const RunAutomaton = require('../index.js').RunAutomaton;
const Regexp = require('../index.js').Regexp;

describe('RunAutomaton', () => {
   describe('#run', () => {
       it('basic', () => {
           let ra = new RunAutomaton(new Regexp('abc+d').toAutomaton());
           assert(ra.run('abccccd'));
           assert(!ra.run('abd'));
       })
   })
});