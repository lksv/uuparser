'use strict';

/**
 * GrmSybol - it is an abstract class - mainly NonTerminal and Terminal are
 * inherited from GrmSymbol
 */
class GrmSymbol {
  /**
   * Abstract class parent of all grammar symbols
   * @constructor
   * @param {String} name Name of the GrmSymbol
   */
  constructor(name) {
    this.name = name;
    this.code = this.name;
  }

  /**
   * Convert string to symbol
   *
   * example:
   *      GrmSymbol.fromString('"terminal"') // => new Terminal('terminal')
   *      GrmSymbol.fromString('A') // => new NonTerminal('A')
   *      GrmSymbol.fromString('/A/') // => new RegExpTerminal(/A/)
   *
   * @param {string} symbolStr String to convert to GrmSymbol
   * @returns {GrmSymbol} returns resulting symbol
   */
  static fromString(symbolStr) {
    for (const rule of GrmSymbol.str2symbolRules) {
      let found;
      if ((found = rule.pattern.exec(symbolStr)) !== null) { //eslint-disable-line
        return rule.action(found);
      }
    }
    throw new Error('Cannot convert string to GrmSymbol: ' + symbolStr);
  }

  /**
   * Used to register new symbols. It is then accessable by
   * GrmSymbol.fromString static method.
   *
   * @param {RegExp} pattern Patten to match the symbol
   * @param {Function} action Function that takes (regexp.exec result) and construct new symbol
   * @returns {undefined}
   */
  static registerGrammarSymbol(pattern, action) {
    GrmSymbol.str2symbolRules.unshift({ pattern, action });
  }
}
GrmSymbol.str2symbolRules = [];

/**
 * Represents NonTerminal of grammar
 * It is defined only by name
 */
class NonTerminal extends GrmSymbol {
  toString() {
    return this.name;
  }
}
GrmSymbol.registerGrammarSymbol(/^([A-Z][A-Za-z_0-9]*)$/, (match) => new NonTerminal(match[1]));

/**
 * Represents Terminal symbol of grammar
 * It is represented by name and pattern which it could match
 *
 */
class Terminal extends GrmSymbol {
  /**
   * Creates Terminal of a grammar.
   * @constructor
   * @param {String} name name of the terminal
   * @param {String} pattern pattern which it match in input
   * @param {String} [lexer=Terminal.defaultLexer] lexer to use
   *                 (used to skip "blank" chars after terminal match)
   */
  constructor(name, pattern = name, lexer = Terminal.defaultLexer) {
    super(name);
    this.pattern = pattern;
    this.lexer = lexer;
  }

  /**
   * Test wheather *str* is mached by this terminal starting form position *sidx*
   * This terminal match the *str* from *str* position if starts on *pattern*
   * Returns array of two items:
   * * matchedText - the *pattern* (i.e. *name*)
   * * eidx - index where the match finished in *str*
   *
   * @param {String} str Input string
   * @param {Number} sidx start position in *str* to match from
   * @returns {Array} [[matchedText], eidx] matched text and last position of matched text is *str*
   */
  match(str, sidx) {
    const eidx = sidx + this.pattern.length;
    return (str.indexOf(this.pattern, sidx) === sidx) ?
        [[this.pattern], this.lexer(str, eidx)] : [undefined, undefined];
  }

  /**
   * Search terminal pattern in *str*. Call *callback* each find occurence
   * with (pattren, sidx, eidx) params
   *
   * @param {String} str Input string
   * @param {Function} callback Callback to call for each of found occurence
   * @returns {undefined}
   */
  matchAll(str, callback) {
    let sidx = str.indexOf(this.pattern);
    for (; sidx !== -1; sidx = str.indexOf(this.pattern, sidx)) {
      // calculate eidx, e.g. when term finish + skip all the "blank" chars afterward
      const eidx = this.lexer(str, sidx + this.pattern.length);

      callback(this.pattern, sidx, eidx);
      sidx += 1;
    }
  }

  toString() {
    return `"${this.name}"`;
  }

