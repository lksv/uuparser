class Grammar {
  /**
   * @constructor
   * @param {Array} rules  Array of rules of the grammar
   */
  constructor(rules) {
    this.rules = [];
    this.lhsRules = new WeakMap();
    this.rhsRules = new Map(); //WeakMap? The key is `undefined`:(

    rules.forEach(r => this.addRule(r));
  }

  /**
   * Adds *rule* to the grammar
   * @param {Rule} rule Rule to add
   * @returns this
   */
  addRule(rule) {
    var lhsRules = this.lshRules.get(rule.lsh) || [];
    lhsRules.push(rule);
    this.lshRules.set(rule.lsh, lhsRules);

    var rhs = rule.rhs.first;
    var rhsRules = this.rhsRules.get(rhs) || [];
    rhsRules.push(rule);
    this.rhsRules.set(rhs, rhsRules);

    this.rules.push(rule);
    return this;
  }

  /**
   * Returns list of rules which starts *symbol*
   * @param {GrmSymbol} symbol
   * @returns {Array} Array of Rules.
   */
  rulesByFirstRhs(symbol) {
    return this.rhsRules(symbol) || [];
  }

  /**
   * Returns list of rules which RHS starts on *symbol*
   *
   * @param {GrmSymbol|undefined} symbol It can be undefined when it empty rule.
   * @returns {Array} Array of Rules
   */
  rulesByLhs(symbol) {
    return this.lshRules.get(symbol) || [];
  }
}

exports = module.exports = {
  Grammar
};
