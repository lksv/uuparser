const charts = require('./chart');
const Chart = charts.Chart;
const ChartItem = charts.ChartItem;

class Parser {
  constructor(grammar, type, lexer) {
    if (['bottomUp', 'topDown'].indexOf(type) === -1) {
      throw new Error('Unknown parser type!');
    }

    this.grammar = grammar;
    this.type = type;
    this.lexer = lexer || Parser.defaultLexer;
    this.chart = new Chart();
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
    for (let open of waitingIter) {
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
    for (let closed of reducedIter) {
      this.chart.addFromOpenClosed(open, closed);
    }
  }

  scanner(chartItem) {
    const symbol = chartItem.nextSymbol();
    const [res, eidx] = symbol.match(this.input, chartItem.eidx);
    if (res) {
      const newChartItem = new ChartItem(chartItem, {
        dot: chartItem.dot + 1,
        eidx,
        open: chartItem,
        semRes: res,
      });
      this.chart.add(newChartItem);
    }
  }

  next(currentChartItem) {
    // when dot is at the end
    if (currentChartItem.isReducedItem()) {
      this.completer(currentChartItem);
    } else if (currentChartItem.isShiftItem()) {
      // when after dot is terminal
      this.scanner(currentChartItem);
    } else {
      // when after dot is non-terminal
      this.predictor(currentChartItem);
    }
  }

  parse(input) {
    let currentChartItem;
    // TODO: do not like when setting "state" (e.i. input) here,
    // but, creating a new class to connect parser with a particular input
    // is quite over-whatever... :(
    this.input = input;

    while (currentChartItem = this.chart.next()) {
      this.next(currentChartItem);
    }
  }

  static defaultLexer(symbol, inputString, sidx) {
    const [res, eidx] = symbol.match(inputString, sidx);
    if (!res) {
      return [undefined, undefined];
    }
    // static constant, how to set it that in JS?
    const r = RegExp.new('\\s+', 'ym');
    r.lastIndex = eidx;
    if (r.exec(inputString)) {
      return [res, r.lastIndex];
    }
    return [res, eidx];
  }
}

exports = module.exports = Parser;
