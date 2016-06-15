/* eslint-disable no-unused-expressions */

const expect = require('chai').expect;

const { GrmSymbol, EntityTerminal } = require('../..');

describe('EntityTerminal', () => {
  const list = ['1', '2', '3'];
  describe('.registerEntity', () => {
    it('stores entity list and construct regExp', () => {
      EntityTerminal.registerEntity('test', list);
      expect(EntityTerminal.entityStorage.get('test').list).to.equal(list);
      expect(
        '1'.search(EntityTerminal.entityStorage.get('test').regExp)
      ).to.equal(0);
    });
  });

  it('should raise error when entity is not registered', () => {
    const subject = () => new EntityTerminal('unregisteredName');
    expect(subject).to.throw(/Unregistered entity/);
  });

  it('should create new EntityTerminal for registered entity', () => {
    EntityTerminal.registerEntity('registeredEntity', list);
    const subject = () => new EntityTerminal('registeredEntity');
    expect(subject).to.not.throw(Error);
  });

  describe('#toString', () => {
    it('should serialize EntityTerminal to string', () => {
      EntityTerminal.registerEntity('registeredEntity', list);
      const subject = new EntityTerminal('registeredEntity');
      expect(subject.toString()).to.equal('EntityTerminal(registeredEntity)');
    });
  });

  describe('#match', () => {
    it('should match any of registered entities', () => {
      EntityTerminal.registerEntity('testEntity', ['a', 'b']);
      const symbol = GrmSymbol.fromString('EntityTerminal(testEntity)');
      expect(symbol.match('a', 0)).to.eql([['a'], 1]);
      expect(symbol.match(' b', 1)).to.eql([['b'], 2]);
    });
  });
});

describe('GrmSymbol', () => {
  describe('.fromString', () => {
    it('should parser EntityTerminal', () => {
      EntityTerminal.registerEntity('testEntity', ['a', 'b']);
      const symbol = GrmSymbol.fromString('EntityTerminal(testEntity)');
      expect(symbol instanceof EntityTerminal).to.be.true;
    });
  });
});
