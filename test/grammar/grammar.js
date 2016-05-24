const expect = require('chai').expect;

const { Grammar, Rule, Terminal, NonTerminal } = require('../..');

describe('Grammar', () => {
  const epsilonRule = new Rule(new NonTerminal('A'), []);
  const ruleBtoA1 = new Rule(new NonTerminal('B'), [
    new NonTerminal('A'),
    new Terminal('Hi first!'),
  ]);
  const ruleBtoA2 = new Rule(new NonTerminal('B'), [
    new NonTerminal('A'),
    new Terminal('Hi first!'),
  ]);


  it('shoud be initialized by empty Array', () => {
    const subject = new Grammar([]);
    expect(subject.rules).to.be.empty;
  });
  it('should be initialized by Array of rules', () => {
    const subject = new Grammar([epsilonRule, ruleBtoA1]);
    expect(subject.rules).to.eql([epsilonRule, ruleBtoA1]);
  });

  describe('#rulesByFirstRhs', () => {
    it('returns [] when no rule exists', () => {
      const symbol = new NonTerminal('A');
      const subject = new Grammar([]);
      expect(subject.rulesByFirstRhs(symbol)).to.eql([]);
    });

    it('returns epsilon rules', () => {
      const subject = new Grammar([epsilonRule]);
      expect(subject.rulesByFirstRhs(undefined)).to.eql([epsilonRule]);
    });

    it('returns all rules by the first symbol', () => {
      const subject = new Grammar([epsilonRule, ruleBtoA1, ruleBtoA2]);
      expect(subject.rulesByFirstRhs(new NonTerminal('A'))).to.eql(
        [ruleBtoA1, ruleBtoA2]
      );
    });
  });

  describe('#rulesByLhs', () => {
    it('return [] when no rule exist', () => {
      const symbol = new NonTerminal('A');
      const subject = new Grammar([]);
      expect(subject.rulesByLhs(symbol)).to.eql([]);
    });

    it('should return array of one rule if exists only one', () => {
      const subject = new Grammar([epsilonRule]);
      expect(subject.rulesByLhs(new NonTerminal('A'))).to.eql(
        [epsilonRule]
      );
    });

    it('should return array of all rules', () => {
      const subject = new Grammar([ruleBtoA1, ruleBtoA2]);
      expect(subject.rulesByLhs(new NonTerminal('B'))).to.eql(
        [ruleBtoA1, ruleBtoA2]
      );
    });
  });
});
