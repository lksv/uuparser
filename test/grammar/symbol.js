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

  describe('.fromString', () => {
    it('raises an error on unrecognized string', () => {
      const condition = () => GrmSymbol.fromString('! no valid Str!n6');
      expect(condition).to.throw(/Cannot convert/);
    });

    it('parse NonTerminal symbol', () => {
      expect(GrmSymbol.fromString('ABC_N1')).to.eql(new NonTerminal('ABC_N1'));
    });

    it('parse Terminal symbol', () => {
      expect(GrmSymbol.fromString('"some string!@#"')).to
        .eql(new Terminal('some string!@#'));
    });

    it('parse RegExpTerminal symbol', () => {
      expect(GrmSymbol.fromString('/regexp/')).to
        .eql(new RegExpTerminal('regexp'));
    });

    it('parse custom registerd symbol', () => {
      GrmSymbol.registerGrammarSymbol(/^abc$/, () => new GrmSymbol('XXX'));
      expect(GrmSymbol.fromString('abc')).to.eql(new GrmSymbol('XXX'));
    });
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

    it('calls calback for each occurence when no bounds', () => {
      const s = new RegExpTerminal('nonWord', /[^ ]+/, ['', '']);
      const callback = sinon.spy();
      s.matchAll('abcd123xyz  aba', callback);
      expect(callback).to.have.callCount(4);
      expect(callback).to.have.been.calledWith('abcd123xyz', 0, 10);
      expect(callback).to.have.been.calledWith('123xyz', 4, 10);
      expect(callback).to.have.been.calledWith('xyz', 7, 10);
      expect(callback).to.have.been.calledWith('aba', 12, 15);
    });

    it('calls calback for each occurence when alpha bounds', () => {
      const s = new RegExpTerminal('names', /(?:xxx|yyy)/, 'alpha');
      const callback = sinon.spy();
      s.matchAll('axxx xxxa aaxxxaa byyy yyyb ccyyycc 1xxx1 xxx yyy', callback);
      expect(callback).to.have.callCount(3);
      expect(callback).to.have.been.calledWith('xxx', 37, 40);
      expect(callback).to.have.been.calledWith('xxx', 42, 45);
      expect(callback).to.have.been.calledWith('yyy', 46, 49);
    });

    it('calls calback for each occurence when alnum bounds', () => {
      const s = new RegExpTerminal('names', /(?:xxx|yyy)/, 'alnum');
      const callback = sinon.spy();
      s.matchAll('axxx xxxa aaxxxaa byyy yyyb ccyyycc 1xxx1 xxx yyy', callback);
      expect(callback).to.have.callCount(2);
      expect(callback).to.have.been.calledWith('xxx', 42, 45);
      expect(callback).to.have.been.calledWith('yyy', 46, 49);
    });
  });
});
