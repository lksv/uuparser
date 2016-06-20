'use strict';

const { GrmSymbol, NonTerminal } = require('./symbol');

class Rule {

  /**
   * Rule, e.g. A -> "a" B "c"  {{ code }}
   * Rule has a structure LHS -> RHS [semRes] [:option1] [option2=value] ...
   * Supported options
   *   * start
   *   * entity
   *   * priority=INTEGER
   *   * weight=FLOAT
   *   * opPrecedence=INTEGER
   *
   *   * left_assoc=Set
   *   * right_assoc=Set
   *   * non_assoc=Set
   * @constructor
   * @param {NonTerminal} lhs Left Hand Side of the rule
   * @param {Array} rhs Right Hand Side of the rule (arry of symbols)
   * @param {Function} semRes Callback for generating AST Node
   * @param {Object} options Rule options
   */
  constructor(lhs, rhs, semRes, options = {}) {
    if (!(lhs instanceof NonTerminal)) {
      throw new Error('LHS must be instasnce of NonTerminal!');
    }
    rhs.forEach(s => {
      if (!(s instanceof GrmSymbol)) {
        throw new Error('RHS has to be Array of (childs of) GrmSymbols');
      }
    });

    this.lhs = lhs;
    this.rhs = rhs || [];
    this.semRes = semRes;
    this.entity = options.entity;
    if (options.opPrecedence) {
      this.opPrecedence = options
        .opPrecedence.split(/,\s*/)
        .reduce((res, op) => {
          const [opName, opValue] = op.split(/:\s*/);
          res.set(opName, opValue);
          return res;
        }, new Map);
      this.opPrecedence_keys = new Set(this.opPrecedence.keys());
    } else {
      this.opPrecedence_keys = undefined;
      this.opPrecedence = undefined;
    }
    this.left_assoc = (options.left_assoc && new Set(options.left_assoc.split(/,\s*/)));
    this.right_assoc = (options.right_assoc && new Set(options.right_assoc.split(/,\s*/)));
    this.non_assoc = (options.non_assoc && new Set(options.non_assoc.split(/,\s*/)));
    this.weight = (options.weight === undefined) ? 1.0 : options.weight;
    this.priority = options.priority;
    this.options = options;

    this.hashCode = this.toString();
  }

  /**
   * Returns wheather the rule is empty i.e. does not have any symbols on RHS
   *
   * @returns {Boolean} true if the rule is empty
   */
  isEmpty() {
    return (this.rhs.length === 0);
  }

  toString() {
    const res = [`${this.lhs} -> ${this.rhs.join(' ')}`];
    if (this.semRes) {
      res.push(`{% ${this.semRes} %}`);
    }
    if (Object.keys(this.options).length) {
      res.push(`${JSON.stringify(this.options)}`);
    }
    return res.join(' ');
  }

  /**
   * Create new Rule defined by lhs and rhsPart.
   * Notice that *rhsPart* is a string. It parse *rshPart* and return an
   * instance of Rule.
   *
   * Be carefull, this function is not safe, it uses "eval"!
   *
   * @param {grmSymbol} lhs left hand side of rule
   * @param {string} rhsPart right hand side of rule (as a string)
   * @returns {Rule} creates and returns new Rule
   */
  static _loadRule(lhs, rhsPart) {
    let rhs = rhsPart;
    const options = {};

    const procRegExp = /(?:^| )\{%([\w\W]*)%\}/;
    let proc = procRegExp.exec(rhs);
    if (proc) {
      proc = proc[1];
      rhs = rhs.replace(procRegExp, ' ');
    }
    const entityRegExp = /entity:\s*true/;
    const entity = entityRegExp.exec(rhs);
    if (entity) {
      options.entity = true;
      rhs = rhs.replace(entityRegExp, '');
    }
    const weightRegExp = /weight:\s+(\d+(?:\.\d+))/;
    const weight = weightRegExp.exec(rhs);
    if (weight) {
      options.weight = parseFloat(weight[1]);
      rhs = rhs.replace(weightRegExp, '');
    }

    const opPrecedenceRegExp = /opPrecedence:\s*([\w:]+)/;
    const precedence = opPrecedenceRegExp.exec(rhs);
    if (precedence) {
      options.opPrecedence = precedence[1];
      rhs = rhs.replace(opPrecedenceRegExp, '');
    }
    const assocRegExp = /(left_assoc|right_assoc|non_assoc):\s*(\w+)/;
    const assoc = assocRegExp.exec(rhs);
    if (assoc) {
      options[assoc[1]] = assoc[2];
      rhs = rhs.replace(assocRegExp, '');
    }
    const priorityRegExp = /priority:\s*(\d+)/;
    const priority = priorityRegExp.exec(rhs);
    if (priority) {
      options.priority = +priority[1];
      rhs = rhs.replace(priorityRegExp, '');
    }


    rhs = rhs.match(
      // eslint-disable-next-line
      /"(?:\\.|[^"\\])*"|\/(?:\\.|[^\/\\])*\/|[A-Za-z0-9_]+(?:\([A-Za-z0-9_]+\))?|\{%[\w\W]*%\}|\S+/g
    ) || [];

    const convertedRHSSymbols = rhs
      .filter(s => !!(s.trim())) // filter empty strings
      .map(symbol => GrmSymbol.fromString(symbol));

    // eslint-disable-next-line no-eval
    const semRes = proc ? eval(proc) : undefined;

    return new Rule(lhs, convertedRHSSymbols, semRes, options);
  }

  /**
   * Read and parse *ruleStr* and returns new Rules.
   * Be carefull, this function is not safe, it uses "eval"!
   *
   * expample:
   *
   *     Rule.loadFromString('A -> || A -> "a" A "a"')
   *     =>
   *       [
   *         new Rule(new NonTerminal('A'), []),
   *         new Rule(new NonTerminal('A'), [
   *           new Terminal('a'), new NonTerminal('A'), new Terminal('a')
   *         ])
   *       ]
   *
   * @param {string} ruleStr rule string
   * @returns {Array} array of rules
   */
  static loadFromString(ruleStr) {
    const ruleWitoutComments = ruleStr
      .replace(/^\s*#.*$/mg, '') // remove comments
      .replace(/\s*\r?\n(?:\s*\r?\n)+/, '\n'); // remove empty lines

    if (ruleWitoutComments.search(/^\s*$/) === 0) {
      return [];
    }

    const found = /^([\w\W]*?)->([\w\W]*?)$/.exec(ruleWitoutComments);
    if (!found || !found[1] && !found[2]) {
      throw new Error('cannot parse LHS and RHS');
    }

    const lhs = GrmSymbol.fromString(found[1].trim());
    const rhsParts = found[2].trim().split('||');

    return rhsParts.map(rhsPart => this._loadRule(lhs, rhsPart));
  }
}


exports = module.exports = Rule;
