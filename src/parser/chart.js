'use strict';

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
const { ApproxTerminal, NonTerminal } = require('../grammar');
const { NodeResult, NodeResultArgs } = require('./semres');
const DefaultLogger = require('../utils/logger');

/**
 * Structure to store information about how to chartItem (edge) was created form
 * consists of:
 * * open  - how was the symbols in RSH created form
 * * closed - how was the NonTerminal on the dot created
 * * termMatch - the parsered string of the terminals
 */
class ChartItemHistory {
  constructor(open, closed, termMatch) {
    this.open = open;
    this.closed = closed;
    this.termMatch = termMatch;

    // eslint-disable-next-line
    this.code = (this.open ? this.open.code : 'null') +
      ':' +
      (this.closed ? this.closed.code : 'null');
  }

  /**
   * Returns priority of closed edge.
   *
   * @returns {Integer|undefined} priority of rule of closed edge
   */
  closedPriority() {
    return this.closed && this.closed.rule.priority;
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
    this.sidx = Number.isInteger(cloneFrom2.sidx) ? cloneFrom2.sidx : cloneFrom.sidx;
    this.eidx = Number.isInteger(cloneFrom2.eidx) ? cloneFrom2.eidx : cloneFrom.eidx;
    this.rule = cloneFrom2.rule || cloneFrom.rule;
    this.dot  = Number.isInteger(cloneFrom2.dot) ? cloneFrom2.dot : (cloneFrom.dot || 0); // eslint-disable-line
    this._marked = false;

    const open = cloneFrom2.open || cloneFrom.open;
    const closed = cloneFrom2.closed || cloneFrom.closed;
    if (open || closed || cloneFrom.termMatch || cloneFrom2.termMatch) {
      const termMatch = cloneFrom2.termMatch || cloneFrom.termMatch;
      this.history.push(new ChartItemHistory(open, closed, termMatch));
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
   * @return {Boolean} true when the symbol under the dot is Terminal, otherwise false
   */
  isShiftItem() {
    return !(this.nextSymbol() instanceof NonTerminal);
  }

  isApproxItem() {
    return (this.nextSymbol() instanceof ApproxTerminal);
  }

  /**
   * An ChartItem with dot at the end (i.e. dot is after the RHS)
   * is called reduced item.
   * @returns {Boolean} true when the dot is at the end.
   */
  isReducedItem() {
    return !this.nextSymbol();
  }

  /**
   * An ChartItem with dot at beginnging (i.g. dot is in front of RHS)
   * is called predicted item.
   * @returns {Boolean} true when the dot is at beginnging
   */
  isPredictedItem() {
    return this.dot === 0;
  }

  /**
   * Returns filtered history array by priority.
   *
   * It is filtered by closed rule priproty.
   * Hypothesis without defined priority aren't filtered
   * It is taken hypothesis with the highest priority.
   *
   * @returns {Array} array of hypothesis with the highest priority (or the without defined one)
   */
  _filteredHistory() {
    // descendant sort by the priority
    const sortedHistory = this.history.sort(
      (a, b) => ((b.closedPriority() || 0) - (a.closedPriority() || 0))
    );
    const currentPriority = sortedHistory[0] && sortedHistory[0].closedPriority() || -1;
    const priorityFilterdHistory = sortedHistory.filter(
      item => {
        const p = item.closedPriority();
        return !p || p === currentPriority;
      }
    );

    // filter out history with any position matching if there is
    // also same history with particular location
    const anyPositionFilteredHistory = priorityFilterdHistory.filter(
      item => {
        if (item.open && (item.open.sidx === undefined)) {
          return !priorityFilterdHistory.find(
            h => (
              (h.open && (h.open.sidx !== undefined)) &&
              (h.open.rule === item.open.rule) &&
              (h.closed.code === item.closed.code)
            )
          );
        } else if (item.closed && (item.closed.sidx === undefined)) {
          return !priorityFilterdHistory.find(
            h => (
              (h.closed && (h.closed.sidx !== undefined)) &&
              (h.closed.rule === item.closed.rule) &&
              (h.open.code === item.open.code)
            )
          );
        }
        return true;
      }
    );
    return anyPositionFilteredHistory;
  }

  /**
   * Returns array of:
   * * NodeResult for reduced edges
   * * NodeResultArgs otherwise
   *
   * @param {Number} nested recursive counder
   * @param {Logger} [logger=undefined] logger to log semRes computation
   * @returns {Array} array of NodeResultArgs or NodeResult
   */
  semRes(nested = 0, logger) {
    if (this._semRes) {
      return this._semRes;
    }

    if (this.isPredictedItem() && this.isReducedItem()) {
      return [new NodeResultArgs([]).apply(
        this.rule.semRes,
        this.rule.weight,
        this.rule.lhs.name
      )];
    }
    if (this.isPredictedItem()) {
      return [new NodeResultArgs([])];
    }

    const indentLogger = logger ? this._logIndent.bind(
      this,
      logger,
      nested * 2
    ) : () => undefined;
    indentLogger(() => `Entering semRes ${this.toString()}`);

    let nodeResultsArgs = []; // eslint-disable-line vars-on-top

    this._filteredHistory().forEach(h => {
      const openSemRes = h.open.semRes(nested + 1, logger);
      const closedSemRes = h.termMatch
        ? h.termMatch.map(tm => new NodeResult(tm, 1.0, `"${tm}"`, this.sidx, this.eidx))
        : h.closed.semRes(nested + 1, logger);
      indentLogger(() => `OpenSemRes: ${this._nrsToString(openSemRes)}`);
      indentLogger(() => `ClosedSemRes: ${this._nrasToString(closedSemRes)}`);
      openSemRes.forEach(nrArgs => {
        const t = nrArgs.multiply(closedSemRes);
        nodeResultsArgs = nodeResultsArgs.concat(t);
      });
    });

    if (this.isReducedItem()) {
      const res = nodeResultsArgs.map(nra => nra.apply(
        this.rule.semRes,
        this.rule.weight,
        this.rule.lhs.name,
        this.sidx,
        this.eidx
      ));
      indentLogger(() =>
       `Leaving closed  semRes ${this.toString()} with result: ${this._nrsToString(res)}`
      );
      this._semRes = res;
      return res;
    }
    indentLogger(() =>
      `Leaving open semRes ${this.toString()} with results: ${this._nrasToString(nodeResultsArgs)}`
    );
    this._semRes = nodeResultsArgs;
    return nodeResultsArgs;
  }

  _nrsToString(nrs) {
    return nrs.map(nr => nr.toString()).join(', ');
  }

  _nrasToString(nras) {
    return nras.map(nra => nra.toString()).join(', ');
  }

  _logIndent(logger, indent, str) {
    const spaces = ' '.repeat(indent);
    logger.debug(`${spaces}${str()}`);
  }

  /**
   * Copy history form other chartItem to this
   * Throws exception if this and other differs
   *
   * @param {ChartItem} other The source of history
   * @returns {undefined}
   */
  copyHistoryFrom(other) {
    if (this.code !== other.code) {
      throw new Error('Cannot copy history form different ChartItem');
    }

    other.history.forEach(otherHistory => {
      const otherHistoryHashCode = otherHistory.code;
      if (!this.history.find(h => (h.code === otherHistoryHashCode))) {
        // console.log(
        //   'otherHistory',
        //   otherHistory.open.toString(), otherHistory.closed.toString()
        // );
        // this.history.forEach(h =>
        //   console.log(' myHistory', h.open.toString(), h.closed.toString())
        // );
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
   * @returns {undefined}
   */
  _deepMark(nested) {
    if (this._marked) return;
    if (nested <= 0) this._marked = true;
    this.history.forEach(h => {
      if (h.open) h.open._deepMark(nested - 1);
      if (h.closed) h.closed._deepMark(nested - 1);
    });
  }

  toString() {
    const rhsBeforeDot = this.rule.rhs.slice(0, this.dot);
    const rhsAfterDot  = this.rule.rhs.slice(this.dot); // eslint-disable-line
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
   * @param {GrmSymbol} symbol Symbol to search
   * @param {Nuber} idx Index to search
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
   * @param {GrmSymbol} symbol Symbol to index by
   * @param {Number} idx Number to index by
   * @param {ChartItem} chartItem Edge to store
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

    // used in initial phase for bottomUp parser
    this.initChartHypothesis = [];
    this.nextRoundHypothesis = [];

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

    this.logger = logger || new DefaultLogger();
  }

  parserInitialized() {
    this.hypothesisIdx += this.initChartHypothesis.length;
    this.hypothesis = this.initChartHypothesis.concat(this.hypothesis);
    this.initChartHypothesis.length = 0;
  }

  /**
   * Add chartItem to the agenda
   * it also update all indexes (waitingRules, reducedRules)
   *
   * Private method, use #addFromOpenClosed, #addPredicted, #addScanned instead
   *
   * @param {ChartItem} chartItem Edge to store
   * @param {Array} storage=this.hypothesis where to put hypothesis
   * @returns {undefined}
   */
  _add(chartItem, storage = this.hypothesis) {
    const alreadyExists = this.find(chartItem);
    if (alreadyExists) {
      // do not add chartItem if already exists in Chart
      // but it is necessary to copy all chartItem.history
      alreadyExists.copyHistoryFrom(chartItem);
      return;
    }
    this.existChartItems.add(chartItem.code);

    const nextSymbol = chartItem.nextSymbol();

    const currentStorage = (nextSymbol instanceof ApproxTerminal)
      ? this.nextRoundHypothesis
      : storage;

    currentStorage.push(chartItem);

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
   * This method check for opPrecedence and association.
   * It might cancel adding a new edge in case of wrong association or opPrecedence
   *
   *
   * @param {ChartItem} open - open edge
   * @param {ChartItem} closed - closed edge
   * @returns {undefined}
   */
  addFromOpenClosed(open, closed) {
    /* eslint-disable no-cond-assign */
    let po, pc, oa, ca; // eslint-disable-line one-var-declaration-per-line, one-var
    // rule operator precedence check
    if ((po = open.rule.opPrecedence_keys) &&
        (pc = closed.rule.opPrecedence_keys) &&
        [...po].find(key => (
          pc.has(key) &&
          (open.rule.opPrecedence.get(key) > closed.rule.opPrecedence.get(key))
          )
        )
       ) {
      this.logger.debug('  addFromOpenClosed canceling by precedence.');
      return;
    }
    // left association check
    if ((open.dot !== 0) &&
        (oa = open.rule.left_assoc) &&
        (ca = closed.rule.left_assoc) &&
        ([...oa].filter(x => ca.has(x)).length > 0)) {
      this.logger.debug(`  addFromOpenClosed canceling by left_assoc: ${[...oa]} & ${[...ca]}`);
      return;
    }
    // right association check
    if ((open.dot < open.rule.rhs.length - 1) && // isn't on the last symbol
        (oa = open.rule.right_assoc) &&
        (ca = closed.rule.right_assoc) &&
        ([...oa].filter(x => ca.has(x)).length > 0)) {
      this.logger.debug(`  addFromOpenClosed canceling by right_assoc: ${[...oa]} & ${[...ca]}`);
      return;
    }
    // non-association check
    if (
        (oa = open.rule.non_assoc) &&
        (ca = closed.rule.non_assoc) &&
        ([...oa].filter(x => ca.has(x)).length > 0)) {
      this.logger.debug(`  addFromOpenClosed canceling by non_assoc: ${[...oa]} & ${[...ca]}`);
      return;
    }
    /* eslint-enable no-cond-assign */

    // special case of rules starting on empty Nonterminals:
    // In this case open.sidx is undefined and is needed to assign
    // it as closed.sidx
    const sidx = (open.sidx !== undefined) ? open.sidx : closed.sidx;
    const newEdge = new ChartItem(open, {
      sidx,
      eidx: closed.eidx,
      dot: open.dot + 1,
      open,
      closed,
    });
    this.logger.debug(`  addFromOpenClosed: ${newEdge}`);
    this._add(newEdge);
  }

  /**
   * Add new (predicted) edge to the agenda
   * @param {Rule} rule Grammar rule to create edge for
   * @param {Number} idx The *sidx* and *eidx* initial values
   * @returns {undefined}
   */
  addPredicted(rule, idx) {
    const newEdge = new ChartItem({
      sidx: idx,
      eidx: idx,
      dot:  0,  //eslint-disable-line
      rule,
    });
    this.logger.debug(`  addPredicted: ${newEdge}`);
    this._add(newEdge);
  }

  /**
   * Add new edge which consumes (jumps) over Terminal
   *
   * @param {ChartItem} chartItem Edge to process
   * @param {Number} eidx Index in input we are consumed to
   * @param {Object} termMatch result of *match* symbol.method
   *                            (usually the string we consumed from input)
   * @param {Number} sidx Index in input where the scanned terminal was matched from
   * @returns {undefined}
   */
  addScanned(chartItem, eidx, termMatch, sidx) {
    const newEdge = new ChartItem(chartItem, {
      dot: chartItem.dot + 1,
      eidx,
      open: chartItem,
      termMatch,
      sidx: Number.isInteger(sidx) ? sidx : chartItem.sidx,
    });
    this.logger.debug(`  addScanner: ${newEdge}`);
    this._add(newEdge);
  }

  /**
   * Create initial ChartItem(s).
   *
   * @param {Number} idx sidx for initial edge
   * @param {Rule} rule rule Edge rule
   * @returns {undefined}
   */
  addInitial(idx, rule) {
    const open = new ChartItem({
      dot: 0,
      sidx: idx,
      eidx: idx,
      rule,
    });
    this.logger.debug(`  adding to agenda ${open.toString()}`);
    this._add(open);
  }

  /**
   * Create initial ChartItem(s).
   * Put initial edge to chart and also one edge with skipped firt terminal to agenda
   *
   * @param {Number} idx sidx for initial edge
   * @param {Rule} rule rule Edge rule
   * @param {Number} eidx eidx for the second rule
   * @param {String|NodeResult} termMatch termMatch for the second rule
   * @returns {undefined}
   */
  addInitialProcessed(idx, rule, eidx, termMatch) {
    const open = new ChartItem({
      dot: 0,
      sidx: idx,
      eidx: idx,
      rule,
    });
    this.logger.debug(`  adding to agenda ${open.toString()}`);
    this._add(open, this.initChartHypothesis);

    const matchedEdge = new ChartItem({
      dot: 1,
      sidx: idx,
      eidx,
      rule,
      open,
      termMatch: [termMatch],
    });
    this.logger.debug(`  adding to chart ${matchedEdge.toString()}`);
    this._add(matchedEdge);
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
    return this.hypothesis.find(item => item.code === addingHashCode) ||
      this.nextRoundHypothesis.find(item => item.code === addingHashCode);
  }

  next() {
    const currentEdge = this.hypothesis[this.hypothesisIdx++];
    this.logger.debug(`processing edge[${this.hypothesisIdx}]: ${currentEdge}`);
    return currentEdge;
  }

  isAgendaEmpty() {
    return this.hypothesis.length <= this.hypothesisIdx;
  }

  /**
   * returns reduced edges from chart (and agenda) which parse *entity* rule
   * and only that which are not children (not in the history) of
   * another parentEntities
   *
   * @returns {Array} Filtered array of chartItems form chart
   */
  parentEntities() {
    const allEntities = this.hypothesis.filter(edge => edge.rule.entity && edge.isReducedItem());
    allEntities.forEach(edge => edge._deepMark(1));
    const parentEntities = allEntities.filter(edge => !edge._marked);
    this.logger.debug(`parentEntities: ${parentEntities}`);
    return parentEntities;
  }

  /**
   * Returns number edges in agenda, e.g. number to edges needs to be processed
   *
   * @returns {number} Number of edges in agenda
   */
  agendaSize() {
    return this.hypothesis.length - this.hypothesisIdx;
  }
}

exports = module.exports = {
  ChartItemHistory,
  ChartItem,
  ChartItemIndex,
  Chart,
};
