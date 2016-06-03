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
 S -> "Hello" WORLD "!" "I am" NAME
 WORLD -> "WORLD"
 NAME -> FIRST
 FIRST -> "Lukáš"
*/

const ruleS = new Rule(
  new NonTerminal('S'), [
    new Terminal('Hello'),
    new Terminal('my'),
    new NonTerminal('WORLD'),
    new Terminal('!'),
    new Terminal('I am'),
    new NonTerminal('NAME'),
  ], (...x) => x.join(':'), { entity: true }
);

const ruleWORLD = new Rule(
  new NonTerminal('WORLD'), [new Terminal('WORLD')], x => x
);

const ruleNAME = new Rule(
  new NonTerminal('NAME'), [new NonTerminal('FIRST')], x => x
);

const ruleFIRST = new Rule(
  new NonTerminal('FIRST'), [new Terminal('Lukáš')], x => x
);


const grammar = new Grammar([
  ruleS,
  ruleWORLD,
  ruleNAME,
  ruleFIRST,
]);

describe('Simple grammar', () => {
  context('TopDown', () => {
    it('parse grammar and return semRes results', () => {
      const parser = new Parser(grammar, 'topDown');
      parser.logger.level = 1;
      parser.parse('Hello my WORLD! I am Lukáš');

      const results = parser.results();

      expect(results.length).to.equal(1);
      expect(results[0].txt).to.equal(
        'S("Hello", "my", WORLD("WORLD"), "!", "I am", NAME(FIRST("Lukáš")))'
      );
    });
  });

  context('bottomUp', () => {
    it('parse grammar and return semRes results', () => {
      const parser = new Parser(grammar, 'bottomUp');
      parser.logger.level = 1;
      parser.parse('Hello my WORLD! I am Lukáš');

      const results = parser.results();

      expect(results.length).to.equal(1);
      expect(results[0].txt).to.equal(
        'S("Hello", "my", WORLD("WORLD"), "!", "I am", NAME(FIRST("Lukáš")))'
      );
    });
  });
});
