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
  constructor(data, weight, txt, priority) {
    this.data = data;
    this.weight = weight;
    this.txt = txt;
    this.priority = priority;
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

  multiply(nodeResults) {
    if (!(nodeResults instanceof Array)) {
      throw new Error('Not an array of NodeResults');
    }
    if (nodeResults.find(nr => (!(nr instanceof NodeResult)))) {
      throw new Error('Not an array of NodeResults');
    }

    if (this.array.length === 0) {
      console.log(1);
      return nodeResults.map(nr => new NodeResultArgs([nr]));
    } else if (nodeResults.length === 0) {
      console.log(2);
      throw new Error('No NodeResult present');
    } else {
      const res = [];
      for (const csr of nodeResults) {
        console.dir(this.array.concat([csr]));
        res.push(new NodeResultArgs(this.array.concat([csr])));
      }
      return res;
    }
  }

  apply(callback, weight, lhsName) {
    const callbackResult = callback.apply(undefined, this.array);
    console.log('applying callback to: ', this.array);
    return new NodeResult(
      callbackResult,
      this.array.reduce((prev, nr) => prev * nr.weight, 1.0) * weight,
      `${lhsName}(${this.array.map(nr => nr.txt).join(', ')})`
    );
  }

}

exports = module.exports = {
  NodeResult,
  NodeResultArgs,
};
