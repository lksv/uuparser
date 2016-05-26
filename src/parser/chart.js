/**
 * Stores history of ChartItem
 *
 * If there is only ony way how to parse particular ChartItem
 * then the ChartItem will has exactly one item in history
 *
 * open refers to ChartItem(s) with a dot - 1
 * closed refers to ChartItem(s) wich parse sybmol under (dot - 1)
 * e.g.
 *    chartItem = A -> B . C D
 * has one intem in history with following:
 * * open:     A -> . B C D
 * * close:    B -> any . # any reduced item
 *
 */
const NonTerminal = require('../grammar').NonTerminal;
const DefaultLogger = require('../utils/logger');

/**
 * Structure to store information about how to chartItem (edge) was created form
 * consists of:
 * * open  - how was the symbols in RSH created form
 * * closed - how was the NonTerminal on the dot created
 * * semRes - the parsered string of the terminals
 */
class ChartItemHistory {
  constructor(open, closed, semRes) {
    this.open = open;
    this.closed = closed;
    this.semRes = semRes || [];

    this.code = (this.open ? this.open.code : 'null') +
      ':' +
      (this.closed ? this.closed.code : 'null');
  }
}

/**
 * ChartItem represents hypothesis in parsing.
 * Sometimes it is called `edge`.
 *
 * ChartItem match the input string form *sidx* to *eidx* by the
 * first *dot* RHS symbols of the *rule* is possible to match.
 *
 * e.g.:
 *  input text: 'nothing xx'
 *  A -> 'xx' . B { dot: 1, sidx: 8, eidx: 10 }
 *  match the input text: 'nothing >>xx<<'
 *
 */
class ChartItem {
  constructor(cloneFrom, cloneFrom2 = {}) {
    this.history = [];
    this.sidx = cloneFrom2.sidx || cloneFrom.sidx;
    this.eidx = cloneFrom2.eidx || cloneFrom.eidx;
    this.rule = cloneFrom2.rule || cloneFrom.rule;
    this.dot  = cloneFrom2.dot  || cloneFrom.dot || 0;

    const open = cloneFrom2.open || cloneFrom.open;
    const closed = cloneFrom2.closed || cloneFrom.closed;
    if (open || closed || cloneFrom.semRes || cloneFrom2.semRes) {
      const semRes = cloneFrom2.semRes || cloneFrom.semRes;
      this.history.push(new ChartItemHistory(open, closed, semRes));
    }

    // rule, dot, sidx, edix BUT NOT history
    this.code = this.toString();
  }

  // TODO: can I write `const get` in ES6?
  get lhs() {
    return this.rule.lhs;
  }

  nextSymbol() {
    return this.rule.rhs[this.dot];
  }

  /** An ChartItem with dot in from of Terminal (RegExpTerminal, ...)
   * is called shift item.
   */
  isShiftItem() {
    return !(this.nextSymbol() instanceof NonTerminal);
  }

  /**
   * An ChartItem with dot at the end (i.e. dot is after the RHS)
   * is called reduced item.
   */
  isReducedItem() {
    return !this.nextSymbol();
  }

  /**
   * An ChartItem with dot at beginnging (i.g. dot is in front of RHS)
   * is called predicted item.
   */
  isPredictedItem() {
    return this.dot === 0;
  }

  /** Returns AST (semantic representation)
   * If edge is:
   *  * predicted than semantic representation is [].
   *  * not reduced it returns array of semantic representation of all symbols before a dot.
   *  * reduced than it returns all posible semantic representation as an Array of Objects.
   *
   * @returns [Array] array of Objects (AST Nodes)
   */
  semRes() {
    // if already cached return it now
    if (this.semRes) return this.semRes;

    // predicted adges has empty semRes - we are in fixed point of the recursion.
    if (this.isPredictedItem()) return [];

    //calculate semRes for all RHS's symbols (before the dot)
    let semRes = [];
    this.history.forEach(h => {
      const openSemRes = h.open.semRes();
      // history has semRes for shift items, i.e. semRes of Terminal is
      // taken directly
      const closedSemRes = h.semRes ? h.semRes : h.closed.semRes();
      for (let osr of openSemRes) {
        for (let csr of closedSemRes) {
          semRes.push([osr, csr]);
        }
      }
    });
    if (this.isReducedItem()) {
      semRes = semRes.map(s => this.rule.semRes(s));
    }
    // Cache the result. Result can be requested form different parent places
    // therefore caching is needed.
    this.semRes = semRes;

    return this.semRes;
  }

