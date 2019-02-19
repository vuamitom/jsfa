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
	const K = Parser.kinds;
	let a = null;
	switch(n.kind) {
		case K.UNION:
			let l = flatten(n);
			a = Automaton.union(l.map(e => toAutomaton(e, minimize)));
			if (minimize) a.minimize();
			break;
		case K.CONCAT:
			let l = flatten(n);
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
			a = Automaton.char(n.c);
			break;
		break;
		case K.CHAR_RANGE:
			a = Automaton.charRange(n.from, n.to);
		break;
		case K.ANYCHAR:
			a = Automaton.anyChar();
		break;
		case K.STRING:
			a = Automaton.str(n.s);
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
	UNION: 1,
	CONCAT: 2,
	INTERSEC: 3,
	OPTIONAL: 4,
	REPEAT: 5,
	REPEAT_MIN: 6,
	REPEAT_MINMAX: 7,
	COMPLEMENT: 8,
	CHAR: 9,
	CHAR_RANGE: 10,
	ANYCHAR: 11,
	EMPTY: 12,
	STRING: 13,
	ANYSTRING: 14,
	AUTO: 15,
	INTERVAL: 16

module.exports = Regexp;