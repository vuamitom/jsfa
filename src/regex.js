const Parser = require('./parser.js');

class Regexp {
	constructor(str) {		
		this.str = str;		
		this.root = Parser.parse(str);
	}

	toAutomaton() {

	}

	toString() {
		return this.root.print();
	}
}


module.exports = Regexp;