  /**
   * Copy history form other chartItem to this
   * Throws exception if this and other differs
   *
   * @param {ChartItem} other The source of history
   * @returns {this}
   */
  copyHistoryFrom(other) {
    if (this.code !== other.code) {
      throw new Error('Cannot copy history form different ChartItem');
    }

    other.history.forEach(otherHistory => {
      const otherHistoryHashCode = otherHistory.code;
      if (!this.history.find(h => (h.code === otherHistoryHashCode))) {
        this.history.push(otherHistory);
      }
    });
  }

  /**
   * Goes recursively by history edges (i.e open and close edges) and mark 
   * each child edge as marked.
   *
   * It is used "internally" to find supremum of reducedRules edges which are
   * upperbound by the <sidx, eidx>.
   * It is genneraly used only once after the `parse` is done. Therefore there
   * is not method to cleare the marked edges.
   *
   * It does not mark first *nested* direct children.
   * @param {Number} nested From which generation (recursively) mark the childer
   */
  deepMark(nested) {
    if (nested <= 0) this.marked = true;
    this.history.forEach(h => {
      if (h.open) h.open.deepMark(nested - 1);
      if (h.closed) h.closed.deepMark(nested - 1);
    });
  }

  toString() {
    const rhsBeforeDot = this.rule.rhs.slice(0, this.dot);
    const rhsAfterDot  = this.rule.rhs.slice(this.dot);
    return `${this.lhs} -> ${rhsBeforeDot.join(' ')} . ${rhsAfterDot.join(' ')}\t` +
      `[${this.sidx}, ${this.eidx}]`;
  }
}

/**
 * Creates index under the ChartItems form Chart
 * ChartItems are indexed by the touple: *symbol* and *idx*
 * Each ChartItem could be stored by the *symbol* and *idx* only onece
 *
 *     var chartItem = ...
 *     var symbol = GrmSymbol.new('Symbol')
 *     var chi = new ChartItemIndex();
 *     chi.add(symbol, 0, chartItem)
 *     chi.add(symbol, 0, chartItem)
 *     chi.get(symbol, 0) // => MapIterator { chartItem }
 *
 * It is used for:
 *  * Production: index by symbol in RHS and it's position in the input
 *  * Completion: index by LHS and it's rule starting postion in the input
 */
class ChartItemIndex {
  constructor() {
    this.index = new Map();
  }

  /**
   * Get the ChartItems indexed by the *symbol* and *idx*
   * @param {GrmSymbol} symbol
   * @param {Nuber} idx
   * @returns {Iterator} Iterator over indexed ChartItems
   */
  get(symbol, idx) {
    const hashCode = this.hashCode(symbol, idx);
    const res = this.index.get(hashCode);
    if (res) {
      return res.values();
    }
    const map = new Map();
    this.index.set(hashCode, map);
    return map.values();
  }

  /**
   * Store/index the *chartItem* indexed by the *symbol* and *idx*
   *
   * @param {GrmSymbol} symbol
   * @param {Number} idx
   * @param {ChartItem} chartItem
   * @returns {void}
   */
  add(symbol, idx, chartItem) {
    const hashCode = this.hashCode(symbol, idx);
    let map = this.index.get(hashCode);
    if (!map) {
      map = new Map();
      this.index.set(hashCode, map);
    }
    map.set(chartItem.code, chartItem);
  }

  hashCode(symbol, idx) {
    return `${symbol.code},${idx}`;
  }
}

