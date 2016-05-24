const expect = require('chai').expect;

const parser = require('../..');
const Rule = parser.Rule;
const Terminal = parser.Terminal;
const NonTerminal = parser.NonTerminal;
const ChartItemHistory = parser.ChartItemHistory;
const ChartItem = parser.ChartItem;


describe('ChartItemHistory', () => {
  describe('#hashCode', () => {
    it('should return same hashCode for same open & close chartItems');
    it('should return different hashCode when open or close ChartItem differs');
  });
});

describe('ChartItem', () => {
  const lhs = new NonTerminal('A');
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

  it('should create ChartItem by clonnign form another one', () => {
  });

  it('should not clone history', () => {
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
});


describe('ChartItemIndex', () => {
});


describe('Chart', () => {
});

