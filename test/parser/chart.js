/* eslint-disable no-unused-expressions */

const expect = require('chai').expect;

const parser = require('../..');
const {
  Rule,
  Terminal,
  NonTerminal,
  ChartItemHistory,
  ChartItem,
  ChartItemIndex,
  Chart,
  NodeResultArgs,
  NodeResult,
} = parser;

const lhs = new NonTerminal('A');

describe('ChartItemHistory', () => {
  const rule = new Rule(new NonTerminal('A'), [new NonTerminal('B')]);
  // TODO: it's integration test, not unit
  describe('.code', () => {
    const chartItem1 = new ChartItem({
      dot: 0,
      sidx: 1,
      eidx: 2,
      rule,
    });
    const chartItem2 = new ChartItem(chartItem1, { dot: 2, eidx: 2 });

    it('should return same code for same open & closed chartItems', () => {
      const subject = new ChartItemHistory(chartItem1, chartItem2);
      const same = new ChartItemHistory(
        new ChartItem(chartItem1),
        new ChartItem(chartItem2)
      );
      expect(subject.code).to.equal(same.code);
    });

    it('should return different code when open or closed ChartItem differs', () => {
      const subject = new ChartItemHistory(chartItem1, chartItem2);
      const other = new ChartItemHistory(
        new ChartItem(chartItem1, { dot: 1 }),
        new ChartItem(chartItem2)
      );
      expect(subject.code).to.not.equal(other.code);
    });
  });
});

