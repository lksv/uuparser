'use strict';

const Chart = require('./chart').Chart;
const DefaultLogger = require('../utils/logger');

class Parser {
  constructor(grammar, type, opts = {}) {
    if (['bottomUp', 'topDown'].indexOf(type) === -1) {
      throw new Error('Unknown parser type!');
    }
    this.logger = opts.logger || new DefaultLogger();

    this.grammar = grammar;
    this.type = type;
    this.lexer = opts.lexer || Parser.defaultLexer;
    this.chart = new Chart(this.logger);

    // prohibit V8 to create hidden object later
    this.initedTime = null;
    this.startTime = null;
    this.chartDoneTime = null;
    this.startResultsTime = null;
    this.finishResultsTime = null;
  }

  /**
   * For given *reducedChartItem* edge as B → γ• <closedSidx, closedEidx>
   *
   * For bottomUp parser:
   *   For each rules C -> Bβ create edge: C -> •Bβ <closedSidx, closedSidx>
   *
   * Anytime:
   *   For all edges as A -> α•Bβ <openSidx, openEidx>
   *   put new edge: A -> αB•β <openSidx, closedEidx> to the agenda
   *
   * @param {ChartItem} reducedChartItem Edge to process
   * @returns {undefined}
   */
  completer(reducedChartItem) {
    if (this.type === 'bottomUp') {
      // create predicted chartItem for each rule *reducedChartItem.lhs*
      // in grammar
      this.grammar.rulesByFirstRhs(reducedChartItem.lhs).forEach(rule => {
        this.chart.addPredicted(rule, reducedChartItem.sidx);
      });
    }

    // go through waitingRules and create a new chartItems
    const waitingIter = this.chart.getWaiting(
      reducedChartItem.lhs,
      reducedChartItem.sidx
    );
    for (const open of waitingIter) {
      this.chart.addFromOpenClosed(open, reducedChartItem);
    }
  }

  /**
   * For given *open* edge as A -> α•Bβ <openSidx, openEidx>
   *
   * For topDown parser:
   *
   * Anytime:
   *   For each edge as B → γ• <closedSidx, closedEidx>
   *   put new edge A -> αB•β <openSidx, closedEidx> to the agenda
   * @param {ChartItem} open Edge to process
   * @returns {undefined}
   */
  predictor(open) {
    if (this.type === 'topDown') {
      // create predicted chartItems (i.e. with dot at the beginning)
      this.grammar.rulesByLhs(open.nextSymbol()).forEach(rule => {
        this.chart.addPredicted(rule, open.eidx);
      });
    } else {
      // Needs to add all epsilon rules from eidx to the agenda
      //
      // For each edge as B → γ• <closedSidx, closedEidx>
      // put edges  B -> . <open.edix, open.eidx> to the agenda
      this.grammar.epsilonRulesByLhs(open.nextSymbol()).forEach(rule => {
        this.chart.addPredicted(rule, open.eidx);
      });
    }

    // go throuh reduced items and crete a new chartItems
    const reducedIter = this.chart.getReduced(
      open.nextSymbol(),
      open.eidx
    );
    for (const closed of reducedIter) {
      this.chart.addFromOpenClosed(open, closed);
    }
  }

  /**
   * For given edge as A -> α•aβ <sidx, eidx>
   * try to match terminal `a` in input string from position *eidx*
   *
   * @param {ChartItem} chartItem Edge to process
   * @return {undefined}
   */
  scanner(chartItem) {
    const symbol = chartItem.nextSymbol();
    // const [res, eidx] = symbol.match(this.input, chartItem.eidx);
    const [res, eidx] = this.lexer(symbol, this.input, chartItem.eidx);
    if (res) {
      this.chart.addScanned(chartItem, eidx, res);
    }
  }

  /**
   * Process given *chartItem*.
   * It may produce new edges stored in agenda.
   *
   * @param {ChartItem} chartItem Edge to process
   * @returns {undefined}
   */
  next(chartItem) {
    // when dot is at the end
    if (chartItem.isReducedItem()) {
      this.completer(chartItem);
    } else if (chartItem.isShiftItem()) {
      // when after dot is terminal
      this.scanner(chartItem);
    } else {
      // when after dot is non-terminal
      this.predictor(chartItem);
    }
  }

