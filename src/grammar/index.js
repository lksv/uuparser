'use strict';

const symbols = require('./symbol');
const EntityTerminal = require('./entityTerminal');
const Rule = require('./rule');
const Grammar = require('./grammar');

module.exports = {
  GrmSymbol: symbols.GrmSymbol,
  NonTerminal: symbols.NonTerminal,
  Terminal: symbols.Terminal,
  ApproxTerminal: symbols.ApproxTerminal,
  RegExpTerminal: symbols.RegExpTerminal,
  EntityTerminal,

  Rule,
  Grammar,
};

