const StateSet = require('./struct.js').StateSet;
let nextStateId = 0;

const MIN_CHAR = 0;
const MAX_CHAR = 0xffff;


class Transition {
	constructor(min, max, to) {
		if (!min || min.length > 1) {
			throw 'expect parameter to be single character';
		}
		max = max && max > min? max: min;		
		this.max = max; 
		this.min = min;
		this.hashCode = min*2 + max*3;
		this.to = to;
	}	

	equals(other) {
		return this.min === other.min
			&& this.max === other.max
			&& this.to === other.to;
	}

	clone() {
		return new Transition(this.min, this.max, this.to);
	} 	
}

function sortState(byToFirst){
	const sortTo = (a, b) => {
		if (a.to !== b.to) {
			if (!a.to) return -1;
			if (!b.to) return 1;
			if (a.to.number < b.to.number) return -1;
			if (a.to.number > b.to.number) return 1;
		}
		return 0;
	}
	return (a, b) => {
		if (byToFirst) {
			let r = sortTo(a, b);
			if (r !== 0) return r;
		}
		if (a.min < b.min) return -1;
		if (a.min > b.min) return 1;
		if (a.max > b.max) return -1;
		if (a.max < b.max) return 1;
		if (!byToFirst) {
			return sortTo(a, b);
		}
		return 0;
	};
}

class State {
	constructor() {
		this.id = nextStateId ++;
		this.resetTransitions();
		this.accept = false;
	}

	addTran(t) {
		if (this.transCode.has(t.hashCode)) {
			console.error('State: transition with duplicate char range');
		}	
		else {	
			this.trans.add(t);
		}
	}

	resetTransitions() {
		this.transCode = new Set();
		this.trans = [];
	}

	get noOfTransitions() {
		return this.trans.length;
	}

	step(c, deterministic = true) {
		let dest = [];
		for (let t of this.trans) {
			if (t.min <= c && c <= t.max) {
				if (deterministic)
					return t.to;
				else
					dest.push(t.to);
			}
		}
		return deterministic? null: dest;
	}

	addEpsilon(to) {
		if (to.accept) {
			this.accept = true;
		}
		to.trans.forEach(t => this.addTran(t));
	}

	getTransSortedByToFirst() {
		let ar = [...this.trans];
		ar.sort(sortState(true));
		return ar;
	}
}

class Automaton {

	constructor() {
		this.initial = new State();
		this.deterministic = true;
		this.singleton = null;
		this.hash_code = 0;
	}

	get hashCode() {
		if (this.hash_code === 0) 
			this.minimize();
		return this.hash_code;
	}

	noOfStates() {
		if (this.isSingleton()) {
			return this.singleton.length + 1;
		}
		return this.states().size;
	}

	noOfTransitions() {
		if (this.isSingleton()) {
			return this.singleton.length;
		}
		let c = 0;
		for (let s of this.states()) {
			c += s.noOfTransitions;
		}
		return c;
	}

	// func to iterate over all state
	// follow the `reduce` api
	_visit(fn, startVal) {
		let visited = new Set(),
			worklist = [],
			s = 0;
		visited.add(this.initial);
		worklist.push(this.initial);
		while (s < worklist.length) {
			let state = worklist[s];
			if (fn) {
				startVal = fn(startVal, state);
			}
			for (let t of state.trans) {				
				if (!visited.has(t.to)) {
					visited.add(t.to);
					worklist.add(t.to);
				}
			}
			s ++;
		}
		return fn !== undefined? startVal: visited;
	}

	states() {
		this.expandSingleton();
		return this._visit();
	}

	expandSingleton() {
		if (this.isSingleton()) {
			let p = new State();
			this.initial = p;
			for (let i = 0; i < this.singleton.length; i++) {
				let q = new State();
				q.number = i;
				p.addTran(new Transition(this.singleton[i], null, q));
				p = q;
			}
			p.accept = true;
			this.deterministic = true;
			this.singleton = null;
		}		
	}

	isSingleton() {
		return this.singleton !== undefined && this.singleton !== null;
	}

	recomputeHashCode() {
		this.hash_code = this.noOfStates() * 3 + this.noOfTransitions() * 2;
		this.hash_code = this.hash_code === 0? 1: this.hash_code;		
	}

	equals(other) {
		if (this === other) return true;
		if (this.isSingleton() && other.isSingleton())
			return this.singleton === other.singleton;
		return this.hashCode === other.hashCode
			&& this.subsetOf(other)
			&& other.subsetOf(this);
	}

	// check if this is a subset of other
	subsetOf(other) {
		if (this === other) return true;
		if (this.isSingleton()) {
			if (other.isSingleton()) {
				return this.singleton === other.singleton;
			}
			return other.run(this.singleton);
		}
		other.determinize();
		// TODO:
	}

