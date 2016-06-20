/* eslint-disable no-alert, no-console */

const expect = require('chai').expect;

const {
  Parser,
  Grammar,
  ApproxTerminal,
} = require('../..');

const testCallback = function approxCallback(inputString, sidx, eidx) {
  console.log('calling ApproxTerminal callback with', inputString, sidx, eidx);
  return true;
};

ApproxTerminal.register('parcelIDGap', 100, true, testCallback);

const grammar = new Grammar([]).loadFromString(`
S -> PARCEL NUMBER ApproxTerminal(parcelIDGap) NUMBER {%
  (_, parcel, p1, gap, p2) => \`\${p1}-\${gap}-\${p2}\`
%} entity: true

PARCEL -> /parc\\. ?id\\./

NUMBER -> /\\d+/

`);

const test = (inputString, result, parserType) => {
  it(`correctly parse '${inputString}' => '${result}'`, () => {
    const parser = new Parser(grammar, parserType);
    parser.logger.level = 1;
    parser.parse(inputString);
    // expect(1).to.equal(1);

    const results = parser.results();
    expect(results.length).to.equal(1);
    expect(results[0].data).to.equal(result);
  });
};

describe('Parse input grammar', () => {
  context('TopDown', () => {
    test('parc. id. 10 xxx 20', '10-xxx -20', 'bottomUpApprox');
  });
});