  /**
   * Skips "blank" charts from given position in input string and reutrns
   * that position
   *
   * @param {string} inputString Input string
   * @param {nubmer} idx Position in inputString
   * @returns {nubmer} Position in inputString skipping "blank" chars
   */
  static defaultLexer(inputString, idx) {
    const r = new RegExp('\\s+', 'ym');
    r.lastIndex = idx;
    return (r.exec(inputString)) ? r.lastIndex : idx;
  }
}
GrmSymbol.registerGrammarSymbol(
  /^"(.*)"(?::([A-Za-z_][A-Za-z0-9_]+))?$/,
  (match) => new Terminal(match[1], match[1], match[2])
);

class ApproxTerminal extends Terminal {
  constructor(name) {
    super(name);
    const data = ApproxTerminal.storage.get(name);
    if (!data) {
      throw new Error(`ApproxTerminal with name \'${name}\'is not registered`);
    }
    this.maxGap = data.maxGap;
    this.onlyFirsts = data.onlyFirsts;
    this.callback = data.callback;
  }


  /**
   * Test wheather insput string *str* from *sidx* position up to *eidx* position
   * is matched by this ApproxTerminal.
   *
   * Returns array of two items:
   * * matchedText
   * * eidx - same as input *eidx*
   *
   * @param {string} str Input string
   * @param {Number} sidx starting position in *str*
   * @param {Number} eidx finish positing in *str*
   * @returns {Array} [[matchedText], eidx]
   */
  match(str, sidx, eidx) {
    return this.callback(str, sidx, eidx)
      ? [[str.slice(sidx, eidx)], eidx]
      : [undefined, undefined];
  }

  matchAll() {
    // Do not match anything
    return undefined;
  }

  toString() {
    return `ApproxTerminal(${this.name})`;
  }

  /**
   * Register parcicular ApproxTerminal by name
   * Callback is used to match ApproxTerminal in two NonTerminals.
   *
   * Callback takes argumets:
   *   * inputString
   *   * sidx  - where is the starting positin on the inputString
   *   * eidx  - finis position to match the input string
   *
   * @param {string} name Name of the registered ApproxTerminal
   * @param {Number} maxGap maximal length of input string between sidx and eidx
   * @param {Boolean} onlyFirsts try to mach only first occurence of followng NonTerminal if true
   * @param {Fuction} callback callback used to match the ApproxTerminal
   * @returns {undefined}
   */
  static register(name, maxGap, onlyFirsts, callback) {
    ApproxTerminal.storage.set(name, { maxGap, onlyFirsts, callback });
  }
}
ApproxTerminal.storage = new Map;
GrmSymbol.registerGrammarSymbol(
  /^ApproxTerminal\(([A-Za-z_0-9]+)\)$/,
  (match) => new ApproxTerminal(match[1])
);

