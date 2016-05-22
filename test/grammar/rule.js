var expect = require('chai').expect;

var parser = require('../..'),
  Terminal = parser.Terminal,
  Rule = parser.Rule,
  Terminal = parser.Terminal,
  NonTerminal = parser.NonTerminal,
  RegExpTerminal = parser.RegExpTerminal;

describe('Rule', () => {
  var lhs = new NonTerminal('A');

  it('should raise error when LHS in not NonTerminal', () => {
    var subject = () => { new Rule(1, []); };
    expect(subject).to.throw(/LHS/);
  });

  it('should raise error when RHS contains non-GrmSymbol object', () => {
    var subject = () => { new Rule(lhs, [1]); };
    expect(subject).to.throw(/RHS/);
  });

  it('should create empty rule', () => {
    expect(() => new Rule(lhs, [])).to.not.throw(Error);
  });

  it('should create non-empty rule', () => {
    var term = new Terminal('abc');
    expect(() => new Rule(lhs, [lhs, term])).to.not.throw(Error);
  });

  describe('#toString', () => {
    it('when empty rule without semRes and options', () => {
      expect(new Rule(lhs, []).toString()).to.equal('A -> ');
    });

    it('when semRes is defined', () => {
      expect(new Rule(lhs, [], () => 1).toString()).to
        .equal('A ->  {{ () => 1 }}');
    });

    it('when options is defined', () => {
      expect(new Rule(lhs, [], undefined, { weight: 0.1 }).toString()).to
        .equal('A ->  {"weight":0.1}');
    });

    it('when semRes and options are defined', () => {
      var term = new Terminal('abc');
      var regExpTerm = new RegExpTerminal('def');

      var subject =
        new Rule(lhs, [lhs, term, regExpTerm], () => 123, { weight: 0.1 });

      expect(subject.toString()).to
        .equal('A -> A "abc" /def/ {{ () => 123 }} {"weight":0.1}');
    });
  });
});
