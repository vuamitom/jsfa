const Struct = require('./struct.js');
const StateSet = Struct.StateSet;
const DoubleLinkedList = Struct.DoubleLinkedList;
const MIN_CHAR = Struct.MIN_CHAR;
const MAX_CHAR = Struct.MAX_CHAR;


let nextStateId = 0;



class Transition {
	constructor(min, max, to) {
		if (min === null || min === undefined) {			
			throw 'expect parameter to be single character';
		}
		if (min.constructor === String) 
			min = min.codePointAt(0);
		if (max && max.constructor === String)
			max = max.codePointAt(0);
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
		this.number = 0;
	}

	addTran(t) {
		if (this.transCode.has(t.hashCode)) {
			console.error('State: transition with duplicate char range');
			return false;
		}	
		else {	
			this.transCode.add(t.hashCode);
			this.trans.push(t);
			return true;
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

	getTransSorted() {
		let ar = [...this.trans];
		ar.sort(sortState(false));
		return ar;	
	}

	step(c) {
		for (let t of this.trans) {
			if (t.min <= c && c <= t.max) {
				return t.to;
			}
		}
		return null;
	}

	// inspect() {
	// 	return `State (id: ${this.id}, number ${this.number})`;
	// }
}

class Automaton {

	constructor(original) {
		if (!original) {
			this.initial = new State();
			this.deterministic = true;
			this.singleton = null;
			this.hash_code = 0;
			this.allow_mutation = false;
		}
		else {
			this.initial = original.initial;
			this.deterministic = original.deterministic;
			this.singleton = original.singleton;
			this.hash_code = original.hash_code;
			this.allow_mutation = original.allow_mutation;
		}
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
					worklist.push(t.to);
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

	/**
	 * returns a deep clone
	 */
	clone() {
		let a = new Automaton(this);
		if (!this.isSingleton()) {
			let states = this.states(),
				m = {};
			for (let s of states) {
				m[s.id] = new State();
			}
			for (let s of states) {
				let p = m[s.id];
				p.accept = s.accept;
				if (s === this.initial)
					a.initial = p;
				for (let t of s.trans) {
					p.addTran(new Transition(t.min, t.max, m[t.to.id]));
				}
			}
			
		}	
		return a;
	}

	cloneExpanded() {
		let a = this.clone();
		a.expandSingleton();
		return a;
	}

	cloneExpandedIfRequired() {
		if (this.allow_mutation) {
			this.expandSingleton();
			return this;
		}
		else {
			return this.cloneExpanded();
		}
	}

	cloneIfRequired() {
		return this.allow_mutation? this: this.clone();
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

	/**
	 * Returns an automaton that accepts between <code>min</code> and
	 * <code>max</code> (including both) concatenated repetitions of the
	 * language of the given automaton.
	 * <p>
	 * Complexity: linear in number of states and in <code>min</code> and
	 * <code>max</code>.
	 */
	repeat(min = 0, max) {
		if (!min
			&& (max === undefined || max === null)) {
			let a = this.cloneExpanded();
			let s = new State();
			s.accept = true;
			s.addEpsilon(a.initial);
			for (let p of a.getAcceptStates())
				p.addEpsilon(s);
			a.initial = s;
			a.deterministic = false;
			a.clearHashCode();
			a.checkMinimizeAlways();
			return a;
		}
		if (max !== null && max !== undefined) {
			if (min > max) {
				return Automaton.makeEmpty();
			}
			max -= min;
			this.expandSingleton();
			let b;
			if (min === 0)
				b = Automaton.makeEmptyString();
			else if (min === 1)
				b = this.clone();
			else {
				let as = new Array(min);
				for (let i = 0; i < min; i++) {
					as[i] = this;
				}
				b = Automaton.concatenate(as);
			}
			if (max > 0) {
				let d = this.clone();
				while (--max > 0) {
					let c = this.clone();
					for (let p of c.getAcceptStates()) 
						p.addEpsilon(d.initial);
					d = c;
				}
				for (let p of b.getAcceptStates()) 
					p.addEpsilon(d.initial);
				b.deterministic = false;
				b.clearHashCode();
				b.checkMinimizeAlways();
			}
			return b;
		}
		else {		
			let as = new Array(min + 1);
			for (let i = 0; i < min; i++) {
				as[i] = this;
			}
			as[min] = this.repeat();
			return Automaton.concatenate(as);
		}
	}

	/**
	 * Returns an automaton that accepts the intersection of
	 * the languages of the given automata.
	 * Never modifies the input automata languages.
	 * <p>
	 * Complexity: quadratic in number of states.
	 */
	intersection(other) {
		throw 'Not implemented';
	}

	/**
	 * Returns true if the language of <code>a1</code> is a subset of the
	 * language of <code>a2</code>. 
	 * As a side-effect, <code>a2</code> is determinized if not already marked as
	 * deterministic.
	 * <p>
	 * Complexity: quadratic in number of states.
	 */
	subsetOf(other) {
		if (this === other) return true;
		if (this.isSingleton()) {
			if (other.isSingleton()) {
				return this.singleton === other.singleton;
			}
			return other.run(this.singleton);
		}
		other.determinize();

		let trans1 = this.getSortedTrans(),
			trans2 = other.getSortedTrans(),
			worklist = [],
			visited = new Set(),
			idx = 0,
			hashCode = (arr) => {
				return arr[0].id + '_' + arr[1].id;
			};
		let p = [this.initial, other.initial];
		worklist.push(p);
		visited.add(hashCode(p));

		while (idx < worklist.length) {
			let p = worklist[idx];
			if (p[0].accept && !p[1].accept)
				return false;
			let ts1 = trans1[p[0].number],
				ts2 = trans2[p[1].number];
			for (let n1 = 0, b2 = 0; n1 < ts1.length; n1++) {
				while (b2 < ts2.length && ts2[b2].max < ts1[n1].min)
					b2++;
				let min1 = ts1[n1].min,
					max1 = ts1[n1].max;
				for (let n2 = b2; n2 < ts2.length && ts1[n1].max >= ts2[n2].min; n2++) {
					if (ts2[n2].min > min1)
						return false;
					if (ts2[n2].max < MAX_CHAR)
						min1 = ts2[n2].max + 1;
					else {
						min1 = MAX_CHAR;
						max1 = MIN_CHAR;
					}
					let q = [ts1[n1].to, ts2[n2].to];
					if (!visited.has(hashCode(q))) {
						worklist.push(q);
						visited.add(hashCode(q));
					}
				}
				if (min1 <= max1)
					return false;
			}
			idx ++;
		}

		return true;
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
			return container;
		}, accepts);
		return accepts;
	}

	getLiveStates(states) {
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
		let s = 0, worklist = [...live];
		while (s < worklist.length) {
			let st = worklist[s];
			for (let p of map[st.id]) {
				if (!live.has(p)) {
					live.add(p);
					worklist.push(p);
				}
			}
			s+=1;
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
			live = this.getLiveStates(states);
		// console.log('BEFORE removeDeadTransitions', states);
		for (let s of states) {
			let trans = s.trans;
			s.resetTransitions();
			for (let t of trans) {
				if (live.has(t.to)) {
					s.addTran(t);
				}
			}
		}
		// console.log('AFTER removeDeadTransitions', states);
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
		this.setStateNumbers(states);
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
	setStateNumbers(states) {
		let n = 0;
		for (let s of states) {
			s.number = n++;
		}
	}

	getSortedTrans() {
		let states = this.states();
		// TODO: 
		this.setStateNumbers(states);
		return states.map(s => {
			return trans = s.getTransSorted();
		});
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
		r.sort((a, b) => a - b);
		return r;
	}

	isEmpty() {
		if (this.isSingleton()) return false;
		return !this.initial.accept && this.initial.noOfTransitions === 0;
	}

	isEmptyString() {
		if (this.isSingleton())
			return this.singleton.length === 0;
		else 
			return this.initial.accept && this.initial.noOfTransitions === 0;
	}


	/** 
	 * Adds transitions to explicit crash state to ensure that transition function is total. 
	 */
	totalize() {
		let s = new State();
		s.addTran(new Transition(MIN_CHAR, MAX_CHAR, s));
		for (let p of this.states()) {
			let maxi = MIN_CHAR;
			for (let t of p.getTransSorted()) {
				if (t.min > maxi)
					p.addTran(new Transition(maxi, t.min - 1, s));
				if (t.max + 1 > maxi)
					maxi = t.max + 1;
			}
			if (maxi <= MAX_CHAR) {
				p.addTran(new Transition(maxi, MAX_CHAR, s));
			}
		}
	}

	minimizeHopcroft() {
		// console.log('----- before determinize', this.states())
		this.determinize();
		if (this.initial.noOfTransitions === 1) {
			let t = this.initial.trans[0];
			if (t.to === this.initial
				&& t.min === MIN_CHAR
				&& t.max === MAX_CHAR)
				return;
		}
		// console.log('before totalize')
		this.totalize();
		let ss = [...this.states()];
		let number = 0;

		for (let q of ss) {
			q.number = number++;
		}
		// console.log('OLD STATE', ss);
		let sigma = this.getStartPoints();

		// TODO: init structs		
		let partition = ss.map(s => new DoubleLinkedList()),
			block = new Array(ss.length),
			reverse = ss.map(s => sigma.map(_ => [])),
			active = ss.map(s => sigma.map(_ => new DoubleLinkedList())),
			active2 = ss.map(s => new Array(sigma.length)),
			pending = [],
			pending2 = sigma.map(_ => new Array(ss.length)),
			split = [],
			split2 = new Array(ss.length),
			refine = [],
			refine2 = new Array(ss.length),
			splitblock = ss.map(s => []);

		// find initial partition and reverse edges
		for (let q = 0; q < ss.length; q++) {
			let qq = ss[q];
			let j = qq.accept? 0: 1;
			partition[j].add(qq);
			block[qq.number] = j;
			for (let x = 0; x < sigma.length; x++) {
				let p = qq.step(sigma[x]);
				reverse[p.number][x].push(qq);
			}
		}

		// initialize active sets
		for (let j = 0; j <=1 ;j++) {
			for (let x = 0; x < sigma.length; x++) {
				for (let qq of partition[j])
					if (reverse[qq.number][x].length > 0) {						
						active2[qq.number][x] = active[j][x].add(qq);
					}
			}
		}

		// initialize pending
		for (let x = 0; x < sigma.length; x++) {
			let a0 = active[0][x].length,
				a1 = active[1][x].length,
				j = a0 <= a1? 0: 1;
			pending.push({n1: j, n2: x});
			pending2[x][j] = true;
		}

		// process pending until fixed point
		let idx = 0,
			k = 2; // the next partition
		while (idx < pending.length) {
			let ip = pending[idx],
				p = ip.n1, 
				x = ip.n2;
			pending2[x][p] = false;
			// find states that need to be split off their blocks
			for (let m of active[p][x]) {
				for (let s of reverse[m.number][x]) {
					if (!split2[s.number]) {
						split2[s.number] = true;
						split.push(s);
						let j = block[s.number];
						splitblock[j].push(s);
						if (!refine2[j]) {
							refine2[j] = true;
							refine.push(j);
						}
					}
				}
			}
			// refine blocks
			for (let j of refine) {
				if (splitblock[j].length < partition[j].length) {
					let b1 = partition[j],
						b2 = partition[k];
					for (let s of splitblock[j]) {
						b1.remove(s);
						b2.add(s);
						block[s.number] = k;
						for (let c = 0; c < sigma.length; c++) {
							let sn = active2[s.number][c];
							if (sn && sn.ls === active[j][c]) {
								sn.remove();
								active2[s.number][c] = active[k][c].add(s);
							}
						}
					}
					// update pending
					for (let c = 0; c < sigma.length; c++) {
						let aj = active[j][c].length,
							ak = active[k][c].length;
						if (!pending2[c][j] && 0 < aj && aj <= ak) {
							pending2[c][j] = true;
							pending.push({n1: j, n2: c});
						}
						else {
							pending2[c][k] = true;
							pending.push({n1: k, n2: c});
						}
					}
					k++;
				}
				for (let s of splitblock[j]) 
					split2[s.number] = false;
				refine2[j] = false;
				splitblock[j] = [];
			}
			split = [];
			refine = [];
			idx ++;
		}
		// console.log('PARTITION', partition);
		// make a new state for each equivalence class, set initial state
		let newstates = new Array(k);
		for (let n = 0; n < newstates.length; n++) {
			let s = new State();
			newstates[n] = s;
			for (let q of partition[n]) {
				if (q === this.initial) {
					// console.log('set this initial ', s);
					this.initial = s;
				}
				s.accept = q.accept;				
				// console.log('...q = ', q);	
				s.number = q.number;
				q.number = n;
			}
			// console.log ('s = ', s);
		}
		// build transitions and set acceptance
		
		
		for (let n = 0; n < newstates.length; n++) {
			let s = newstates[n];
			// console.log(s, '---', ss[s.number]);
			s.accept = ss[s.number].accept;
			for (let t of ss[s.number].trans) {
				s.addTran(new Transition(t.min, t.max, newstates[t.to.number]));
			}

		}
		// console.log('NEW STATE', newstates);
		// console.log(' actual state ', this.states())
		this.removeDeadTransitions();
	}

	minimize() {
		if (!this.isSingleton()) {
			// console.log('minimizing ...')
			this.minimizeHopcroft();
		}
		this.recomputeHashCode();
	}

	checkMinimizeAlways() {
		if (Automaton.alwaysMinimize()) {
			this.minimize();
		}
	}

	optional() {
		let a = this.cloneExpandedIfRequired();
		let s = new State();
		s.addEpsilon(a.initial);
		s.accept = true;
		a.initial = s;
		a.deterministic = false;
		a.clearHashCode();
		a.checkMinimizeAlways();
		return a;
	}

	/**
	 * Returns true if the given string is accepted by the automaton.
	 * <p>
	 * Complexity: linear in the length of the string.
	 * <p>
	 * <b>Note:</b> for full performance, use the {@link RunAutomaton} class.
	 */
	run(s) {
		if (this.isSingleton())
			return s === this.singleton;
		if (this.deterministic) {
			let p = this.initial;
			for (let i = 0; i < s.length; i++) {
				let q = p.step(s[i]);
				if (!q)
					return false;
				p = q;
			}
			return p.accept;
		}
		else {
			throw 'Not implemented';
		}
	}

	static alwaysMinimize() {
		return false;
	}

	static concatenate(ls) {
		ls = arguments.length > 1? arguments: ls;
		if (ls.length === 0) {
			return Automaton.makeEmptyString();
		}
		let allSingleton = !ls.some(a => !a.isSingleton());
		if (allSingleton) {
			let b = ls.map(a => a.singleton).join('');
			return Automaton.makeString(b);
		}
		else {
			if (ls.some(a => a.isEmpty()))
				return Automaton.makeEmpty();
			let ids = new Set();
			ls.forEach(a => ids.add(a));
			let hasAliases = (ids.size !== ls.length),
				b = hasAliases? ls[0].cloneExpanded(): ls[0].cloneExpandedIfRequired(),
				ac = b.getAcceptStates(),
				first = true;
			for (let a of ls)			 {
				if (first)
					first = false
				else {
					if (a.isEmptyString())
						continue;
					let aa = hasAliases? a.cloneExpanded(): a.cloneExpandedIfRequired(),
						ns = aa.getAcceptStates();
					for (let s of ac) {
						s.accept = false;
						s.addEpsilon(aa.initial);
						if (s.accept) ns.add(s);
					}
					ac = ns;
				}
			}
			b.deterministic = false;
			b.clearHashCode();
			b.checkMinimizeAlways();
			return b;
		}
	}

	static union(ls) {
		ls = arguments.length > 1? arguments: ls;
		let ids = new Set();
		ls.forEach(a => ids.add(a));
		let hasAliases = (ids.size !== ls.length);
		let s = new State();
		for (let b of ls) {
			if (b.isEmpty()) continue;
			let bb = (hasAliases)? b.cloneExpanded(): b.cloneExpandedIfRequired();
			s.addEpsilon(bb.initial);
		}
		let a = new Automaton();
		a.initial = s;
		a.deterministic = false;
		a.clearHashCode();
		a.checkMinimizeAlways();
		return a;
	}

	// make default structure
	static makeEmpty() {
		let a = new Automaton();
		a.initial = new State();
		a.deterministic = true;
		return a;
	}

	static makeEmptyString() {
		return Automaton.makeString('');
	}

	static makeAnyChar() {
		return Automaton.makeCharRange(MIN_CHAR, MAX_CHAR);
	}

	static makeChar(c) {
		let a = new Automaton();
		a.singleton = c;
		a.deterministic = true;
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

module.exports = Automaton;