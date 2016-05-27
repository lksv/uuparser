'use strict';

/**
 * GrmSybol - it is an abstract class - mainly NonTerminal and Terminal are
 * inherited from GrmSymbol
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
   * Test wheather *str* is mached by this terminal starting form position *sidx*
   * This terminal match the *str* from *str* position if starts on *pattern*
   * Returns array of two items:
   * * matchedText - the *pattern* (i.e. *name*)
   * * eidx - index where the match finished in *str*
   *
   * @param {String} str Input string
   * @param {Number} sidx start position in *str* to match from
   * @returns {Array} [[matchedText], eidx] matched text and last position of matched text is *str*
   */
  match(str, sidx) {
    const eidx = sidx + this.pattern.length;
    return (str.slice(sidx, eidx) === this.pattern) ?
        [[this.pattern], eidx] : [undefined, undefined];
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
    this.regExp = (regExp instanceof RegExp) ? regExp : new RegExp(regExp, 'y');
  }

  toString() {
    return this.regExp.toString();
  }

  /**
   * Match input string *str* against *regExp* from *sidx* position.
   * Returns array of two items:
   * * matchedText - The full string of characters matched
   * * eidx - index where the match finished in *str*
   *
   * @param {String} str Input string
   * @param {Number} sidx start position in *str* to match from
   * @returns {Array} [matchedText, eidx] matched text and last position of matched text is *str*
   */
  match(str, sidx) {
    // TODO: speed up:
    // * by bottom up initialie has to find all occurencees
    // * by top-down we can add ^ to the begginging if regexp is not "multiline"
    // maybe the solution is to use //y for parsing and //g for init a bottom-up parser
    this.regExp.lastIndex = sidx;
    const res = this.regExp.exec(str);
    if (!res) {
      return [undefined, undefined];
    }
    return [
      [res[0]],
      sidx + res[0].length,
    ];
  }
}

// export {NonTerminal, Terminal, RegExpTerminal}
exports = module.exports = {
  GrmSymbol,
  NonTerminal,
  Terminal,
  RegExpTerminal,
};