// see http://www.unicode.org/reports/tr44/#Cased
//
// Generated by http://inimino.org/~inimino/blog/javascript_cset
// Used form:
//   toRegex(
//     union(fromUnicodeGeneralCategory('Lu'),
//     union(fromUnicodeGeneralCategory('Ll'), fromUnicodeGeneralCategory('Lt')))
//   )
//
// There should be bettr ways as XRegExp, but it means to be dpendent on this
// eslint-disable-next-line
const UtfCasedAlpha = '(?:[A-Za-zªµºÀ-ÖØ-öø-ƺƼ-ƿǄ-ʓʕ-ʯͰ-ͳͶ-ͷͻ-ͽΆΈ-ΊΌΎ-ΡΣ-ϵϷ-ҁҊ-ԣԱ-Ֆա-ևႠ-Ⴥᴀ-ᴫᵢ-ᵷᵹ-ᶚḀ-ἕἘ-Ἕἠ-ὅὈ-Ὅὐ-ὗὙὛὝὟ-ώᾀ-ᾴᾶ-ᾼιῂ-ῄῆ-ῌῐ-ΐῖ-Ίῠ-Ῥῲ-ῴῶ-ῼⁱⁿℂℇℊ-ℓℕℙ-ℝℤΩℨK-ℭℯ-ℴℹℼ-ℿⅅ-ⅉⅎↃ-ↄⰀ-Ⱞⰰ-ⱞⱠ-Ɐⱱ-ⱼⲀ-ⳤⴀ-ⴥꙀ-ꙟꙢ-ꙭꚀ-ꚗꜢ-ꝯꝱ-ꞇꞋ-ꞌﬀ-ﬆﬓ-ﬗＡ-Ｚａ-ｚ]|\ud801[\udc00-\udc4f]|\ud835[\udc00-\udc54\udc56-\udc9c\udc9e-\udc9f\udca2\udca5-\udca6\udca9-\udcac\udcae-\udcb9\udcbb\udcbd-\udcc3\udcc5-\udd05\udd07-\udd0a\udd0d-\udd14\udd16-\udd1c\udd1e-\udd39\udd3b-\udd3e\udd40-\udd44\udd46\udd4a-\udd50\udd52-\udea5\udea8-\udec0\udec2-\udeda\udedc-\udefa\udefc-\udf14\udf16-\udf34\udf36-\udf4e\udf50-\udf6e\udf70-\udf88\udf8a-\udfa8\udfaa-\udfc2\udfc4-\udfcb])';
// eslint-disable-next-line
const UtfCasedAlNum = '(?:[A-Za-z0-9ªµºÀ-ÖØ-öø-ƺƼ-ƿǄ-ʓʕ-ʯͰ-ͳͶ-ͷͻ-ͽΆΈ-ΊΌΎ-ΡΣ-ϵϷ-ҁҊ-ԣԱ-Ֆա-ևႠ-Ⴥᴀ-ᴫᵢ-ᵷᵹ-ᶚḀ-ἕἘ-Ἕἠ-ὅὈ-Ὅὐ-ὗὙὛὝὟ-ώᾀ-ᾴᾶ-ᾼιῂ-ῄῆ-ῌῐ-ΐῖ-Ίῠ-Ῥῲ-ῴῶ-ῼⁱⁿℂℇℊ-ℓℕℙ-ℝℤΩℨK-ℭℯ-ℴℹℼ-ℿⅅ-ⅉⅎↃ-ↄⰀ-Ⱞⰰ-ⱞⱠ-Ɐⱱ-ⱼⲀ-ⳤⴀ-ⴥꙀ-ꙟꙢ-ꙭꚀ-ꚗꜢ-ꝯꝱ-ꞇꞋ-ꞌﬀ-ﬆﬓ-ﬗＡ-Ｚａ-ｚ]|\ud801[\udc00-\udc4f]|\ud835[\udc00-\udc54\udc56-\udc9c\udc9e-\udc9f\udca2\udca5-\udca6\udca9-\udcac\udcae-\udcb9\udcbb\udcbd-\udcc3\udcc5-\udd05\udd07-\udd0a\udd0d-\udd14\udd16-\udd1c\udd1e-\udd39\udd3b-\udd3e\udd40-\udd44\udd46\udd4a-\udd50\udd52-\udea5\udea8-\udec0\udec2-\udeda\udedc-\udefa\udefc-\udf14\udf16-\udf34\udf36-\udf4e\udf50-\udf6e\udf70-\udf88\udf8a-\udfa8\udfaa-\udfc2\udfc4-\udfcb])';
// eslint-disable-next-line
const UtfZs = '[ \u00a0\u1680\u180e\u2000-\u200a\u202f\u205f\u3000]';

class RegExpTerminal extends Terminal {
  /**
   *
   * RegExpTerminal - match terminal by specified regular expression
   *
   * Boudary is used for buttomUp and bottomUpApprox parser type. Boundary is
   * used to check that the terminal has selected boundary in input string.
   * Boundary types:
   *  * "alpha" - word boundaries are by utf8 characters (no digits)
   *  * "alnum" - word boundaries are by alphabetic and numeric character
   *  [behindRegexpString, forwardRegexpString] - custom specification
   *
   *
   * @param {String} name Name of the terminal
   * @param {String|RegExp} regExp Pattern to match
   * @param {String|Array} boundary how to match boundary of the word ('alpha', 'alnum', or custom)
   * @param {String} [lexer=Terminal.defaultLexer] lexer to use
   *                 (used to skip "blank" chars after terminal match)
   */
  constructor(name, regExp = name, boundary = 'alpha', lexer = Terminal.defaultLexer) {
    super(name, lexer);

    if (boundary === 'alpha') {
      this.behindRegexpString = `(?:^|(?!${UtfCasedAlpha})[\\w\\W])`;
      this.forwardRegexpString = `(?:$|(?!${UtfCasedAlpha})[\\w\\W])`;
    } else if (boundary === 'alnum') {
      this.behindRegexpString = `(?:^|(?!${UtfCasedAlNum})[\\w\\W])`;
      this.forwardRegexpString = `(?:$|(?!${UtfCasedAlNum})[\\w\\W])`;
    } else {
      this.behindRegexpString = boundary[0];
      this.forwardRegexpString = boundary[1];
    }

    // ensure that regexp has //y flag
    this.regExp = (regExp instanceof RegExp)
      ? new RegExp(regExp.source, regExp.flags + 'y')  // eslint-disable-line prefer-template
      : new RegExp(regExp, 'y');
  }

