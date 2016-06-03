class EntityHelper {
  static _partial(entities) {
    return Array.from(entities).reduce((map, entity) => {
      const currentKey = entity.slice(0, 1);
      const restString = entity.slice(1);
      if (!map.has(currentKey)) {
        map.set(currentKey, new Set([restString]));
      } else {
        map.get(currentKey).add(restString);
      }
      return map;
    }, new Map);
  }

  static _specialChars2Reg(str) {
    return str
      .replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&') // escape all special characters
      .replace(/\s*\\-\s*/g, '\\s{0,4}\\-\\s{0,4}')
      // TODO UTF-8 space charts
      .replace(/ +/g, '\\s{1,4}');  // space should be 1-4 any space chars
  }

  /**
   * Returns regular expression (to be recise string which shlould construct regular
   * expression) which match all entered entites.
   *
   * It creates trie structure form entities. Usually it compact long lists of
   * entities to a quarter and makes regular expression super fast.
   *
   * Example
   *
   *     const geoNames = ['Newport', 'New York', 'New Orleans']
   *     EntityHelper.entities2regexp(geoNames) // =>  'N(?:e(?:w(?:port|\s{1,4}(?:York|Orleans))))'
   *
   * @param {array} entities List of entities
   * @param {strToReg} strToReg function to handle special characters (e.g. spaces, dash, etc.)
   * @returns {string} String which should be used as regular expression to match all entities
   */
  static entities2regexp(entities, strToReg = EntityHelper._specialChars2Reg) {
    const result = [];
    const map = EntityHelper._partial(entities);
    map.forEach((values, group) => {
      const innerValues = (values.size <= 1)
        ? strToReg(Array.from(values)[0])
        : `(?:${EntityHelper.entities2regexp(values, strToReg)})`;
      result.push(`${strToReg(group)}${innerValues}`);
    });
    return result.join('|');
  }
}

// const geoNames = ['Newport', 'New York', 'New Orleans']
// console.log(EntityHelper.entities2regexp(geoNames))

exports = module.exports = EntityHelper;
