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
    // TODO: do not like when setting "state" (e.i. input) here,
    // but, creating a new class to connect parser with a particular input
    // is quite over-whatever... :(
    this.input = input;

    if (this.type === 'bottomUp') this.initBottomUp();
    if (this.type === 'topDown') this.initTopDown();

    // eslint-disable-next-line
    while (currentChartItem = this.chart.next()) {
      this.next(currentChartItem);
    }
  }

  initTopDown() {
    this.grammar.entityRules().forEach(
      rule => this.chart.addInitial(0, rule)
    );
  }

  initBottomUp() {
    this.grammar.terminalStartRules().forEach(
      // TODO(?): for speedup is added both edge now
      // on the other hand code will be less maintainable
      rule => {
        rule.matchAll(
          ([match, sidx, eidx]) => this.chart.addInitial(sidx, rule, eidx, match)
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
