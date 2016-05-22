'use strict';

/**
 * GrmSybol - it is an abstract class - mainly NonTerminal and Terminal are
 * inherited from GrmSymbol
 *
 * @param {String} name
 *
 */
class GrmSymbol {
  /**
   * Abstract class parent of all grammar symbols
   * @constructor
   * @param {String} name Name of the GrmSymbol
   */
  constructor(name) {
    this.name = name;

    this.code = this.name;
  }
}

/**
 * Represents NonTerminal of grammar
 * It is defined only by name
 *
 * @param {String} Name
 */
class NonTerminal extends GrmSymbol {
  toString() {
    return this.name;
  }
}

/**
 * Represents Terminal symbol of grammar
 * It is represented by name and patter which it could match
 *
 */
class Terminal extends GrmSymbol {
  /**
   * Creates Terminal of a grammar.
   * @constructor
   * @param {String} name name of the terminal
   * @param {String} pattern patter which it match in input
   */
  constructor(name) {
    super(name);
    this.pattern = name;
  }

  /**
   * Test wheather *str* is mached by this terminal.
   * This terminal match the *str* if starts on *pattern*
   *
   * @param {String} str Input string
   * @returns {Boolean}
   */
  match(str) {
    return (str.slice(0, this.pattern.length) === this.pattern) ?
        this.pattern : false;
  }

  toString() {
    return `"${this.name}"`;
  }
}

class RegExpTerminal extends GrmSymbol {
  /**
   * @constructor
   * @param {String} name Name of the terminal
   * @param {String|RegExp} regExp Pattern to match
   */
  constructor(name, regExp = name) {
    super(name);
    this.regExp = (regExp instanceof RegExp) ? regExp : new RegExp(regExp);
  }

  toString() {
    return this.regExp.toString();
  }

  /**
   * Match input string *str* against *regExp*
   * @param {String} str Input string
   * @param {Context|Object} context Context if this TODO
   */
  match(str, context) {
    //TODO: speed up:
    // * by bottom up initialie has to find all occurencees
    // * by top-down we can add ^ to the begginging if regexp is not "multiline"
    this.regExp.lastIndex = 0;
    //TODO: what is faster?
    //var res = this.regExp.exec(str);
    var res = str.match(this.regExp);

    return (res.index === 0) ? str.slice(0, res[0].length) : false;
  }
}

// export {NonTerminal, Terminal, RegExpTerminal}
exports = module.exports = {
  GrmSymbol,
  NonTerminal,
  Terminal,
  RegExpTerminal
};
