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

module.exports = {
	StateSet
};