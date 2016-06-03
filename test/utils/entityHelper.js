/* eslint-disable no-unused-expressions */

const expect = require('chai').expect;

const EntityHelper = require('../..').EntityHelper;

describe('EntityHelper', () => {
  describe('._specialChars2Reg', () => {
    it('leave string as is when do not contain special characters', () => {
      expect(EntityHelper._specialChars2Reg('xxx')).to.equal('xxx');
    });

    it('escape regular expression special characters', () => {
      expect(EntityHelper._specialChars2Reg('[](){}+.*?^$|\\')).to.equal(
        '\\[\\]\\(\\)\\{\\}\\+\\.\\*\\?\\^\\$\\|\\\\'
      );
    });

    it('converts spaces to \\s{1,4}', () => {
      expect(EntityHelper._specialChars2Reg('  x ')).to.equal('\\s{1,4}x\\s{1,4}');
    });

    it('converts "-" to \\s{0,4}-\\s{0,4}', () => {
      expect(EntityHelper._specialChars2Reg('aa-bb')).to.equal('aa\\s{0,4}\\-\\s{0,4}bb');
      expect(EntityHelper._specialChars2Reg('aa - bb')).to.equal('aa\\s{0,4}\\-\\s{0,4}bb');
    });
  });

  describe('._partial', () => {
    it('returns empty Map for empty input', () => {
      expect(EntityHelper._partial([])).to.eql(new Map);
    });

    it('use first keys for groupBy, rest of string pusts to values', () => {
      const res = EntityHelper._partial(['ax', 'ay', 'b']);
      expect(Array.from(res.keys())).to.eql(['a', 'b']);
      expect(Array.from(res.get('a'))).to.eql(['x', 'y']);
      expect(Array.from(res.get('b'))).to.eql(['']);
    });

    it('uniques the group values', () => {
      const res = EntityHelper._partial(['ab', 'ab', 'a', 'a']);
      expect(Array.from(res.keys())).to.eql(['a']);
      expect(Array.from(res.get('a'))).to.eql(['b', '']);
    });
  });
});

