/* eslint-disable no-alert, no-console */

const expect = require('chai').expect;

const {
  Parser,
  Grammar,
} = require('../..');

const grammar = new Grammar([]).loadFromString(`
S -> EMPTY1 NESTED_EMPTY_B "aaa" {% (_, _a, _b, res) => res %} entity: true

EMPTY1 -> {% (_, res) => undefined %}

NESTED_EMPTY_B -> EMPTY2 "b"

EMPTY2 -> {% (_, res) => undefined %}

`);

// console.log(grammar.toString());

const test = (inputString, result, parserType) => {
  it(`correctly parse '${inputString}' => '${result}'`, () => {
    const parser = new Parser(grammar, parserType);
    // parser.logger.level = 0;
    parser.parse(inputString);
    const results = parser.results();
    // results.forEach(r => console.log(r.data, r.txt));
    expect(results.length).to.equal(1);
    expect(results[0].data).to.equal(result);
  });
};

describe('Parse input grammar', () => {
  context('bottomUp', () => {
    test('b aaa', 'aaa', 'bottomUp');
  });
});
