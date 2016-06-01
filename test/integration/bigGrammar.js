/* eslint-disable no-alert, no-console */

const expect = require('chai').expect;

const {
  Parser,
  Grammar,
  Rule,
  Terminal,
  NonTerminal,
  // RegExpTerminal,
} = require('../..');

/**
 S -> A1 B1
 A1 -> A2
 A2 -> A3
 ...
 An -> "a"

 B1 -> B2
 B2 -> B3
 ...
 Bn -> "b"
*/

const ruleCount = 1000;

const ruleS = new Rule(
  new NonTerminal('S'), [
    new NonTerminal('A1'),
    new NonTerminal('B1'),
  ], (_, a, b) => a + b, { entity: true }
);

const rules = [ruleS];
for (let i = 1; i < ruleCount; i++) {
  rules.push(new Rule(
    new NonTerminal(`A${i}`), [new NonTerminal(`A${i + 1}`)], (_, x) => x + 1
  ));
  rules.push(new Rule(
    new NonTerminal(`B${i}`), [new NonTerminal(`B${i + 1}`)], (_, x) => x + 1
  ));
}

rules.push(new Rule(
  new NonTerminal(`A${ruleCount}`), [new Terminal('a')], () => 1
));
rules.push(new Rule(
  new NonTerminal(`B${ruleCount}`), [new Terminal('b')], () => 1
));


const grammar = new Grammar(rules);

describe('Simple grammar', () => {
  context('TopDown', () => {
    it('parse grammar and return semRes results', () => {
      const parser = new Parser(grammar, 'topDown');
      parser.logger.level = 1;
      parser.parse('a b');

      const results = parser.results();

      expect(results.length).to.equal(1);
      expect(results[0].data).to.equal(ruleCount * 2);
      // parser.chart.hypothesis.forEach(e => console.log(e.toString()));
    });
  });

  context('bottonUp', () => {
    it('parse grammar and return semRes results', () => {
      const parser = new Parser(grammar, 'bottomUp');
      parser.logger.level = 1;
      parser.parse('a b');

      const results = parser.results();

      expect(results.length).to.equal(1);
      expect(results[0].data).to.equal(ruleCount * 2);
      // console.log('bottonUp ------');
      // parser.chart.hypothesis.forEach(e => console.log(e.toString()));
    });
  });
});
