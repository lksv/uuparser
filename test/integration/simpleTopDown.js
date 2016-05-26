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
  ], undefined, { entity: true }
);

const ruleWORLD = new Rule(
  new NonTerminal('WORLD'), [new Terminal('WORLD')]
);

const ruleNAME = new Rule(
  new NonTerminal('NAME'), [new NonTerminal('FIRST')]
);

const ruleFIRST = new Rule(
  new NonTerminal('FIRST'), [new Terminal('Lukáš')]
);


const grammar = new Grammar([
  ruleS,
  ruleWORLD,
  ruleNAME,
  ruleFIRST,
]);

const parser = new Parser(grammar, 'topDown');
parser.logger.level = 0; // DEBUG
parser.chart.add(new ChartItem({
  sidx: 0,
  eidx: 0,
  dot: 0,
  rule: ruleS,
}));
parser.parse('Hello WORLD! I am Lukáš');
parser.chart.parentEntities();
