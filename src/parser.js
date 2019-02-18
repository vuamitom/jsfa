/*
 * a regex expression:
 * union_exp = inter ( | union_exp )
 * inter = concat ( & inter)
 * concat = repeat ( concat )
 * repeat = compl ?*+{ 
 * compl = (~) chars
 * chars = [char] or simple
 */
class Parser {
	constructor(str) {
		this.pos = 0;
		this.str = str;
	}


	_anyChar() {
		return new Node({kind: Kind.ANYCHAR});
	}

	_str(s) {
		return new Node({kind: Kind.STRING, s: s});
	}

	_empty() {
		return this._str('');
	}

	_char(c) {
		return new Node({kind: Kind.CHAR, c: c});
	}

	match(c) {
		if (this.pos < this.str.length && this.str[this.pos] === c) {
			this.pos ++;
			return true;
		}
		return false;
	}

	next() {
		if (!this.more()) {
			throw 'unexpected end-of-string';
		}
		return this.str[this.pos++];
	}

	more() {
		return this.pos < this.str.length;
	}

	peek(s) {
		return this.more() && s.indexOf(this.str[this.pos]) > -1;
	}

	parseUnion() {
		let n = this.parseInter();
		if (this.match('|'))
			n = n.union(this.parseUnion());
		return n;
	}

	parseInter() {
		// NOTE: omit intersection '&'
		// for simplicity. check original java impl for details
		return this.parseConcat();
	}

	parseConcat() {
		let n = this.parseRepeat();
		if (this.more() && !this.peek(')|')) {
			// NOTE: omit check intersection
			n = n.concate(this.parseConcat());
		}
		return n;
	}

	parseRepeat() {
		let n = this.parseCompl();
		while (this.peek('?*+{')) {
			if (this.match('?')) {
				n = n.optional();
			}
			else if (this.match('*')) {
				n = n.repeat();
			}
			else if (this.match('+')) {
				n = n.repeat(1);
			}
			else if (this.match('{')) {
				let start = this.pos;
				while (this.peek('0123456789'))
					this.next();
				if (start === this.pos)
					throw 'integer expected at position ' + this.pos;
				let mn = parseInt(this.str.substring(start,this.pos), 10),
					mx;
				if (this.match(',')) {
					start = this.pos;
					while (this.peek('0123456789'))
						this.next();
					if (start !== this.pos) {
						mx = parseInt(this.str.substring(start, this.pos), 10);
					}
				}
				else {
					mx = mn;
				}
				if (!this.match('}')) {
					throw 'expected \'}\' at position ' + this.pos;
				}
				n = n.repeat(mn, mx);
			}
		}
		return n;
	}

	parseCompl() {
		// NOTE: omit complement '~' impl
		// check original java impl for details
		return this.parseCharClassExp();
	}

	parseCharClassExp() {
		if (this.match('[')) {
			let negate = this.match('^');
			let n = this.parseCharClasses();
			if (negate) {
				n = n.complement();
				n = this._anyChar().intersect(n);
			}
			if (!this.match(']')) {
				throw 'expected \']\' at position ' + this.pos;
			}
			return n;
		}
		else {
			return this.parseSimple();
		}
	}

	parseCharClasses() {
		let n = this.parseCharClass();
		while (this.more() && !this.peek(']'))
			n = n.union(this.parseCharClass());
		return n;
	}

	parseCharClass() {
		let c = this.parseChar();
		if (this.match('-')) {
			if (this.peek(']')) {
				return this._char(c).union(this._char('-'));
			}
			else {
				return new Node({kind: Kind.CHAR_RANGE, from: c, to: this.parseChar()});
			}
		}
		else {
			return this._char(c);
		}
	}

	parseChar() {
		this.match('\\');
		return this.next();
	}

	parseSimple() {
		if (this.match('.')) {
			return this._anyChar();
		}
		else if (this.match('(')) {
			if (this.match(')')) {
				return this._empty();
			}
			let n = this.parseUnion();
			if (!this.match(')')) {
				throw 'expected \')\' at position ' + this.pos;
			}
			return n;
		}
		else {
			return this._char(this.parseChar());
		}
	}

	run() {
		if (this.str.length === 0) {
			return this._empty();
		}
		else {
			let n = this.parseUnion();
			if (this.pos < this.str.length) {
				throw 'end-of-string expected at position ' + this.pos; 
			}
			return n;
		}
	}
}

