/* eslint-disable no-alert, no-console */

const expect = require('chai').expect;

const {
  Parser,
  Grammar,
} = require('../..');

const grammar = new Grammar([]).loadFromString(`
S -> RULE {% (_, res) => res %} entity: true priority: 15 ||
     "aabb" entity:true priority:14 ||
     "aabb" EMPTY {% (_, a, b) => \`\${a}:\${b}\` %} entity:true

RULE ->  A ABB  {% (_,a,b) => \`\${a}:\${b}\` %} priority: 10 ||
        AAB B  {% (_,a,b) => \`\${a}:\${b}\` %} priority: 20 ||
        AA BB  {% (_,a,b) => \`\${a}:\${b}\` %} ||

EMPTY -> {% () => '' %}

A -> "a"

ABB -> "abb"

AAB -> "aab"

B -> "b"

AA -> "aa"

BB -> "bb"
`);

// console.log(grammar.toString());

const test = (inputString, testResults, parserType) => {
  it(`corrently filter priority for '${inputString}'`, () => {
    const parser = new Parser(grammar, parserType);
    // parser.logger.level = 1;
    parser.parse(inputString);
    const results = parser.results();
    // results.forEach(r => console.log(r.data, r.txt));
    expect(results.length).to.equal(testResults.length);
    testResults.forEach((result, idx) => {
      expect(results[idx].data).to.equal(result.data);
      expect(results[idx].txt).to.equal(result.txt);
    });
  });
};

describe('Parse input grammar', () => {
  context('TopDown', () => {
    test(
      'aabb',
      [
        { data: 'aab:b', txt: 'S(RULE(AAB("aab"), B("b")))' },
        { data: 'aa:bb', txt: 'S(RULE(AA("aa"), BB("bb")))' },
        { data: 'aabb:', txt: 'S("aabb", EMPTY())' },
      ],
      'topDown'
    );
  });

  context('bottomUp', () => {
    test(
      'aabb',
      [
        { data: 'aab:b', txt: 'S(RULE(AAB("aab"), B("b")))' },
        { data: 'aa:bb', txt: 'S(RULE(AA("aa"), BB("bb")))' },
        { data: 'aabb:', txt: 'S("aabb", EMPTY())' },
      ],
      'bottomUp'
    );
  });
});
