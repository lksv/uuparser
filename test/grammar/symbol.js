var expect = require('chai').expect;

var parser = require('../..'),
  GrmSymbol = parser.GrmSymbol,
  NonTerminal = parser.NonTerminal,
  Terminal = parser.Terminal,
  RegExpTerminal = parser.RegExpTerminal;

describe('GrmSymbol', () => {
  it('should take one param', () => {
    expect(new GrmSymbol('name')).to.be.an.instanceof(GrmSymbol);
  });

  it('should have property .name', () => {
    var subject = new GrmSymbol('customName');
    expect(subject.name).to.equal('customName');
  });
});

describe('NonTerminal', () => {
  describe('#toString', () => {
    it('should return .name property', () => {
      var subject = new NonTerminal('NONTERMINAL');
      expect(subject.toString()).to.equal('NONTERMINAL');
    });
  });
});

describe('Terminal', () => {
  var subject = new Terminal('terminal');
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

  var subject = new RegExpTerminal('\\d+');

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