class Chart {
  constructor(logger) {
    // array of ChartItems
    // it holds Chart and Agenda
    // in the *hypothesis* array all chartItems before *hypothesisIdx* index
    // are in Chart, all ChartItems after *hypothesisIdx* are in Agenda.
    this.hypothesis = [];
    this.hypothesisIdx = 0;

    // List of full rules indexed by the [lhs, idx]
    //
    // It is usefull for fast obtaining all hypothesis
    // which match given terminal form particular position.
    this.reducedRules = new ChartItemIndex();
    // list of rules which are waiting to fullfil the nextSymbol indexed
    // by [nextSymbol, idx]
    //
    // It is usefull for fast obtaining all hypotesis which stuck
    // on particular symbol and position.
    this.waitingRules = new ChartItemIndex();
    // list of all exists ChartItems hashCodes
    // Used to not add already exist chartItem
    this.existChartItems = new Set();

    this.logger = logger || new DefaultLogger;
  }

  /**
   * Add chartItem to the agenda
   * it also update all indexes (waitingRules, reducedRules)
   */
  add(chartItem) {
    const alreadyExists = this.find(chartItem);
    if (alreadyExists) {
      // do not add chartItem if already exists in Chart
      // but it is necessary to copy all chartItem.history
      alreadyExists.copyHistoryFrom(chartItem);
      return;
    }
    this.existChartItems.add(chartItem.code);
    this.hypothesis.push(chartItem);

    const nextSymbol = chartItem.nextSymbol();

    if (nextSymbol instanceof NonTerminal) {
      this.waitingRules.add(nextSymbol, chartItem.eidx, chartItem);
    }

    if (chartItem.isReducedItem()) {
      this.reducedRules.add(chartItem.lhs, chartItem.sidx, chartItem);
    }
  }

  /**
   * Add new edge (chartItem) to the agenda.
   * For an *open* edge A -> α•Bβ <openSidx, openEidx>
   * and *closed* edge  B → γ• <closedSidx, closedEidx>
   * put edge to agenda: A -> αB•β <openSidx, closedEidx>
   *
   * @param {ChartItem} open - open edge
   * @param {ChartItem} closed - closed edge
   */
  addFromOpenClosed(open, closed) {
    const newEdge = new ChartItem(open, {
      eidx: closed.eidx,
      dot: open.dot + 1,
      open,
      closed,
    });
    this.logger.debug(`  addFromOpenClosed: ${newEdge}`);
    this.add(newEdge);
  }

  /**
   * Add new (predicted) edge to the agenda
   */
  addPredicted(rule, idx) {
    const newEdge = new ChartItem({
      sidx: idx,
      eidx: idx,
      dot:  0,
      rule,
    });
    this.logger.debug(`  addPredicted: ${newEdge}`);
    this.add(newEdge);
  }

  /**
   * Add new edge which consumes (jumps) over Terminal
   *
   * @param {ChartItem} chartItem Edge to process
   * @param {Number} eidx Index in input we are consumed to
   * @param {Object} semRes result of *match* symbol.method (usually the string we consumed from input)
   */
  addScanned(chartItem, eidx, semRes) {
    const newEdge = new ChartItem(chartItem, {
      dot: chartItem.dot + 1,
      eidx,
      open: chartItem,
      semRes,
    });
    this.logger.debug(`  addScanner: ${newEdge}`);
    this.add(newEdge);
  }

  getReduced(symbol, idx) {
    return this.reducedRules.get(symbol, idx);
  }

  getWaiting(symbol, idx) {
    return this.waitingRules.get(symbol, idx);
  }

  find(chartItem) {
    if (!this.existChartItems.has(chartItem.code)) {
      return false;
    }
    // chartItem exists, find it and return
    const addingHashCode = chartItem.code;
    return this.hypothesis.find(item => item.code === addingHashCode);
  }

  next() {
    const currentEdge = this.hypothesis[this.hypothesisIdx++];
    this.logger.debug(`processing edge[${this.hypothesisIdx}]: ${currentEdge}`);
    return currentEdge;
  }

  /**
   * returns reduced edges from chart (and agenda) which parse *entity* rule
   * and only that which are not children (not in the history) of
   * another parentEntities
   */
  parentEntities() {
    const allEntities = this.hypothesis.filter(edge => edge.rule.entity && edge.isReducedItem());
    allEntities.forEach(edge => edge.deepMark(1));
    const parentEntities = allEntities.filter(edge => !edge.marked);
    this.logger.debug(`parentEntities: ${parentEntities}`);
  }
}

exports = module.exports = {
  ChartItemHistory,
  ChartItem,
  ChartItemIndex,
  Chart,
};
