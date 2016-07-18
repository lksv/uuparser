'use strict';

const { GrmSymbol, RegExpTerminal } = require('./symbol');

const EntityHelper = require('../utils/entityHelper');

/**
 * Class for easy matching of long list of entities
 * i.e. First names, Last names Cities, Streets, etc.
 *
 * Entities could contain "special characters" which are converted to regexp
 * differently (e.g. space is converted as \s{1,4}). See EntityHelper for more info.
 *
 *
 * This class converts entities to trie structure and use regural expression
 * to match the entites. It is blasing fast!
 *
 * Example:
 *     EntityTerminal.registerEntity('entityName', longListOfEntities);
 *     const subject = new EntityTerminal('entityName');
 *     subject.match('input string', 0)
 *
 */

class EntityTerminal extends RegExpTerminal {

  /**
   * Creates an EntityTerminal. The entity *name* must be registered
   * before creating an instace of EntityTerminal.
   *
   * @param {string} name Registerd *name* of entity
   */
  constructor(name) {
    const entity = EntityTerminal.entityStorage.get(name);
    if (!entity) {
      throw new Error(`Unregistered entity "${name}"`);
    }
    super(name, entity.regExp, entity.boundary);
  }

  toString() {
    return `EntityTerminal(${this.name})`;
  }

  /**
   * Register entity name in global storage.
   *
   * @param {string} name Name of entity
   * @param {array} list array of entities e.g. array of strings to match
   * @param {string} regExpFlags Flags for regular expression, i.e. flag i could be useful
   * @param {string|arryay} boundary Type of boundary (passed to RegExpTerminal constructor)
   * @param {function} entitySpecialCharsFce handle special charts, see EntityHelper.entities2regexp
   * @returns {undefined}
   */
  static registerEntity(name, list, regExpFlags = '', boundary = 'alpha', entitySpecialCharsFce) {
    const regExp = new RegExp(
      EntityHelper.entities2regexp(list, entitySpecialCharsFce),
      regExpFlags
    );
    EntityTerminal.entityStorage.set(name, { list, regExp, boundary });
  }
}
EntityTerminal.entityStorage = new Map();

GrmSymbol.registerGrammarSymbol(
  /^EntityTerminal\(([A-Za-z_0-9]+)\)$/,
  (match) => new EntityTerminal(match[1])
);

exports = module.exports = EntityTerminal;
