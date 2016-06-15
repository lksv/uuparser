/* eslint-disable no-alert, no-console */

const expect = require('chai').expect;

const {
  Parser,
  Grammar,
} = require('../..');

const grammar = new Grammar([]).loadFromString(`
S -> "Hello" WORLD "!" "I am" NAME {%
  (_, ...symbols) => symbols.join(':')
%} entity: true

WORLD -> "WORLD"

NAME -> FIRST

FIRST -> "Lukáš"  {% () => 'LUKAS' %}

`);

const test = (inputString, parserType) => {
  it('load grammar and use it', () => {
    const parser = new Parser(grammar, parserType);
    // parser.logger.level = 0;
    parser.parse(inputString);
    const results = parser.results();
    expect(results.length).to.equal(1);
    expect(results[0].data).to.equal('Hello:WORLD:!:I am:LUKAS');
  });
};

describe('Parse input grammar', () => {
  context('TopDown', () => {
    test('Hello WORLD! I am Lukáš', 'bottomUp');
    test('Hello WORLD ! I am   Lukáš', 'bottomUp');
  });

  context('bottonUp', () => {
    test('Hello WORLD! I am Lukáš', 'topDown');
    test('Hello WORLD ! I am   Lukáš', 'topDown');
  });
});
