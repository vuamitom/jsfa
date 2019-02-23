const assert = require('assert');
const Automaton = require('../src/automaton.js');
const helper = require('./helper');
const equalArrays = helper.equalArrays;


function makeRepeat(c) {
    let a1 = Automaton.makeChar('c').repeat(1);
    a1.minimize();
    return a1;
}

describe('Automaton', () => {
    describe('#getStartPoints', () => {
        it ('repeat min', () => {
            let a = Automaton.makeChar('c').repeat(1);
            let points = a.getStartPoints();
            assert(equalArrays(points, [0, 99, 100]));
        })
        it ('concatenate', () => {
            let a = Automaton.concatenate([Automaton.makeChar('b'), makeRepeat('c')]);
            let points = a.getStartPoints();
            assert(equalArrays(points, [0, 98, 99, 100]));
        })
    })

    describe('#static concatenate', () => {
        it ('basic', () => {
            let a = Automaton.concatenate([Automaton.makeChar('b'), makeRepeat('c')]);
            assert.equal(a.noOfStates(), 3);
            console.log(a);
            console.log(a.initial)
            assert.equal(a.deterministic, false);
            let s = a.initial;
            assert.equal(s.noOfTransitions, 1);
            let t = s.trans[0];
            assert(t.min === 98 && t.max === 98);
            s = t.to;
            assert.equal(s.accept, false);
            t = s.trans[0];
            assert(t.min === 99 && t.max === 99);
            assert.equal(t.to.accept, true);
            s = t.to;
            t = s.trans[0];
            assert.equal(t.to, s);
        })
    })
    describe('#determinize', () => {
        it ('repeat min', () => {
            let a = Automaton.makeChar('c').repeat(1),
                s = a.initial;

            assert.equal(a.noOfStates(), 3);
            assert.equal(a.deterministic, false);
            assert.equal(s.noOfTransitions, 1);
            assert.equal(s.trans[0].min, 'c'.codePointAt(0))
            assert.equal(s.trans[0].max, 'c'.codePointAt(0))
            a.determinize();
            s = a.initial;
            assert.equal(a.noOfStates(), 3);
            assert.equal(s.trans[0].min, 'c'.codePointAt(0))
            assert.equal(s.trans[0].max, 'c'.codePointAt(0))
            assert.equal(a.deterministic, true);
        });

        it('concatenate', () => {
            let a = Automaton.concatenate([Automaton.makeChar('b'), makeRepeat('c')]);
            a.determinize();
            assert.equal(a.deterministic, true);
            assert.equal(a.noOfStates(), 3);

        })
    })
    describe('#totalize', () => {
        it ('repeat min', () => {
            let a = Automaton.makeChar('c').repeat(1);
            a.determinize();
            a.totalize();
            let s = a.initial;
            assert.equal(s.noOfTransitions, 3);
            let starts = s.trans.map(t => t.min).sort((a, b) => a - b);
            assert(equalArrays(starts, [0, 99, 100]));
            for (let t of s.trans) {
                if (t.min === 0 || t.min === 100) {
                    assert.equal(t.to.accept, false);
                    assert.equal(t.to.noOfTransitions, 1);
                }
                else if (t.min === 99) {
                    assert.equal(t.to.accept, true);
                    assert.equal(t.to.noOfTransitions, 3);
                }

            }

        })
        it('concatenate', () => {
            let a = Automaton.concatenate([Automaton.makeChar('b'), makeRepeat('c')]);
            a.determinize();
            a.totalize();
            assert.equal(a.deterministic, true);
            assert.equal(a.noOfStates(), 4);

        })
    })
    describe('#minimize', () => {
        it('repeat min', () => {
            let a = Automaton.makeChar('c').repeat(1);
            a.minimize();
            assert.equal(a.noOfTransitions(), 2);
            assert.equal(a.noOfStates(), 2);
            let s = a.initial;
            assert.equal(s.noOfTransitions, 1);
            let t = s.trans[0];
            assert.equal(s.accept, false)
            assert.equal(t.min, 99)
            assert.equal(t.max, 99)
            assert.equal(t.to.accept, true);
        })
    })
})