const Kind = {
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
}

class Node {
	constructor(args) {
		// this.exp1 = args.exp1;
		// this.exp2 = args.exp2;
		// this.kind = args.kind;
		if (!args.kind) {
			throw 'Expect `kind` parameter for Regexp Node';
		}
		for (let k in args) {
			this[k] = args[k];
		}		
	}
	union(n2) {
		return new Node({
			kind: Kind.UNION,
			exp1: this,
			exp2: n2
		});
	}
	repeat(min, max) {
		let k = (min !== undefined)? 
			(max !== undefined? Kind.REPEAT_MINMAX: Kind.REPEAT_MIN)
			: Kind.REPEAT 
		return new Node({
			kind: k,
			exp1: this,
			min: min,
			max: max
		});
	}

	complement() {
		return new Node({
			kind: kind.COMPLEMENT,
			exp1: this
		});
	}

	appendString(other) {
		return new Node({
			kind: Kind.STRING,
			s: ((this.s || this.c) + (other.s || other.c))
		});
	}

	concate(other) {
		if ((this.kind === Kind.CHAR || this.kind === Kind.STRING)
			&& (other.kind === Kind.CHAR || other.kind === Kind.STRING)) {
			return this.appendString(other);
		}
		const args = {
			kind: Kind.CONCAT
		};

		if (this.kind === Kind.CONCAT 
			&& (this.exp2.kind === Kind.CHAR || this.exp2.kind === Kind.STRING)
			&& (other.kind === Kind.CHAR || other.kind === Kind.STRING)) {
			args.exp1 = this.exp1;
			args.exp2 = this.exp2.appendString(other);
		}
		else if ((this.kind === Kind.CHAR || this.kind === Kind.STRING)
			&& other.kind === Kind.CONCAT
			&& (other.exp1.kind === Kind.CHAR || other.exp1.kind === Kind.STRING)) {
			args.exp1 = this.appendString(other.exp1);
			args.exp2 = other.exp2;
		}
		else {
			args.exp1 = this;
			args.exp2 = other;
		}
		return new Node(args);
	}

	intersect(other) {
		return new Node({
			kind: Kind.INTERSEC,
			exp1: this,
			exp2: other
		});
	}

	optional() {
		return new Node({
			kind: Kind.OPTIONAL,
			exp1: this
		});
	}

	print() {
		let a = [];
		return this._toString(a).join('');
	}

	_toString(h) {
		// console.log('--' + JSON.stringify(this));
		switch(this.kind) {
			case Kind.UNION:
				h.push('(');
				this.exp1._toString(h);
				h.push('|');
				this.exp2._toString(h);
				h.push(')');
				break;
			case Kind.CONCAT:
				this.exp1._toString(h);
				this.exp2._toString(h);
				break;
			case Kind.INTERSEC:
				h.push('(');
				this.exp1._toString(h);
				h.push('&');
				this.exp2._toString(h);
				h.push(')');
				break;
			case Kind.OPTIONAL:
				h.push('(');
				this.exp1._toString(h);				
				h.push(')?');
				break;
			case Kind.REPEAT:
				h.push('(');
				this.exp1._toString(h);				
				h.push(')*');
				break;
			case Kind.REPEAT_MIN:
				h.push('(');
				this.exp1._toString(h);				
				h.push('){');
				h.push(this.min);
				h.push(',}');
				break;
			case Kind.REPEAT_MINMAX:
				h.push('(');
				this.exp1._toString(h);				
				h.push('){');
				h.push(this.min);
				h.push(','); h.push(this.max); h.push('}');
				break;
			case Kind.COMPLEMENT:
				h.push('~(');
				this.exp1._toString(h);				
				h.push(')');
				break;
			case Kind.CHAR:
				h.push(this.c);
				break;
			case Kind.CHAR_RANGE:
				h.push("[");
				h.push(this.from);
				h.push("-");
				h.push(this.to);
				h.push("]");
				break;
			case Kind.ANYCHAR:
				h.push('.');
				break;
			case Kind.STRING:
				h.push(this.s);
				break;

		}
		return h;
	}
}

module.exports = {
	parse: function(str) {
		if (str === null || str === undefined) {
			throw 'Expect input string arg';
		}
		return new Parser(str).run();
	}
}