describe('ChartItem', () => {
  const rhs = [
    new NonTerminal('B'),
    new Terminal('word'),
    new NonTerminal('C'),
  ];
  const rule = new Rule(
    lhs,
    rhs
  );
  let subject;
  beforeEach(() => {
    subject = new ChartItem({
      sidx: 1,
      eidx: 1,
      dot: 1,
      rule,
    });
  });

  it('should create ChartItem by clonning form another one', () => {
    subject = new ChartItem({ sidx: 1, eidx: 2, dot: 3, rule, open: 'stub-o', closed: 'stub-c' });
    expect(subject.sidx).to.equal(1);
    expect(subject.eidx).to.equal(2);
    expect(subject.dot).to.equal(3);
    expect(subject.rule).to.equal(rule);
    expect(subject.history[0].open).to.equal('stub-o');
    expect(subject.history[0].closed).to.equal('stub-c');
  });

  it('should create ChartItem by prefer clonning forom second param when defined', () => {
    const secondRule = new Rule(new NonTerminal('X'), rhs);
    subject = new ChartItem(
      { sidx: 1, eidx: 2, dot: 3, rule, open: 'stub-o1', closed: 'stub-c1' },
      { sidx: 4, eidx: 5, dot: 6, rule: secondRule, open: 'stub-o2', closed: 'stub-c2' }
    );
    expect(subject.sidx).to.equal(4);
    expect(subject.eidx).to.equal(5);
    expect(subject.dot).to.equal(6);
    expect(subject.rule).to.equal(secondRule);
    expect(subject.history[0].open).to.equal('stub-o2');
    expect(subject.history[0].closed).to.equal('stub-c2');
  });

  it('should not clone history', () => {
    subject = new ChartItem(
      { sidx: 1, eidx: 2, dot: 3, rule, history: ['stub'] },
      { history: ['stub'] }
    );
    expect(subject.history).to.eql([]);
  });

  describe('#copyHistoryFrom', () => {
    it('it add new history', () => {
      const history = new ChartItemHistory(
        new ChartItem({ sidx: 0, eidx: 0, dot: 0, rule }),
        new ChartItem({ sidx: 0, eidx: 0, dot: 0, rule })
      );
      const chartItem = new ChartItem({ sidx: 1, eidx: 2, dot: 3, rule });
      chartItem.history.push(history);

      subject = new ChartItem({ sidx: 1, eidx: 2, dot: 3, rule });
      subject.copyHistoryFrom(chartItem);
      expect(subject.history).to.eql([history]);
    });

    it('do not duplicate history when already exists', () => {
      const history = new ChartItemHistory(
        new ChartItem({ sidx: 0, eidx: 0, dot: 0, rule }),
        new ChartItem({ sidx: 0, eidx: 0, dot: 0, rule })
      );
      const chartItem = new ChartItem({ sidx: 1, eidx: 2, dot: 3, rule });
      chartItem.history.push(history);

      subject = new ChartItem({ sidx: 1, eidx: 2, dot: 3, rule });
      subject.history.push(history);
      subject.copyHistoryFrom(chartItem);
      expect(subject.history).to.eql([history]);
    });
  });

  describe('lhs', () => {
    it('delegates to rule.lhs', () => {
      expect(subject.lhs).to.equal(subject.rule.lhs);
    });
  });

  describe('#nextSymbol', () => {
    it('returns first rhs symbol when chartItem is predicted', () => {
      subject.dot = 0;
      expect(subject.nextSymbol()).to.equal(rhs[0]);
    });

    it('returns rhs symbol under dot', () => {
      subject.dot = 1;
      expect(subject.nextSymbol()).to.equal(rhs[subject.dot]);
    });

    it('returns undefined when chartItem is reduced', () => {
      subject.dot = 100;
      expect(subject.nextSymbol()).to.equal(undefined);
    });
  });

  describe('#isShiftItem', () => {
    it('returns false when current symbol is NonTerminal', () => {
      subject.dot = 0;
      expect(subject.isShiftItem()).to.equal(false);
    });
    it('returns true when current symbol is Terminal', () => {
      subject.dot = 1;
      expect(subject.isShiftItem()).to.equal(true);
    });
  });

  describe('#isReducedItem', () => {
    it('returns true for empty rule', () => {
      subject = new ChartItem({
        rule: new Rule(lhs, []),
        dot: 0,
        sidx: 0,
        eidx: 0,
      });
      expect(subject.isReducedItem()).to.equal(true);
    });

    it('returns false when dot is not at the end', () => {
      subject.dot = 1;
      expect(subject.isReducedItem()).to.equal(false);
    });

    it('returns true when dot is at the end', () => {
      subject.dot = subject.rule.rhs.length; // point to the end
      expect(subject.isReducedItem()).to.equal(true);
    });
  });

  describe('#_filteredHistory', () => {
    let constructClosedIter = 0;
    const constructClosed = (priority) => {
      const priorityRule = new Rule(lhs, rhs, undefined, { priority });
      return new ChartItem({
        sidx: constructClosedIter++,
        eidx: 1,
        dot: 1,
        rule: priorityRule,
      });
    };

    const closedUndef1 = new ChartItemHistory(null, constructClosed(undefined));
    const closedUndef2 = new ChartItemHistory(null, constructClosed(undefined));
    const closed10a = new ChartItemHistory(null, constructClosed(10));
    const closed10b = new ChartItemHistory(null, constructClosed(10));
    const closed1 = new ChartItemHistory(null, constructClosed(1));
    const closed5 = new ChartItemHistory(null, constructClosed(5));

    it('should not filter hypothesis witout priority', () => {
      subject.history.push(closedUndef1);
      subject.history.push(closed10a);
      subject.history.push(closedUndef2);
      expect(subject._filteredHistory()).to.eql(subject.history);
    });

    it('should filter out hypothesis with lower priority', () => {
      subject.history.push(closed1);
      subject.history.push(closed10a);
      subject.history.push(closed10b);
      subject.history.push(closed5);
      expect(subject._filteredHistory()).to.eql([closed10a, closed10b]);
    });
  });

  describe('#semRes', () => {
    it('returns array with rule.semRes() applied to empty NodeResultArgs for A -> .', () => {
      subject = new ChartItem({
        rule: new Rule(lhs, [], () => 'Yes', { weight: 0.7 }),
        dot: 0,
        sidx: 0,
        eidx: 0,
      });

      expect(subject.semRes()).to.eql([
        new NodeResult('Yes', 0.7, 'A()'),
      ]);
    });

    it('returns [NodeResultArgs()] for predicted edge (A -> . A)', () => {
      subject = new ChartItem({ rule: new Rule(lhs, [lhs]), dot: 0, sidx: 0, eidx: 0 });
      expect(subject.semRes()).to.eql([
        new NodeResultArgs([]),
      ]);
    });

    it('shuld use history `termMatch` for terminal symbol (A->"x".)', () => {
      const ruleX = new Rule(lhs, [new Terminal('x')], (_, x) => x);
      const open = new ChartItem({ rule: ruleX, dot: 0, sidx: 0, eidx: 0 });
      subject = new ChartItem({ rule: ruleX, dot: 1, sidx: 0, eidx: 1, open, termMatch: ['x'] });
      expect(subject.semRes()).to.eql([
        new NodeResult('x', 1.0, 'A("x")', 0, 1),
      ]);
    });

    it('it should recursivly use semRes of open & closed edgres (A->B C.)', () => {
      const ruleABC = new Rule(
        new NonTerminal('A'),
        [new NonTerminal('B'), new NonTerminal('C')],
        (_, b, c) => `${b}:${c}`
      );
      const ruleC = new Rule(new NonTerminal('C'), []);

      const open = new ChartItem({ rule: ruleABC, dot: 1, sidx: 0, eidx: 0 });
      open._semRes = [new NodeResultArgs([new NodeResult('B', 1.0, 'B()')])];
      const closed = new ChartItem({ rule: ruleC, dot: 0, sidx: 0, eidx: 0 });
      closed._semRes = [new NodeResult('C', 1.0, 'C()')];

      subject = new ChartItem({
        rule: ruleABC,
        dot: 2,
        sidx: 0,
        eidx: 0,
        open,
        closed,
      });
      expect(subject.semRes()).to.eql([
        new NodeResult('B:C', 1.0, 'A(B(), C())', 0, 0),
      ]);
    });
    context('when history contains alternatives', () => {
      it('shuld permutate all alternatives A -> B C.', () => {
        const ruleABC = new Rule(
          new NonTerminal('A'),
          [new NonTerminal('B'), new NonTerminal('C')],
          (_, b, c) => `${b}:${c}`
        );
        const ruleC = new Rule(new NonTerminal('C'), []);

        const open = new ChartItem({ rule: ruleABC, dot: 1, sidx: 0, eidx: 0 });
        open._semRes = [
          new NodeResultArgs([new NodeResult('B1', 1.0, 'B()')]),
          new NodeResultArgs([new NodeResult('B2', 0.9, 'B()')]),
        ];
        const closed = new ChartItem({ rule: ruleC, dot: 0, sidx: 0, eidx: 0 });
        closed._semRes = [
          new NodeResult('C1', 1.0, 'C()'),
          new NodeResult('C2', 0.7, 'C()'),
        ];

        subject = new ChartItem({
          rule: ruleABC,
          dot: 2,
          sidx: 0,
          eidx: 0,
          open,
          closed,
        });
        expect(subject.semRes()).to.eql([
          new NodeResult('B1:C1', 1.0, 'A(B(), C())', 0, 0),
          new NodeResult('B1:C2', 0.7, 'A(B(), C())', 0, 0),
          new NodeResult('B2:C1', 0.9, 'A(B(), C())', 0, 0),
          new NodeResult('B2:C2', 0.63, 'A(B(), C())', 0, 0),
        ]);
      });
    });
  });
});


