/* eslint-disable no-alert, no-console */

const expect = require('chai').expect;

const {
  Parser,
  Grammar,
  EntityTerminal,
} = require('../..');

EntityTerminal.registerEntity(
  'first', [
    'Jan',
    'Petr',
    'Pavel',
  ]
);
EntityTerminal.registerEntity(
  'surname', [
    'Novák',
    'Svoboda',
    'Novotný',
    'Dvořák',
  ]
);

const grammar = new Grammar([]).loadFromString(`
S -> FIRST SURNAME {% (_, first, surname) => \`\${first} \${surname}\` %} entity: true

S -> SURNAME FIRST {% (_, surname, first) => \`\${first} \${surname}\` %} entity: true

FIRST -> EntityTerminal(first)

SURNAME -> EntityTerminal(surname)
`);

const test = (inputString, result, parserType) => {
  it(`correctly parse '${inputString}' => '${result}'`, () => {
    const parser = new Parser(grammar, parserType);
    // parser.logger.level = 0;
    parser.parse(inputString);
    const results = parser.results();
    expect(results.length).to.equal(1);
    expect(results[0].data).to.equal(result);
  });
};

describe('Parse input grammar', () => {
  context('TopDown', () => {
    test('Jan Novák', 'Jan Novák', 'bottomUp');
    test('Novák Jan', 'Jan Novák', 'bottomUp');
    test('Petr Dvořák', 'Petr Dvořák', 'bottomUp');
    test('Novotný Pavel', 'Pavel Novotný', 'bottomUp');
  });

  context('bottonUp', () => {
    test('Jan Novák', 'Jan Novák', 'topDown');
    test('Novák Jan', 'Jan Novák', 'topDown');
    test('Petr Dvořák', 'Petr Dvořák', 'topDown');
    test('Novotný Pavel', 'Pavel Novotný', 'topDown');
  });
});
