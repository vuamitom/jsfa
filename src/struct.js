class StateSet {
	constructor() {
		this.vals = {};
		this.states = [];
	}

	add(s) {
		if (!this.vals[s.id]) {
			this.vals[s.id] = s;
			this.states.push(s);
		}
		
	}

	get size() {
		return this.states.length;
	}

	get hashCode() {
		return [...this.keys].sort().join('_');
	}

	get keys() {
		let _d = new Set();
		for (let k in this.vals) {
			if (this.vals.hasOwnProperty(k)) {
				_d.add(k);
			}
		}
		return _d;
	}

	symmetricDifference(other) {
		let _d = this.keys;
		for (let e of other.keys) {
			if (_d.has(e)) {
				_d.delete(e);
			}
			else {
				_d.add(e);
			}
		}
		return _d;
	}

	equals(other) {
		return this.symmetricDifference(other).size === 0;
	}
}

class DoubleLinkedListNode {
	constructor(q) {
		this.obj = q;
		this.next = null;
		this.prev = null;
		this.ls = null;
	}

	remove() {
		if (this.prev === null) {
			this.ls.first = this.next;						
		}
		else {
			this.prev.next = this.next;
		}
		if (this.next === null) {
			this.ls.last = this.prev;
		}
		else {
			this.next.prev = this.prev;
		}		
		this.ls.size --;
		this.next = null;
		this.prev = null;
		this.ls = null;
		this.obj = null;
	}
}

class DoubleLinkedList {
	constructor() {
		this.size = 0;
		this.first = null;
		this.last = null;
	}

	get length() {
		return this.size;
	}

	add(q) {
		let n = new DoubleLinkedListNode(q);
		n.ls = this;
		if (this.size === 0) {
			this.first = this.last = n;
		}
		else {
			n.prev = this.last;
			this.last.next = n;
			this.last = n;
		}
		this.size ++;
		return n;
	}

	remove(q) {
		let n = this.first;
		while (n) {
			if (n.obj === q) {
				n.remove();				
				return true;
			}
			n = n.next;
		}
		return false;
	}

	*[Symbol.iterator]() {
		let n = this.first;
		while (n) {			
			yield n.obj;
			n = n.next;
		}
	}
}

module.exports = {
	StateSet,
	DoubleLinkedList
};