	// Determinizes the given automaton using the given set of initial states. 
	determinize(initialSet = null) {
		if (this.deterministic || this.isSingleton())
			return;

		if (initialSet === null) {
			initialSet = new StateSet();
			initialSet.add(this.initial);
		}

		let points = this.getStartPoints(),
			worklist = [],
			newstate = {},
			s = 0;

		worklist.push(initialSet);
		this.initial = new State();
		newstate[initialSet.hashCode] = this.initial;

		while (s < worklist.length) {
			let stateSet = worklist[s],
				r = newstate[stateSet.hashCode];
			for (let state of stateSet.states) {
				if (state.accept) {
					r.accept = true;
					break;
				}
			}
			for (let n = 0; n < points.length; n++) {
				let p = new StateSet();
				for (let state of stateSet.states) {
					for (let t of state.trans) {
						if (t.min <= points[n] && t.max >= points[n]) {
							p.add(t.to);
						}
					}
				}
				if (p.size > 0) {
					let state = newstate[p.hashCode];
					if (!state) {
						worklist.push(p);
						state = new State();
						newstate[p.hashCode] = state;
					}
					let min = points[n], max;
					if (n + 1 < points.length) {
						max = points[n+1] - 1;
					}
					else {
						max = MAX_CHAR;
					}
					r.addTran(new Transition(min, max, state));
				}
			}
			s+=1;
		}

		this.deterministic = true;
		this.removeDeadTransitions();
	}

	clearHashCode() {
		this.hash_code = 0;
	}

	// Returns the set of reachable accept states. 
	getAcceptStates() {
		this.expandSingleton();
		let accepts = new Set();
		this._visit((container, state) => {
			if (state.accept) {
				container.add(state);
			}
		}, accepts);
		return accepts;
	}

	_getLiveStates(states) {
		let map = {};
		for (let s of states) {
			map[s.id] = new Set();
		}
		for (let s of states) {
			for (let t of s.trans) {
				map[t.to.id].add(s);
			}
		}
		let live = this.getAcceptStates();
		let s = 0, worklist = [];
		while (s < worklist.length) {
			let st = worklist[s];
			for (let p of map[st.id]) {
				if (!live.has(p)) {
					live.add(p);
					worklist.push(p);
				}
			}
		}
		return live;
	}

	/*
	* Removes transitions to dead states and calls {@link #reduce()} and {@link #clearHashCode()}.
	* (A state is "dead" if no accept state is reachable from it.)
	*/
	removeDeadTransitions() {
		this.clearHashCode();
		if (this.isSingleton()) {
			return;
		}	
		let states = this.states(),
			live = this._getLiveStates();
		for (let s of states) {
			let trans = s.trans;
			s.resetTransitions();
			for (let t of trans) {
				if (live.has(t.to)) {
					s.addTran(t);
				}
			}
		}
		this.reduce();
	}

	/** 
	 * Reduces this automaton.
	 * An automaton is "reduced" by combining overlapping and adjacent edge intervals with same destination. 
	 */
	reduce() {
		if (this.isSingleton()) {
			return;
		}
		let states = this.states();
		this._setStateNumbers(states);
		for (let s of states) {
			let trans = s.getTransSortedByToFirst();
			s.resetTransitions();
			let p = null, min = -1, max = -1;
			for (let t of trans) {
				if (p === t.to) {
					if (t.min <= max + 1) {
						if (t.max > max)
							max = t.max;
					}
					else {
						if (p) {
							s.addTran(new Transition(min, max, p));
						}
						min = t.min;
						max = t.max;
					}
				}
				else {
					if (p) {
						s.addTran(new Transition(min, max, p));
					}
					p = t.to;
					min = t.min;
					max = t.max;
				}
			}
			if (p) {
				s.addTran(new Transition(min, max, p));
			}
		}
	 	this.clearHashCode();
	}

	/** 
	 * Assigns consecutive numbers to the given states. 
	 */
	_setStateNumbers(states) {
		let n = 0;
		for (let s of states) {
			s.number = n++;
		}
	}

	getStartPoints() {
		let pointset = new Set();
		pointset.add(MIN_CHAR);
		for (let s of this.states()) {
			for (let t of s.trans) {
				pointset.add(t.min);
				if (t.max < MAX_CHAR){
					pointset.add(t.max + 1)
				}
			}
		}
		let r = [...pointset];
		r.sort();
		return r;
	}


	minimize() {

	}

	// Returns true if the given string is accepted by the automaton.
	run() {

	}

	static concatenate(ls) {

	}

	static union(ls) {
		ls = arguments.length > 1? arguments: ls;
		for (let a of ls) {

		}
	}

	// make default structure
	static makeEmpty() {
		let a = new Automaton();
		a.singleton = '';
		return a;
	}

	static makeAnyChar() {
		return Automaton.makeCharRange(MIN_CHAR, MAX_CHAR);
	}

	static makeChar(c) {
		let a = new Automaton();
		a.singleton = c;
		return a;		
	}

	static makeCharRange(s, e) {
		if (s === e)
			return Automaton.makeChar(s);
		let a = new Automaton(),
			to = new State();
		to.accept = true;
		if (s <= e) {
			a.initial.addTran(new Transition(s, e, to));
		}
		return a;
	}

	static makeString(s) {
		return Automaton.makeChar(s);
	}
}