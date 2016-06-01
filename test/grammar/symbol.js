/* eslint-disable no-unused-expressions */

const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.use(sinonChai);
const expect = chai.expect;

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
      expect(subject.match('xxx terminal here', 4)).to.eql([['terminal'], 12]);
    });
  });

  describe('#matchAll', () => {
    it('do not call callback when no occurences', () => {
      const callback = sinon.spy();
      subject.matchAll('bla bla bla', callback);
      expect(callback).to.have.not.been.called;
    });

    it('calls calback for each occurence', () => {
      const s = new Terminal('aba');
      const callback = sinon.spy();
      s.matchAll('ababa  aba', callback);
      expect(callback).to.have.been.calledThrice;
      expect(callback).to.have.been.calledWith('aba', 0, 3);
      expect(callback).to.have.been.calledWith('aba', 2, 5);
      expect(callback).to.have.been.calledWith('aba', 7, 10);
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
      expect(subject.toString()).to.equal('/\\d+/y');
    });
  });

  describe('#match', () => {
    it('should match exact match with input', () => {
      expect(subject.match('xxx 123 here', 4)).to.eql([['123'], 7]);
    });
  });

  describe('#matchAll', () => {
    it('do not call callback when no occurences', () => {
      const callback = sinon.spy();
      subject.matchAll('bla bla bla', callback);
      expect(callback).to.have.not.been.called;
    });

    it('calls calback for each occurence', () => {
      const s = new RegExpTerminal(/[^ ]+/);
      const callback = sinon.spy();
      s.matchAll('abcd123xyz  aba', callback);
      expect(callback).to.have.callCount(4);
      expect(callback).to.have.been.calledWith('abcd123xyz', 0, 10);
      expect(callback).to.have.been.calledWith('123xyz', 4, 10);
      expect(callback).to.have.been.calledWith('xyz', 7, 10);
      expect(callback).to.have.been.calledWith('aba', 12, 15);
    });
  });
});