describe('ChartItemIndex', () => {
  const chartItem1 = new ChartItem({
    rule: new Rule(lhs, []),
    dot: 0,
    sidx: 0,
    eidx: 0,
  });
  const chartItem2 = new ChartItem({
    rule: new Rule(lhs, [lhs]),
    dot: 0,
    sidx: 0,
    eidx: 0,
  });

  describe('#get', () => {
    it('should return empty iterator when {symbol,idx} was added', () => {
      const subject = new ChartItemIndex();
      expect(Array.from(subject.get(lhs, 0))).to.eql([]);
    });

    it('should get added charItem', () => {
      const subject = new ChartItemIndex();
      subject.add(lhs, 0, chartItem1);
      expect(Array.from(subject.get(lhs, 0))).to.eql([chartItem1]);
    });

    it('should unique added chartItem', () => {
      const subject = new ChartItemIndex();
      subject.add(lhs, 0, chartItem1);
      subject.add(lhs, 0, chartItem1);
      subject.add(lhs, 0, new ChartItem(chartItem1));
      expect(Array.from(subject.get(lhs, 0))).to.eql([chartItem1]);
    });

    it('should return array of added chartItems', () => {
      const subject = new ChartItemIndex();
      subject.add(lhs, 0, chartItem1);
      subject.add(lhs, 0, chartItem1);
      subject.add(lhs, 0, chartItem2);
      subject.add(lhs, 0, chartItem2);
      expect(Array.from(subject.get(lhs, 0))).to.eql([chartItem1, chartItem2]);
    });
  });
});


