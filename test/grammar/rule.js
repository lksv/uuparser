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

  describe('._loadRule', () => {
    it('correctly parse empty rule', () => {
      expect(Rule._loadRule(lhs, ' ')).to.eql(new Rule(lhs, []));
    });
    it('correctly parse rule with several RHS symbols', () => {
      expect(Rule._loadRule(lhs, ' A "word" /regexp/ ')).to.eql(
        new Rule(
          lhs, [
            new NonTerminal('A'),
            new Terminal('word'),
            new RegExpTerminal('regexp'),
          ]
        ));
    });
    it('correctly parse rule with weight', () => {
      expect(Rule._loadRule(lhs, ' weight: 1.1')).to.eql(
        new Rule(lhs, [], undefined, { weight: 1.1 })
      );
    });
    it('correctly parse rule with entity', () => {
      expect(Rule._loadRule(lhs, ' entity: true')).to.eql(
        new Rule(lhs, [], undefined, { entity: true })
      );
    });
    it('correctly parse rule with proc', () => {
      expect(Rule._loadRule(lhs, ' {% \n () => 2 %}').toString()).to.eql(
        new Rule(lhs, [], eval(' \n () => 2'), {}).toString() // eslint-disable-line no-eval
      );
    });
    it('correctly parse rule with serveral RHS, weight, entity and proc', () => {
      expect(Rule._loadRule(lhs, ' A "word" /regexp/ entity: true {% 2 %} weight: 0.5')).to.eql(
        new Rule(
          lhs,
          [
            new NonTerminal('A'),
            new Terminal('word'),
            new RegExpTerminal('regexp'),
          ],
          eval('2'), // eslint-disable-line no-eval
          { entity: true, weight: 0.5 }
        ));
    });
  });

  describe('.loadFromString', () => {
    it('correctly parse empty rule', () => {
      expect(Rule.loadFromString('A ->')).to.eql([new Rule(new NonTerminal('A'), [])]);
    });
    it('correctly parse non-empty rule', () => {
      expect(Rule.loadFromString('A -> A weight: 0.01')).to.eql([
        new Rule(new NonTerminal('A'), [new NonTerminal('A')], undefined, { weight: 0.01 }),
      ]);
    });

    it('correctly parse rules connected by ||', () => {
      const result = Rule.loadFromString('A -> || {% () => 1 %} ||\n A weight: 0.01');
      expect(result[0].toString()).to.eql(new Rule(lhs, []).toString());
      expect(result[1].toString()).to.eql(
        new Rule(lhs, [], eval('() => 1 ')).toString() // eslint-disable-line no-eval
      );
      expect(result[2].toString()).to.eql(
        new Rule(lhs, [new NonTerminal('A')], undefined, { weight: 0.01 }).toString()
      );
    });
  });
});
