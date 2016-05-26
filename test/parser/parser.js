const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.use(sinonChai);
const expect = chai.expect;

const {
  Parser,
  Grammar,
  Rule,
  Terminal,
  NonTerminal,
  RegExpTerminal,
  ChartItem,
} = require('../..');

const epsilonRule = new Rule(new NonTerminal('E'), []);
const ruleE2term = new Rule(new NonTerminal('E'), [new Terminal('term')]);
const ruleA2E = new Rule(new NonTerminal('A'), [new NonTerminal('E')]);
const ruleS2termE = new Rule(new NonTerminal('A'), [new Terminal('term'), new NonTerminal('E')]);
const ruleS2regExpTerm = new Rule(new NonTerminal('A'), [new RegExpTerminal('\\w+')]);

const grammar = new Grammar([
  epsilonRule,
  ruleE2term,
  ruleA2E,
  ruleS2termE,
  ruleS2regExpTerm,
]);

describe('Parser', () => {
  it('should initialize empty chart', () => {
    const subject = new Parser(grammar, 'bottomUp');
    expect(subject.chart.hypothesis).to.eql([]);
  });

  it('raise an error when unknown type', () => {
    const subject = () => new Parser(grammar, 'xxx');
    expect(subject).to.throw(/Unknown parser type/);
  });

  it('should set default lexer when no lexer specified', () => {
    const subject = new Parser(grammar, 'bottomUp');
    expect(subject.lexer).to.equal(Parser.defaultLexer);
  });

  describe('#completer', () => {
    let subject;
    beforeEach(() => {
      subject = new Parser(grammar, 'topDown');
    });

    const closed = new ChartItem({
      rule: epsilonRule,
      eidx: 5,
      sidx: 5,
    });

    it('should not add any edge when no waiting', () => {
      sinon.spy(subject.chart, 'addFromOpenClosed');
      subject.completer(closed);
      expect(subject.chart.addFromOpenClosed).to.have.not.been.called;
    });

    it('should call addFromOpenClosed for every waiting edges', () => {
      // add two waiting edges
      const open1 = new ChartItem({ rule: ruleA2E, sidx: 5, eidx: 5, dot: 0 });
      const open2 = new ChartItem({ rule: ruleS2termE, sidx: 0, eidx: 5, dot: 1 });
      subject.chart.add(open1);
      subject.chart.add(open2);

      sinon.spy(subject.chart, 'addFromOpenClosed');
      subject.completer(closed);

      expect(subject.chart.addFromOpenClosed).to.have.been.calledTwice;
      expect(subject.chart.addFromOpenClosed).to.have.been.calledWith(open1, closed);
      expect(subject.chart.addFromOpenClosed).to.have.been.calledWith(open2, closed);
    });

    context('when topDown parser is used', () => {
      beforeEach(() => {
        subject = new Parser(grammar, 'topDown');
      });

      it('should not create new predicted hypothesis', () => {
        sinon.spy(subject.chart, 'addPredicted');
        subject.completer(closed);
        expect(subject.chart.addPredicted).to.have.not.been.called;
      });
    });

    context('when bottomUp parser is used', () => {
      beforeEach(() => {
        subject = new Parser(grammar, 'bottomUp');
      });

      it('creates new predicted hypothesis', () => {
        sinon.spy(subject.chart, 'addPredicted');
        subject.completer(closed);
        expect(subject.chart.addPredicted).to.have.been.calledWith(ruleA2E, 5);
      });
    });
  });

  describe('#predictor', () => {
    let subject;
    beforeEach(() => {
      subject = new Parser(grammar, 'bottomUp');
    });

    const open = new ChartItem({ rule: ruleS2termE, sidx: 0, eidx: 5, dot: 1 });

    const closed1 = new ChartItem({ rule: epsilonRule, sidx: 5, eidx: 5 });
    const closed2 = new ChartItem({ rule: ruleE2term, sidx: 5, eidx: 8, dot: 1 });

    it('should not add any edge when no reduced edges exists', () => {
      sinon.spy(subject.chart, 'addFromOpenClosed');
      subject.predictor(open);
      expect(subject.chart.addFromOpenClosed).to.have.not.been.called;
    });

    it('should call addFromOpenClosed for every reduced edges', () => {
      subject.chart.add(closed1);
      subject.chart.add(closed2);
      sinon.spy(subject.chart, 'addFromOpenClosed');
      subject.predictor(open);
      expect(subject.chart.addFromOpenClosed).to.have.been.calledTwice;
      expect(subject.chart.addFromOpenClosed).to.have.been.calledWith(open, closed1);
      expect(subject.chart.addFromOpenClosed).to.have.been.calledWith(open, closed2);
    });

    context('when topDown parser is used', () => {
      beforeEach(() => {
        subject = new Parser(grammar, 'topDown');
      });

      it('creates new predicted hypothesis', () => {
        sinon.spy(subject.chart, 'addPredicted');
        subject.predictor(open);
        expect(subject.chart.addPredicted).to.have.been.calledTwice;
        expect(subject.chart.addPredicted).to.have.been.calledWith(epsilonRule, 5);
        expect(subject.chart.addPredicted).to.have.been.calledWith(ruleE2term, 5);
      });
    });

    context('when bottomUp parser is used', () => {
      beforeEach(() => {
        subject = new Parser(grammar, 'bottomUp');
      });

      it('should not create new predicted hypothesis', () => {
        sinon.spy(subject.chart, 'addPredicted');
        subject.predictor(open);
        expect(subject.chart.addPredicted).to.have.not.been.called;
      });
    });
  });

  describe('#scanner', () => {
    it('match the Terminal when input equal', () => {
      const openTerm = new ChartItem({ rule: ruleE2term, sidx: 5, eidx: 5, dot: 0 });
      const subject = new Parser(grammar, 'bottomUp');
      subject.input = '12345termXYZ';
      subject.scanner(openTerm);
      const newEdge = subject.chart.hypothesis[0];
      expect(newEdge.dot).to.equal(1);
      expect(newEdge.sidx).to.equal(5);
      expect(newEdge.eidx).to.equal(9);
      expect(newEdge.history[0].semRes).to.eql(['term']);
      expect(newEdge.history[0].open).to.eql(openTerm);
      expect(newEdge.history[0].closed).to.eql(undefined);
    });

    it('match the RegExpTerminal when input equal', () => {
      const openRegExpTerm = new ChartItem({ rule: ruleS2regExpTerm, sidx: 2, eidx: 2, dot: 0 });
      const subject = new Parser(grammar, 'bottomUp');
      subject.input = '--word--';
      subject.scanner(openRegExpTerm);
      const newEdge = subject.chart.hypothesis[0];
      expect(newEdge.dot).to.equal(1);
      expect(newEdge.sidx).to.equal(2);
      expect(newEdge.eidx).to.equal(6);
      expect(newEdge.history[0].semRes).to.eql(['word']);
      expect(newEdge.history[0].open).to.eql(openRegExpTerm);
      expect(newEdge.history[0].closed).to.eql(undefined);
    });

    it('should employ lexer and skip spaces', () => {
      const openTerm = new ChartItem({ rule: ruleE2term, sidx: 5, eidx: 5, dot: 0 });
      const subject = new Parser(grammar, 'bottomUp');
      subject.input = '12345term   XYZ';
      subject.scanner(openTerm);
      const newEdge = subject.chart.hypothesis[0];
      expect(newEdge.dot).to.equal(1);
      expect(newEdge.eidx).to.equal(9 + 3);
      expect(newEdge.history[0].semRes).to.eql(['term']);
    });
  });
});