describe('Chart', () => {
  const rule = new Rule(new NonTerminal('A'), [new NonTerminal('B')]);
  let subject;
  beforeEach(() => {
    subject = new Chart();
  });

  describe('#add', () => {
    it('add chart item when no already exists', () => {
      const chartItem = new ChartItem({ rule });
      subject._add(chartItem);
      expect(subject.hypothesis).to.eql([chartItem]);
    });

    it('update history of existing chart item when already exist', () => {
      const history = new ChartItemHistory(
        new ChartItem({ sidx: 0, eidx: 0, dot: 0, rule }),
        new ChartItem({ sidx: 0, eidx: 0, dot: 0, rule })
      );

      const chartItem1 = new ChartItem({ sidx: 0, eidx: 1, dot: 0, rule });
      const chartItem2 = new ChartItem({ sidx: 0, eidx: 1, dot: 0, rule });
      chartItem2.history.push(history);

      subject._add(chartItem1);
      subject._add(chartItem2);
      expect(subject.hypothesis).to.eql([chartItem1]);
      expect(subject.hypothesis[0].history).to.eql([history]);
    });
  });

  describe('#getReduced', () => {
    it('retun iterator over reduced items', () => {
      const chartItem1 = new ChartItem({ sidx: 10, rule, dot: 100 });
      const chartItem2 = new ChartItem({ sidx: 10, rule: new Rule(lhs, []) });
      subject._add(chartItem1);
      subject._add(chartItem2);

      const result = subject.getReduced(
        lhs,
        10
      );
      expect(Array.from(result)).to.eql(
        [chartItem1, chartItem2]
      );
    });

    it('should not return not reduced items', () => {
      const chartItem = new ChartItem({ sidx: 10, rule, eidx: 11 });
      subject._add(chartItem);
      const result = subject.getReduced(
        lhs,
        10
      );
      expect(Array.from(result)).to.eql([]);
    });
  });

  describe('#getWaiting', () => {
    it('return iterator over waiting items', () => {
      const terminal = new NonTerminal('QQQ');
      const rule1 = new Rule(lhs, [terminal]);
      const rule2 = new Rule(lhs, [new Terminal('Hi'), terminal]);
      const chartItem1 = new ChartItem({ rule: rule1, eidx: 15, dot: 0 });
      const chartItem2 = new ChartItem({ rule: rule2, eidx: 15, dot: 1 });

      subject._add(chartItem1);
      subject._add(chartItem2);

      const result = subject.getWaiting(terminal, 15);
      expect(Array.from(result)).to.eql([chartItem1, chartItem2]);
    });
  });

  describe('#find', () => {
    it('return undefined when charItem not exists', () => {
      const charItem = new ChartItem({ rule });
      expect(subject.find(charItem)).to.be.false;
    });

    it('return charItem when exists', () => {
      const chartItem = new ChartItem({ rule });
      subject._add(chartItem);
      expect(subject.find(new ChartItem({ rule }))).to.equal(chartItem);
    });
  });

  describe('#addFromOpenClosed', () => {
    it('add new edge to the chart hypothesis', () => {
      const ruleE2TermYes = new Rule(new NonTerminal('E'), [new Terminal('yes')]);
      const ruleS2termE = new Rule(
        new NonTerminal('A'),
        [new Terminal('term'), new NonTerminal('E')]
      );
      const reducedChartItem = new ChartItem({
        rule: ruleE2TermYes,
        sidx: 5,
        eidx: 8,
      });
      const open = new ChartItem({ rule: ruleS2termE, sidx: 5, eidx: 5, dot: 0 });
      subject._add(open);
      subject.addFromOpenClosed(open, reducedChartItem);
      const newEdge = subject.hypothesis[1];
      expect(newEdge.sidx).to.equal(5);
      expect(newEdge.eidx).to.equal(8);
      expect(newEdge.rule).to.eql(ruleS2termE);
      expect(newEdge.history[0].open).to.eql(open);
      expect(newEdge.history[0].closed).to.eql(reducedChartItem);
    });

    it('cancel adding when opPrecedence is higher then reduced edge', () => {
      const openRule = new Rule(
        lhs, [new NonTerminal('Y')], undefined, { opPrecedence: 'first:1,second:100' }
      );
      const closedRule = new Rule(
        new NonTerminal('Y'), [], undefined, { opPrecedence: 'first:1,other:12,second:10' }
      );
      const open = new ChartItem({ rule: openRule, sidx: 0, eidx: 5, dot: 0 });
      const closed = new ChartItem({ rule: closedRule, sidx: 5, eidx: 5, dot: 0 });

      subject._add(open);
      expect(
        () => subject.addFromOpenClosed(open, closed)
      ).to.not.change(subject.hypothesis, 'length');
    });

    it('cancel adding when left_assoc exists and dot isn\'t on begining', () => {
      const openRule = new Rule(
        lhs,
        [new Terminal('x'), new NonTerminal('Y')],
        undefined,
        { left_assoc: 'some,other' }
      );
      const closedRule = new Rule(
        new NonTerminal('Y'), [], undefined, { left_assoc: 'other, any' }
      );
      const open = new ChartItem({ rule: openRule, sidx: 0, eidx: 5, dot: 1 });
      const closed = new ChartItem({ rule: closedRule, sidx: 5, eidx: 5, dot: 0 });

      subject._add(open);
      expect(
        () => subject.addFromOpenClosed(open, closed)
      ).to.not.change(subject.hypothesis, 'length');
    });

    it('cancel adding when right_assoc exists and dot isn\'t on end', () => {
      const openRule = new Rule(
        lhs,
        [new NonTerminal('Y'), new Terminal('x')],
        undefined,
        { right_assoc: 'some,other' }
      );
      const closedRule = new Rule(
        new NonTerminal('Y'), [], undefined, { right_assoc: 'other, any' }
      );
      const open = new ChartItem({ rule: openRule, sidx: 0, eidx: 5, dot: 0 });
      const closed = new ChartItem({ rule: closedRule, sidx: 5, eidx: 5, dot: 0 });

      subject._add(open);
      expect(
        () => subject.addFromOpenClosed(open, closed)
      ).to.not.change(subject.hypothesis, 'length');
    });

    it('cancel adding when non_assoc exists', () => {
      const openRule = new Rule(
        lhs,
        [new NonTerminal('Y')],
        undefined,
        { non_assoc: 'some,other' }
      );
      const closedRule = new Rule(
        new NonTerminal('Y'), [], undefined, { non_assoc: 'other, any' }
      );
      const open = new ChartItem({ rule: openRule, sidx: 0, eidx: 5, dot: 0 });
      const closed = new ChartItem({ rule: closedRule, sidx: 5, eidx: 5, dot: 0 });

      subject._add(open);
      expect(
        () => subject.addFromOpenClosed(open, closed)
      ).to.not.change(subject.hypothesis, 'length');
    });
  });

  describe('#addPredicted', () => {
    it('add predicted edge to the agenda', () => {
      subject.addPredicted(rule, 123);
      const newEdge = subject.hypothesis[0];
      expect(newEdge.sidx).to.equal(123);
      expect(newEdge.eidx).to.equal(123);
      expect(newEdge.rule).to.eql(rule);
      expect(newEdge.history).to.eql([]);
    });
  });

  describe('#addScanned', () => {
    it('add new edge to agenda', () => {
      const ruleTerm = new Rule(lhs, [new Terminal('abc')]);
      const edge = new ChartItem({ rule: ruleTerm, sidx: 12, eidx: 15, dot: 0 });
      subject.addScanned(edge, 123, 'matched string');
      const newEdge = subject.hypothesis[0];
      expect(newEdge.sidx).to.equal(12);
      expect(newEdge.eidx).to.equal(123);
      expect(newEdge.rule).to.eql(ruleTerm);
      expect(newEdge.history[0].open).to.eql(edge);
      expect(newEdge.history[0].termMatch).to.eql('matched string');
    });
  });

  describe('#next', () => {
    it('return next item form agenda', () => {
      const chartItem = new ChartItem({ rule });
      subject._add(chartItem);
      expect(subject.next()).to.equal(chartItem);
    });

    it('put item form agenda to chart', () => {
      const chartItem = new ChartItem({ rule });
      subject._add(chartItem);
      subject.next();
      expect(subject.hypothesisIdx).to.equal(1);
    });
  });
});

