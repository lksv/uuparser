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
const symbols = require('./symbol');
const NonTerminal = symbols.NonTerminal;

class ChartItemHistory {
  constructor(open, close) {
    this.open = open;
    this.close = close;
  }

  hashCode() {
    return this.open.hashCode() + this.close.hashCode();
  }
}

/**
 * ChartItem represents hypothesis in parsing.
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
  constructor(cloneFrom) {
    this.dot = 0;
    this.history = [];
    if (cloneFrom) {
      this.sidx = cloneFrom.sidx;
      this.eidx = cloneFrom.eidx;
      this.dot  = cloneFrom.dot;
      this.rule = cloneFrom.rule;
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

  /**
   * Copy history form other chartItem to this
   * Throws exception if this and other differs
   *
   * @param {ChartItem} other The source of history
   * @returns {this}
   */
  copyHistoryFrom(other) {
    if (this.hashCode() !== other.hashCode()) {
      throw new Error('Cannot copy history form different ChartItem');
    }

    other.history.forEach(otherHistory => {
      const otherHistoryHashCode = otherHistory.hashCode();
      if (!this.history.find(h => h.hashCode() === otherHistoryHashCode)) {
        this.history.push(
          ChartItemHistory.new(other.open.other.closed)
        );
      }
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
    this.index = new WeakMap();
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
  constructor() {
    // array of ChartItems
    this.hypothesis = [];
    this.hypothesis_idx = 0;

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
  }

  /**
   * Add chartItem to the Chart
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
    this.existChartItems.add(chartItem.hashCode());
    this.hypothesis.push(ChartItem);

    const nextSymbol = chartItem.nextSymbol();

    if (nextSymbol instanceof NonTerminal) {
      this.waitingRules.add(nextSymbol, chartItem.eidx, chartItem);
    }

    if (chartItem.isReduced()) {
      this.reducedRules.add(chartItem.lhs, chartItem.sidx, chartItem);
    }
  }

  getReduced(symbol, idx) {
    return this.reducedRules.get(symbol, idx);
  }

  getWaiting(symbol, idx) {
    return this.waitingRules.get(symbol, idx);
  }

  find(chartItem) {
    if (!this.existChartItems.has(chartItem.hashCode())) {
      return false;
    }
    // chartItem exists, find it and return
    const addingHashCode = chartItem.hashCode();
    return ChartItem.find(item => item.hashCode() === addingHashCode);
  }

  next() {
    return this.hypothesis[this.hypothesis_idx++];
  }
}

exports = module.exports = {
  ChartItemHistory,
  ChartItem,
  ChartItemIndex,
  Chart,
};
