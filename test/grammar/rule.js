const expect = require('chai').expect;

const parser = require('../..');
const Terminal = parser.Terminal;
const Rule = parser.Rule;
const NonTerminal = parser.NonTerminal;
const RegExpTerminal = parser.RegExpTerminal;

describe('Rule', () => {
  const lhs = new NonTerminal('A');

  it('should raise error when LHS in not NonTerminal', () => {
    const subject = () => new Rule(1, []);
    expect(subject).to.throw(/LHS/);
  });

  it('should raise error when RHS contains non-GrmSymbol object', () => {
    const subject = () => new Rule(lhs, [1]);
    expect(subject).to.throw(/RHS/);
  });

  it('should create empty rule', () => {
    expect(() => new Rule(lhs, [])).to.not.throw(Error);
  });

  it('should create non-empty rule', () => {
    const term = new Terminal('abc');
    expect(() => new Rule(lhs, [lhs, term])).to.not.throw(Error);
  });

  describe('#toString', () => {
    it('when empty rule without semRes and options', () => {
      expect(new Rule(lhs, []).toString()).to.equal('A -> ');
    });

    it('when semRes is defined', () => {
      expect(new Rule(lhs, [], () => 1).toString()).to
        .equal('A ->  {% () => 1 %}');
    });

    it('when options is defined', () => {
      expect(new Rule(lhs, [], undefined, { weight: 0.1 }).toString()).to
        .equal('A ->  {"weight":0.1}');
    });

    it('when semRes and options are defined', () => {
      const term = new Terminal('abc');
      const regExpTerm = new RegExpTerminal('def');

      const subject =
        new Rule(lhs, [lhs, term, regExpTerm], () => 123, { weight: 0.1 });

      expect(subject.toString()).to
        .equal('A -> A "abc" /def/y {% () => 123 %} {"weight":0.1}');
    });
  });
});
