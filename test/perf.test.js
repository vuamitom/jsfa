const assert = require('assert');
const jsfa = require('../index.js');
// const Regexp = jsfa.Regexp;
// function time(fn, count,)


describe('Performance Test', () => {
    it ('simple', () => {
       let p = '(kho[aả]n vay)|(vay v[oố]n)',
           times = 1000,
           start,
           dur,
           reg,
           count,
           s = [];
       for (let i = 0; i < 10; i++) {
           let l = Math.round(Math.random()  * 1000);
           let a = [];
           for (let x = 0; x < l; x++) {
               a.push(String.fromCharCode(Math.floor(Math.random()* 256)));
           }
           s.push(a.join(''));
       }


       console.log('====native regex======');

       start = new Date().getTime();
       reg = new RegExp(p, 'g');
       for (let i = 0; i < times; i++) {
            let ar;
            // reg.lastIndex = 0;
           // count = 0;
           for (let str of s)
                while ((ar = reg.exec(str)) !== null);
                // count++;
            // assert.equal(count, 4);
       }
       dur = new Date().getTime() - start;
       console.log('duration: ' + dur + ' ms');

       console.log('====dk.brics.automaton regex======');
        start = new Date().getTime();
        reg = new jsfa.Regexp(p);
        for (let i = 0; i < times; i++) {
            let ar;
            // count = 0;
            // reg.reset();
            for (let str of s)
                while ((ar = reg.exec(str)) !== null);
                // count++;
            // console.log(ar, count);
            // assert.equal(count, 4);
        }
        dur = new Date().getTime() - start;
        console.log('duration: ' + dur + ' ms');
    });

});