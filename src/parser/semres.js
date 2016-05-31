/**
 * Represents AST Node with addtional properies
 *
 * Weight - weight/probability of the Node, it is computed
 * by multiplication weight of all used rules.
 *
 */
class NodeResult {
  constructor(data, weight, txt) {
    this.data = data;
    this.weight = weight;
    this.txt = txt;
  }

  toString() {
    return `NodeResult(${this.data}, ${this.weight}, ${this.txt})`;
  }
}

/**
 * Represents particular NodeResult of all the symbols of RHS before the dot.
 *
 * E.g. in NodeResultArgs for edge: A -> α•β <sidx, eidx>
 * represents an array of NodeResult of all the symbols in β
 */
class NodeResultArgs {
  constructor(init = []) {
    if (init) {
      if (!(init instanceof Array)) {
        throw new Error('Not an array of NodeResults');
      }
      if (init.find(nr => !(nr instanceof NodeResult))) {
        throw new Error('Not an array of NodeResults');
      }
    }

    this.array = init;
  }

  /**
   * Returns new (miltipled) array of NodeResultArgs by adding each
   * NodeResult form *nodeResults* as a last argrument to self (=i.e. self.array)
   *
   * @param {Array} nodeResults Array of NodeResult
   * @returns {Array} representation of RHS (up to a dot)
   */
  multiply(nodeResults) {
    if (!(nodeResults instanceof Array)) {
      throw new Error('Not an array of NodeResults');
    }
    if (nodeResults.find(nr => (!(nr instanceof NodeResult)))) {
      throw new Error('Not an array of NodeResults');
    }

    if (this.array.length === 0) {
      return nodeResults.map(nr => new NodeResultArgs([nr]));
    } else if (nodeResults.length === 0) {
      throw new Error('No NodeResult present');
    } else {
      const res = [];
      for (const csr of nodeResults) {
        res.push(new NodeResultArgs(this.array.concat([csr])));
      }
      return res;
    }
  }

  /**
   * Call semRes callback on self.
   * It calculates:
   * * weight by multiplaing each NodeResult weigh and (entered) *weight*
   * * txt from each NodeResult txt sourouded by *lhsName*
   * * data as result of callback
   *
   * @param {Function} callback callback to call, for propeer calculation of NodeResult.data
   * @param {Float} weight weight of processed rule
   * @param {String} lhsName name to surronoud the NodeResult.txt (LHS name of the processed rule)
   * @returns {NodeResult} calculated NodeResult
   */
  apply(callback, weight, lhsName) {
    const callbackResult = callback.apply(undefined, this.array);
    return new NodeResult(
      callbackResult,
      this.array.reduce((prev, nr) => prev * nr.weight, 1.0) * weight,
      `${lhsName}(${this.array.map(nr => nr.txt).join(', ')})`
    );
  }

  toString() {
    return `NodeResultArgs(${this.array.map(nr => nr.toString()).join(', ')})`;
  }
}

exports = module.exports = {
  NodeResult,
  NodeResultArgs,
};
