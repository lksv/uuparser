const Terminal = require('./symbol').Terminal;

class Grammar {
  /**
   * @constructor
   * @param {Array} rules  Array of rules of the grammar
   */
  constructor(rules) {
    this.rules = [];
    this.lhsRules = new Map();
    this.rhsRules = new Map();

    rules.forEach(r => this.addRule(r));
  }

  /**
   * Adds *rule* to the grammar
   * @param {Rule} rule Rule to add
   * @returns {Grammar} self
   */
  addRule(rule) {
    const lhsCode = rule.lhs.code;
    const lhsRules = this.lhsRules.get(lhsCode) || [];
    lhsRules.push(rule);
    this.lhsRules.set(lhsCode, lhsRules);

    const rhsCode = rule.rhs[0] && rule.rhs[0].code;
    const rhsRules = this.rhsRules.get(rhsCode) || [];
    rhsRules.push(rule);
    this.rhsRules.set(rhsCode, rhsRules);

    this.rules.push(rule);
    return this;
  }

  /**
   * Returns list of rules which starts *symbol*
   * @param {GrmSymbol} symbol Symbol to search
   * @returns {Array} Array of Rules.
   */
  rulesByFirstRhs(symbol) {
    return this.rhsRules.get(symbol && symbol.code) || [];
  }

  /**
   * Returns list of rules which RHS starts on *symbol*
   *
   * @param {GrmSymbol|undefined} symbol It can be undefined when it is empty rule.
   * @returns {Array} Array of Rules
   */
  rulesByLhs(symbol) {
    return this.lhsRules.get(symbol.code) || [];
  }

  /**
   * Returns only epsilon rules (rules with empty RHS)
   *
   * @param {GrmSymbol} symbol LHS symbol of the rule
   * @returns {Array} Array of Rules
   */
  epsilonRulesByLhs(symbol) {
    // TODO should be speed up by your own index
    const res = this.lhsRules.get(symbol.code) || [];
    return res.filter(rule => rule.isEmpty());
  }


  entityRules() {
    return this.rules.filter(rule => rule.entity);
  }

  terminalStartRules() {
    return this.rules.filter(
      rule => rule.rhs[0] && (rule.rhs[0] instanceof Terminal)
    );
  }

  toString() {
    return this.rules.map(r => r.toString()).join('\n');
  }
}

exports = module.exports = Grammar;
