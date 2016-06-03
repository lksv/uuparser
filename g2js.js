const { Grammar, Parser, Rule, NonTerminal, Terminal, RegExpTerminal, } = require('.');

const fs = require('fs');

// const readline = require('readline')
//
// const lineReader = readline.createInterface({
//   input: require('fs').createReadStream('grammar.grm')
// });

function convertSymbol(symbol) {
  if (symbol === '') return null;
  if (res = symbol.match(/^"(.*)"/)) {
    return new Terminal(res[1])
  } else if (res = symbol.match(/^\/(.*)\//)) {
    return new RegExpTerminal(res[1])
  } else if (res = symbol.match(/^([A-Z][A-Z0-9_]*)$/)) {
    return new NonTerminal(symbol)
  } else {
    throw new Error(`Unknown symbol type: ${symbol}`);
  }
}

function processRule(line) {
  const found = /^\s*(.*?)\s*\->\s*(.*?)\s*$/.exec(line)
  if (!found && !found[1] && !found[2]) {
    throw new Error('cannot parse LHS and RHS');
  }

  const lhs = found[1]
  let rhs = found[2]

  const options = {}

  const procRegExp = /\s*(?:^| )\$\{(.*)\}\$\s*/
  let proc = procRegExp.exec(rhs);
  if (proc) {
    proc = proc[1]
    rhs = rhs.replace(procRegExp, ' ')
  }
  const entityRegExp = /entity:\s*true/
  let entity = entityRegExp.exec(rhs);
  if (entity) {
    options.entity = true;
    rhs = rhs.replace(entityRegExp, '')
  }
  const weightRegExp = /weight:\s+\d+(?:\.\d+)/
  let weight = weightRegExp.exec(rhs)
  if (weight) {
    options.weight = weight[1];
    rhs = rhs.replace(weightRegExp, '')
  }
  rhs = rhs.split(/\s+/)

  const convertedLHS = convertSymbol(lhs);
  const convertedRHSSymbols = rhs
    .map(symbol => convertSymbol(symbol))
    .filter(s => s);

  return new Rule(convertedLHS, convertedRHSSymbols, eval(proc), options);
}


function loadGrammar(file) {
  const grammar = new Grammar([]);
  const lines = fs.readFileSync(file).toString().split(/\r?\n/)
  lines.forEach(line => {
    if (line.match(/^\s*(#|$)/)) return "\n";
    grammar.addRule(processRule(line));
  });
  return grammar;
}

const grammar = loadGrammar('grammar.grm');
console.log(grammar.toString());


console.log('---------------------------');
const parser = new Parser(grammar, 'topDown');
parser.parse('A -> B | "x" C weight: 0.5');
console.log('parsing results', parser.results().length);
// parser.chart.hypothesis.forEach(edge => {
//   console.log(edge.toString());
// });
parser.results().forEach(res => {
  console.log(res.txt, '======', res.data);
});
