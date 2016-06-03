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
 * grammar
 S -> A A A
 A -> A1 | A2 | A3 | ... | An
 A1 -> B1 | B2 | ... | Bn
 An -> B1 | B2 | ... | Bn
 Bn -> 'x'
*/

const ruleCount = 5;


const rules = [];
rules.push(new Rule(
  new NonTerminal('S'),
  [new NonTerminal('A'), new NonTerminal('A'), new NonTerminal('A')],
  (_, x, y, z) => x + y + z,
  { entity: true }
));
for (let i = 1; i <= ruleCount; i++) {
  rules.push(new Rule(
    new NonTerminal('A'), [new NonTerminal(`A${i}`)], () => 1
  ));

  rules.push(new Rule(
    new NonTerminal(`B${i}`), [new Terminal('x')], () => 1
  ));


  for (let j = 1; j <= ruleCount; j++) {
    rules.push(new Rule(
      new NonTerminal(`A${i}`), [new NonTerminal(`B${j}`)], (_, x) => x + 1
    ));
  }
}

// rules.forEach(r => console.log(r.toString()));

const grammar = new Grammar(rules);

describe('Big Ambiguity Test', () => {
  context('TopDown', () => {
    it('parse grammar and return semRes results', () => {
      const parser = new Parser(grammar, 'topDown');
      parser.logger.level = 1;
      parser.parse('x x x');

      const results = parser.results();

      expect(results.length).to.equal(Math.pow(ruleCount * ruleCount, 3));
      expect(results[0].data).to.equal(3);
    });
  });

  context('bottonUp', () => {
    it('parse grammar and return semRes results', () => {
      const parser = new Parser(grammar, 'bottomUp');
      parser.logger.level = 1;
      parser.parse('x x x');

      const results = parser.results();

      expect(results.length).to.equal(Math.pow(ruleCount * ruleCount, 3));
      expect(results[0].data).to.equal(3);
    });
  });
});
