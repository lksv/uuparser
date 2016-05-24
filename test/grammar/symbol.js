const expect = require('chai').expect;

const parser = require('../..');
const GrmSymbol = parser.GrmSymbol;
const NonTerminal = parser.NonTerminal;
const Terminal = parser.Terminal;
const RegExpTerminal = parser.RegExpTerminal;

describe('GrmSymbol', () => {
  it('should take one param', () => {
    expect(new GrmSymbol('name')).to.be.an.instanceof(GrmSymbol);
  });

  it('should have property .name', () => {
    const subject = new GrmSymbol('customName');
    expect(subject.name).to.equal('customName');
  });
});

describe('NonTerminal', () => {
  describe('#toString', () => {
    it('should return .name property', () => {
      const subject = new NonTerminal('NONTERMINAL');
      expect(subject.toString()).to.equal('NONTERMINAL');
    });
  });
});

describe('Terminal', () => {
  const subject = new Terminal('terminal');
  describe('#toString', () => {
    it('should return .name property surounded in ""', () => {
      expect(subject.toString()).to.equal('"terminal"');
    });
  });
  describe('#match', () => {
    it('should match exact match with input', () => {
      expect(subject.match('terminal here')).to.equal('terminal');
    });
  });
});

describe('RegExpTerminal', () => {
  it('could take String', () => {
    expect(new RegExpTerminal('abc').regExp).to.be.instanceof(RegExp);
  });
  it('could take Regexp', () => {
    expect(new RegExpTerminal(/abc/).regExp).to.be.instanceof(RegExp);
  });

  const subject = new RegExpTerminal('\\d+');

  describe('#toString', () => {
    it('should return .name property surounded in //', () => {
      expect(subject.toString()).to.equal('/\\d+/');
    });
  });

  describe('#match', () => {
    it('should match exact match with input', () => {
      expect(subject.match('123 here')).to.equal('123');
    });
  });
});
