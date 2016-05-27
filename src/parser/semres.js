const NonTerminal = require('../grammar').NonTerminal;
const DefaultLogger = require('../utils/logger');

/**
 * Represents AST Node with addtional properies
 *
 * Weight - weight/probability of the Node, it is computed
 * by multiplication weight of all used rules.
 *
 * Priority - used for reduce the results. Cuts all the results with less 
 * priority (note that Nodes witout defined priority are not reduced).
 */
class NodeResult {
  constructor(data, priority, weight) {
    this.data = data;
    this.priority = priority;
    this.weight = weight || 1.0;
  }
}

/**
 * Represents NodeResult of all the symbols of RHS before the dot.
 *
 * E.g. in NodeResultArgs for edge: A -> α•β <sidx, eidx>
 * represents an array of NodeResult of all the symbols in β
 *
 * For reduced edges it also calculates NodeResult of the edge by
 * calling user defined rule.semRes callback.
 */
class NodeReusltArgs {
  constructor() {
    this.array = [];
  }

  multiply(nodeResultArgs) {
    if (this.array.length === 0) {
      this.array = nodeResultArgs;
    } else if (nodeResultArgs.length === 0) {
      this.nodeResultArgs = this.nodeResultArgs.map(x => x.concat(null));
    } else {
      nodeResultArgs.map(x => )
    }
  }

  forEach(callback) {
    this.array.forEach(callback);
  }
}

exports = module.exports = {
  NodeResult,
};