  /**
   * Parse given *input* string and generate all posible edges to chart
   *
   * @param {String} input Input string to parse
   * @return {undefined}
   */
  parse(input) {
    let currentChartItem;
    this.startTime = new Date().getTime();

    // TODO: do not like when setting "object state" (e.i. input) here,
    // but, creating a new class to connect parser with a particular input
    // is quite over-whatever... :(
    this.input = input;


    if (this.type === 'bottomUp') this.initBottomUp();
    if (this.type === 'topDown') this.initTopDown();

    this.initedTime = new Date().getTime();
    this.logger.debug(`Init Agenda edges=${this.chart.hypothesis.length}`);

    // eslint-disable-next-line
    while (currentChartItem = this.chart.next()) {
      this.next(currentChartItem);
    }
    this.chartDoneTime = new Date().getTime();
    const chartTakesTime = this.chartDoneTime - this.initedTime;
    this.logger.info(
      `Finish Chart edges=${this.chart.hypothesis.length}, time ${chartTakesTime}`
    );
  }

  /**
   * Return semantic representation (or AST) of parserd input.
   * Should be used after #parse() method
   *
   * @param {Boolean} full=true returns only fully parsed results when true
   * @returns {Array} array of NodeResult
   */
  results(full = true) {
    this.startResultsTime = new Date().getTime();
    if (!this.input) {
      throw new Error('Input not set (you propably do not call #parse() method)');
    }
    let parsedEdges = this.chart.parentEntities();
    this.logger.info(`Parent Entity Edges count: ${parsedEdges.length}`);
    if (full) {
      parsedEdges = parsedEdges.filter(
        edge => (edge.sidx === 0 && edge.eidx === this.input.length)
      );
      // filter priority
      parsedEdges.sort((a, b) => (b.rule.priority || 0) - (a.rule.priority || 0))
      const maxPriority = parsedEdges[0] && parsedEdges[0].rule.priority;
      parsedEdges = parsedEdges.filter(
        edge => (!edge.rule.priority) || (edge.rule.priority === maxPriority)
      );
      this.logger.info(`Parent Full Edges count: ${parsedEdges.length}`);
    }
    const results = parsedEdges.reduce(
      (storage, edge) => storage.concat(edge.semRes(0, this.logger)),
      []
    );

    this.finishResultsTime = new Date().getTime();
    this.logger.info(
      `Parser completed with ${results.length} results ` +
      `(${this.chart.hypothesis.length} edges). ${this._timeConsumption()}`
    );
    this.logger.debug(`results representations: ${results.map(r => r.txt).join(',  ')}`);

    return results;
  }

  _timeConsumption() {
    const initTakeTime = this.initedTime - this.startTime;
    const chartTakesTime = this.chartDoneTime - this.initedTime;
    const parserTakesTime = this.chartDoneTime - this.startTime;
    const resultsTakesTime = this.finishResultsTime - this.startResultsTime;
    const overallTakesTime = parserTakesTime + resultsTakesTime;
    return `Computed in ${overallTakesTime}ms` +
     ` (Init: ${initTakeTime}ms | Chart: ${chartTakesTime}ms | results: ${resultsTakesTime}ms)`;
  }

  initTopDown() {
    this.grammar.entityRules().forEach(
      rule => this.chart.addInitial(0, rule)
    );
  }

  initBottomUp() {
    // TODO: for speedup, add only rules which are derivated from entiti rules
    this.grammar.terminalStartRules().forEach(
      rule => {
        rule.rhs[0].matchAll(
          this.input,
          // TODO: needs to employ this.lexer for calculating eidx
          (match, sidx, eidx) => this.chart.addInitial(sidx, rule, eidx, match)
        );
      }
    );
  }

  /**
   * Try to match given *symbol* in *inputString* from *sidx* position.
   * Returns array of two items:
   * * matched string
   * * position in *inputString* upto the symbol was matched to
   *
   * @param {Symbol} symbol Nonterminal to match
   * @param {String} inputString Input string
   * @param {Number} sidx Position to match from
   * @returns {Array} Matched string and eidx position
   */
  static defaultLexer(symbol, inputString, sidx) {
    const [res, eidx] = symbol.match(inputString, sidx);
    if (!res) {
      return [undefined, undefined];
    }
    // static constant, how to set it that in JS?
    const r = new RegExp('\\s+', 'ym');
    r.lastIndex = eidx;
    if (r.exec(inputString)) {
      return [res, r.lastIndex];
    }
    return [res, eidx];
  }
}

exports = module.exports = Parser;
