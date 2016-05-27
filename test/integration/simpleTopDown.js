const {
  Parser,
  Grammar,
  Rule,
  Terminal,
  NonTerminal,
  // RegExpTerminal,
  ChartItem,
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

const parser = new Parser(grammar, 'topDown');
parser.logger.level = 0; // DEBUG
parser.chart._add(new ChartItem({
  sidx: 0,
  eidx: 0,
  dot: 0,
  rule: ruleS,
}));
parser.parse('Hello WORLD! I am Lukáš');

const parsedEdges = parser.chart.parentEntities();
console.log(parsedEdges);
const results = parsedEdges.map(edge => edge.semRes());

console.log('final result:', results);
