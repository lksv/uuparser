const charts = require('./chart');
const Chart = charts.Chart;
const ChartItem = charts.ChartItem;

class Parser {
  constructor(grammar, type, lexer) {
    if (!['bottomUp', 'topDown'].find(type)) {
      throw new Error('Unknown parser type!');
    }

    this.grammar = grammar;
    this.type = type;
    this.lexer = lexer || this.defaultLexer;
    this.chart = new Chart();
  }

  completer(reducedChartItem) {
    // go through waitingRules and create a new chartItems
    this.chart.getWaiting(
      reducedChartItem.lhs,
      reducedChartItem.sidx
    ).forEach(open => {
      this.chart.addFromOpenClosed(open, reducedChartItem);
    });

    if (this.type === 'bottomUp') {
      // create predicted chartItem for each rule *reducedChartItem.lhs*
      // in grammar
      this.grammar.rulesByFirstRhs(reducedChartItem.lhs).forEach(rule => {
        this.chart.addPredicted(rule, reducedChartItem.sidx);
      });
    }
  }

  predictor(open) {
    // go throuh reduced items and crete a new chartItems
    this.chart.getReduced(
      open.nextSymbol(),
      open.eidx
    ).forEach(closed => {
      this.chart.addFromOpenClosed(open, closed);
    });

    if (this.type === 'topDown') {
      // create predicted chartItems (i.e. with dot at the beginning)
      this.grammar.rulesByLhs(open.nextSymbol()).forEach(rule => {
        this.chart.addPredicted(rule, open.eidx);
      });
    }
  }

  scanner(chartItem) {
    const symbol = ChartItem.nextSymbol();
    const [res, eidx] = symbol.match(this.input, chartItem.eidx);
    if (res) {
      const newChartItem = new ChartItem(chartItem, {
        dot: chartItem.dot + 1,
        eidx,
        open: chartItem,
        semRes: [res],
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