  toString() {
    return this.regExp.toString();
  }

  /**
   * Match input string *str* against *regExp* from *sidx* position.
   * Returns array of two items:
   * * matchedText - The full string of characters matched
   * * eidx - index where the match finished in *str*
   *
   * @param {String} str Input string
   * @param {Number} sidx start position in *str* to match from
   * @returns {Array} [matchedText, eidx] matched text and last position of matched text is *str*
   */
  match(str, sidx) {
    // TODO: speed up:
    // * by bottom up initialie has to find all occurencees
    // * by top-down we can add ^ to the begginging if regexp is not "multiline"
    // maybe the solution is to use //y for parsing and //g for init a bottom-up parser
    this.regExp.lastIndex = sidx;
    const res = this.regExp.exec(str);
    if (!res) {
      return [undefined, undefined];
    }
    return [
      [res[0]],
      this.lexer(str, sidx + res[0].length),
    ];
  }

  /**
   * Search terminal pattern in *str*. Call *callback* each find occurence
   * with (pattren, sidx, eidx) params
   *
   * If one occurence is found, the next one is searched
   *
   * @param {String} str Input string
   * @param {Function} callback Callback to call for each of found occurence
   * @returns {undefined}
   */
  matchAll(str, callback) {
    const regExpWithoutY = new RegExp(
      `(${this.behindRegexpString})(${this.regExp.source})(${this.forwardRegexpString})`,
      this.regExp.flags.replace(/y/, 'g')
    );

    while (true) { // eslint-disable-line no-constant-condition
      const found = regExpWithoutY.exec(str);
      if (!found) {
        return;
      }
      // console.log('bottomUp', regExpWithoutY.lastIndex,
      //             '>>>', found[1], '<<<>>>',
      //             found[2],
      //             '<<<>>> ', found[3], '<<<'
      //            );
      const foundSidx = found.index + found[1].length;
      const foundEidx = this.lexer(str, foundSidx + found[2].length);
      callback(found[2], foundSidx, foundEidx);
      // where to start new match? cannot start found.index + 1, i.e. \d+
      // needs to start after the "word" break but at least at regExpWithoutY.lastIndex
      const space = new RegExp(`\\d+|${UtfCasedAlpha}+|${UtfZs}+`, 'uy');
      // try to skip spaces
      space.lastIndex = foundSidx + 1;
      const wordBreakFound = space.exec(str);
      const wordBreak = wordBreakFound ? space.lastIndex : Number.MAX_SAFE_INTEGER;

      const newIndex = (regExpWithoutY.lastIndex > wordBreak)
        ? wordBreak
        : regExpWithoutY.lastIndex - found[2].length;

      regExpWithoutY.lastIndex = (
        (regExpWithoutY.lastIndex === newIndex) || (foundSidx === newIndex)
      )
        ? regExpWithoutY.lastIndex + 1
        : newIndex;
    }
  }
}
GrmSymbol.registerGrammarSymbol(
  /^\/(.*)\/(?::([A-Za-z][A-Za-z0-9-]*))?$/,
  (match) => new RegExpTerminal(match[1], match[1], 'alpha', match[2])
);

// export {NonTerminal, Terminal, RegExpTerminal}
exports = module.exports = {
  GrmSymbol,
  NonTerminal,
  Terminal,
  RegExpTerminal,
  ApproxTerminal,
};
