'use strict';

const { GrmSymbol, RegExpTerminal } = require('./symbol');

const EntityHelper = require('../utils/entityHelper');

class EntityTerminal extends RegExpTerminal {

  constructor(name) {
    const entity = EntityTerminal.entityStorage.get(name);
    if (!entity) {
      throw new Error(`Unregistered entity "${name}"`);
    }
    super(name, entity.regExp);
  }

  toString() {
    return `EntityTerminal(${this.name})`;
  }

  static registerEntity(name, list) {
    const regExp = EntityHelper.entities2regexp(list);
    EntityTerminal.entityStorage.set(name, { list, regExp });
  }
}
EntityTerminal.entityStorage = new Map();

GrmSymbol.registerGrammarSymbol(
  /^EntityTerminal\(([A-Za-z_0-9]+)\)$/,
  (match) => new EntityTerminal(match[1])
);

exports = module.exports = EntityTerminal;
