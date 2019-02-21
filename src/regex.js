const Parser = require('./parser.js');
const Automaton = require('./automaton.js');

function flatten(n) {
	let c = [];
	const _flatten = (n, c, k) => {
		if (n.kind === k) {
			_flatten(n.exp1, c, k);
			_flatten(n.exp2, c, k);
		}
		else {
			c.push(n);
		}
	}; 
	_flatten(n, c, n.kind);
	return c;
}

function toAutomaton(n, minimize) {
	// console.log('need minimize 1', minimize);
	const K = Parser.kinds;
	let a = null,
		l;
	switch(n.kind) {
		case K.UNION:
			l = flatten(n);
			// let temp = ;
			// console.log(temp);
			a = Automaton.union(l.map(e => toAutomaton(e, minimize)));
			if (minimize) {
				// console.log('need minimize', minimize);
				a.minimize();
			}
			break;
		case K.CONCAT:
			l = flatten(n);
			a = Automaton.concatenate(l.map(e => toAutomaton(e, minimize)));
			if (minimize) a.minimize();
			break;
		case K.INTERSEC:
			a = toAutomaton(n.exp1, minimize)
					.intersect(toAutomaton(n.exp2, minimize));
			if (minimize)
				a.minimize();
		break;
		case K.OPTIONAL:
			a = toAutomaton(n.exp1, minimize).optional();
			if (minimize)
				a.minimize();
		break;
		case K.REPEAT:
		case K.REPEAT_MIN:		
		case K.REPEAT_MINMAX:
			a = toAutomaton(n.exp1, minimize).repeat(n.min, n.max);
			if (minimize)
				a.minimize();
		break;
		case K.COMPLEMENT:
			a = toAutomaton(n.exp1, minimize).complement();
			if (minimize) a.minimize();
		break;
		case K.CHAR:
			a = Automaton.makeChar(n.c);
			break;
		break;
		case K.CHAR_RANGE:
			a = Automaton.makeCharRange(n.from, n.to);
		break;
		case K.ANYCHAR:
			a = Automaton.makeAnyChar();
		break;
		case K.STRING:
			a = Automaton.makeString(n.s);
		break;
	}
	return a;
}

class Regexp {
	constructor(str) {		
		this.str = str;		
		this.root = Parser.parse(str);
	}

	toAutomaton() {
		return toAutomaton(this.root, true);
	}

	toString() {
		return this.root.toString();
	}
}
	

module.exports = Regexp;