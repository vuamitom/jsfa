const assert = require('assert');
const RunAutomaton = require('../index.js').RunAutomaton;
const Regexp = require('../index.js').Regexp;
// const helper = require('./helper');

describe('RunAutomaton', () => {
   describe('#run', () => {
       it('basic', () => {
           let ra = new RunAutomaton(new Regexp('abc+d').toAutomaton());
           assert(ra.run('abccccd'));
           assert(!ra.run('abd'));
           assert(ra.run('abcd'));

           ra = new RunAutomaton(new Regexp('abc+d?').toAutomaton());
           assert(ra.run('abc'));
           assert(ra.run('abccccd'));
           assert(ra.run('abcd'));
           assert(ra.run('abcccc'));
           assert(!ra.run('abd'));

           ra = new RunAutomaton(new Regexp('ab|cd').toAutomaton());
           assert(ra.run('ab'));
           assert(ra.run('cd'));
           assert(!ra.run('ac'));

           ra = new RunAutomaton(new Regexp('a[b-d]x').toAutomaton());
           assert(ra.run('acx'))
           assert(ra.run('adx'))

           ra = new RunAutomaton(new Regexp('a[b-d]+x').toAutomaton());
           assert(ra.run('acdbx'))

           ra = new RunAutomaton(new Regexp('a.+x').toAutomaton());
           assert(ra.run('acdfsdfsxx'))
           assert(ra.run('adx'))

       });
   });
   describe('#matcher', () => {

       it('find', () => {
           let a = new Regexp('abc+d?').toAutomaton(),
               ra = new RunAutomaton(a),
               s = 'abck',
               matcher = ra.matcher(s);
           assert(matcher.find());
           assert.equal(s.substring(matcher.start(), matcher.end()), 'abc');
           s = 'abc abccccd abck abz abd abcd';
           matcher = ra.matcher(s);
           let res = [];
           while (matcher.find()) {
                res.push(s.substring(matcher.start(), matcher.end()));
           }
           let x = 0;
           // console.log(res)
           for (let m of ['abc', 'abccccd', 'abc', 'abcd']) {
               assert.equal(res[x++], m)
           }
       });


   })
});