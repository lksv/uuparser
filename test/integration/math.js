/* eslint-disable no-alert, no-console */

const expect = require('chai').expect;

const {
  Parser,
  Grammar,
} = require('../..');

const grammar = new Grammar([]).loadFromString(`
S -> EXP {% (_, res) => res %} entity: true

EXP ->
  /\\d+(?:\\.\\d+)?/ {% (_, f) => parseFloat(f) %} ||
  # pm, md are custom labels for plus-minus, multiply-div
  EXP "+" EXP  left_assoc:pm opPrecedence:exp:10 {% (_, a, b, c) =>  a+c %} ||
  EXP "-" EXP  left_assoc:pm opPrecedence:exp:10 {% (_, a, b, c) =>  a-c %} ||
  EXP "*" EXP  left_assoc:md opPrecedence:exp:20 {% (_, a, b, c) =>  a*c %} ||
  EXP "/" EXP  left_assoc:md opPrecedence:exp:20 {% (_, a, b, c) =>  a/c %} ||
  "-" EXP      right_assoc:neg opPrecedence:exp:30 {% (_, a, b) =>   -b %} ||
  EXP "^" EXP  right_assoc:pow opPrecedence:exp:40 {% (_, a, b, c) => Math.pow(a,c) %} ||
  "(" EXP ")"  {% (_, a, b, c) => b %}
`);

console.log(grammar.toString());

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
  context('TopDown', () => {
    test('1 + (1)', 2, 'topDown');
    test('(1 + (1))', 2, 'topDown');

    test('-1', -1, 'topDown');
    test('-(-1)', 1, 'topDown');

    test('1 + 1', 2, 'topDown');
    test('1 + 2 + 3', 6, 'topDown');
    test('1 + 2 * 3 * 4', 25, 'topDown');
    test('2 + 2 * 3 / 4', 3.5, 'topDown');

    test('4 - 2 * 32 / 4 ^ 2', 0, 'topDown');
    test('2 ^ 2 ^ 3', 256, 'topDown');
    test('64 + 32 + -4 * 2 ^ 2 ^ 3 / 4 ^ 2', 32, 'topDown');
  });

  context('bottomUp', () => {
    test('1 + (1)', 2, 'bottomUp');
    test('(1 + (1))', 2, 'bottomUp');

    test('-1', -1, 'bottomUp');
    test('-(-1)', 1, 'bottomUp');

    test('1 + 1', 2, 'bottomUp');
    test('1 + 2 + 3', 6, 'bottomUp');
    test('1 + 2 * 3 * 4', 25, 'bottomUp');
    test('2 + 2 * 3 / 4', 3.5, 'bottomUp');

    test('4 - 2 * 32 / 4 ^ 2', 0, 'bottomUp');
    test('2 ^ 2 ^ 3', 256, 'bottomUp');
    test('64 + 32 + 4 * 2 ^ 2 ^ 3 / 4 ^ 2', 160, 'bottomUp');
  });
});
