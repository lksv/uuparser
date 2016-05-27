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
   *   * op_precedence=INTEGER
   *   * assoc=String [left|right|noassoc]
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
    this.rhs = rhs;
    this.semRes = semRes;
    this.entity = options.entity;
    this.options = options;

    this.hashCode = this.toString();
  }

  toString() {
    const res = [`${this.lhs} -> ${this.rhs.join(' ')}`];
    if (this.semRes) {
      res.push(`{{ ${this.semRes} }}`);
    }
    if (Object.keys(this.options).length) {
      res.push(`${JSON.stringify(this.options)}`);
    }
    return res.join(' ');
  }
}


exports = module.exports = Rule;
