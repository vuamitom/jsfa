const Struct = require('./struct.js');
const MIN_CHAR = Struct.MIN_CHAR;
const MAX_CHAR = Struct.MAX_CHAR;

class Matcher {
    constructor(ra, s) {
        this.automaton = ra;
        this.chars = s;
        this.reset();
    }

    /**
     * Find the next matching subsequence of the input.
     * <br>
     * This also updates the values for the {@code start}, {@code end}, and
     * {@code group} methods.
     *
     * @return {@code true} if there is a matching subsequence.
     */
    find() {
        let begin;
        switch (this.matchStart) {
            case -2: return false;
            case -1: begin = 0; break;
            default:
                begin = this.matchEnd;
                if (begin === this.matchStart) {
                    begin++;
                    if (begin > this.chars.length) {
                        this.matchStart = this.matchEnd = -2;
                        return false;
                    }
                }
        }

        let ms, me;
        if (this.automaton.isAccept(this.automaton.initial)) {
            ms = me = begin;
        }
        else {
            ms = me = -1;
        }
        while (begin < this.chars.length) {
            let p = this.automaton.initial;
            for (let i = begin; i < this.chars.length; i++) {
                // console.log('idx: ', i, 'char ', this.chars[i])
                // console.log('cp', this.chars.codePointAt(i));
                let newState = this.automaton.step(p, this.chars.codePointAt(i));
                // console.log('1')
                if (newState === null || newState === undefined) break;
                else if(this.automaton.isAccept(newState)) {
                    ms = begin;
                    me = i + 1;
                }
                p = newState;
                // console.log('2')
            }
            if (ms !== -1) {
                this.matchStart = ms;
                this.matchEnd = me;
                return true;
            }
            begin += 1;
        }
        if (ms !== -1) {
            this.matchStart = ms;
            this.matchEnd = me;
            return true;
        }
        else {
            this.matchStart = this.matchEnd = -2;
            return false;
        }
    }

    _matchGood() {
        if (this.matchStart < 0 || this.matchEnd < 0)
            throw 'There was no available match';
    }

    start() {
        this._matchGood();
        return this.matchStart;
    }

    end() {
        this._matchGood();
        return this.matchEnd;
    }

    reset() {
        this.matchStart = this.matchEnd = -1;
    }
}

class RunAutomaton {
    constructor(a, tableize = false) {
        a.determinize();
        this.points = a.getStartPoints();
        let states = a.states();
        a.setStateNumbers(states);
        this.initial = a.initial.number;
        this.size = states.size;
        this.accept = new Array(this.size);
        this.transitions = new Array(this.size * this.points.length);
        for (let s of states) {
            this.accept[s.number] = s.accept;
            for (let c = 0; c < this.points.length; c++) {
                let q = s.step(this.points[c]);
                if (q) {
                    this.transitions[s.number * this.points.length + c] = q.number;
                }
            }
        }
        if (tableize) {
            this.classmap = new Array(MAX_CHAR - MIN_CHAR + 1);
            let i = 0;
            for (let j = 0; j < this.classmap.length; j++) {
                if (i + 1 < this.points.length && j === this.points[i + 1])
                    i ++;
                this.classmap[j] = i;
            }
        }

    }

    isAccept(stateNo) {
        return this.accept[stateNo];
    }

    /**
     * Gets character class of given char.
     */
    getCharClass(c) {
        // c = c.codePointAt(0);
        if (this.classmap) {
            return this.classmap[c];
        }
        else {
            // do a binary search

            let a = 0, b = this.points.length;
            while (a < b - 1) {
                let m = (a + b) >>> 1;
                if (this.points[m] < c) {
                    a = m;
                }
                else if (this.points[m] > c){
                    b = m;
                }
                else
                    return m;
            }
            return a;
        }
    }

    /**
     * Returns the state obtained by reading the given char from the given
     * state. Returns -1 if not obtaining any such state. (If the original
     * <code>Automaton</code> had no dead states, -1 is returned here if and
     * only if a dead state is entered in an equivalent automaton with a total
     * transition function.)
     */
    step(stateNo, c) {
        return this.transitions[stateNo * this.points.length + this.getCharClass(c)];
    }

    /**
     * Returns true if the given string is accepted by this automaton.
     */
    run(s) {
        let p = this.initial;
        for (let i = 0; i < s.length; i++) {
            p = this.step(p, s.codePointAt(i));
            if (p === null || p === undefined)
                return false;
        }
        return this.accept[p];
    }

    /**
     * Creates a new automaton matcher for the given input.
     * @param s the CharSequence to search
     * @return Matcher new automaton matcher for the given input
     */
    matcher(s) {
        return new Matcher(this, s);
    }
}

module.exports = RunAutomaton;