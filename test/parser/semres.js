/* eslint-disable no-unused-expressions */

const expect = require('chai').expect;

const { NodeResult, NodeResultArgs } = require('../../src/parser/semres');

describe('NodeResult', () => {
  it('should keep data, weight and text preresentation', () => {
    const subject = new NodeResult('data', 0.5, '("1"), "+", ("1")');
    expect(subject.data).to.equal('data');
    expect(subject.weight).to.equal(0.5);
    expect(subject.txt).to.equal('("1"), "+", ("1")');
  });
});

describe('NodeResultArgs', () => {
  it('should be initialized empty array of NodeResult', () => {
    const subject = new NodeResultArgs([]);
    expect(subject.array).to.be.eql([]);
  });

  it('should be initialized by array of NodeResult', () => {
    const nodeResult = new NodeResult('any data');
    const subject = new NodeResultArgs([nodeResult]);
    expect(subject.array).to.be.eql([nodeResult]);
  });

  it('should throw error when passed args is not array of NodeResult', () => {
    const subjectWithObject = () => new NodeResultArgs({});
    expect(subjectWithObject).to.throw(/Not an array of NodeResults/);

    const subjectWithArray = () => new NodeResultArgs(['x']);
    expect(subjectWithArray).to.throw(/Not an array of NodeResults/);
  });

  describe('#multiply', () => {
    it('should raise an error when param is not array of NodeResults', () => {
      const subject = new NodeResultArgs([]);
      const multiplyByObject = () => subject.multiply({});
      const multiplyByArray = () => subject.multiply(['x']);

      expect(multiplyByObject).to.throw(/Not an array of NodeResults/);
      expect(multiplyByArray).to.throw(/Not an array of NodeResults/);
    });

    context('when self (.array) is empty', () => {
      it('should return array of NodeResultArgs whith one args', () => {
        const subject = new NodeResultArgs([]);
        const nodeResult = [new NodeResult('first'), new NodeResult('second')];
        expect(subject.multiply(nodeResult)).to.eql([
          new NodeResultArgs([new NodeResult('first')]),
          new NodeResultArgs([new NodeResult('second')]),
        ]);
      });
    });

    context('when nodeResults is empty', () => {
      it('should raise an exception', () => {
        const subject = new NodeResultArgs([
          new NodeResult('RHS1-A'), new NodeResult('RHS2-A'),
        ]);
        const subjectCall = () => subject.multiply([]);
        expect(subjectCall).to.throw(/No NodeResult present/);
      });
    });

    context('when self and nodeResults aren\'t empty', () => {
      it('should return array of NodeResultArgs whit added nodeResult to the end', () => {
        const rhs1 = new NodeResult('RHS1');
        const rhs2 = new NodeResult('RHS2');
        const subject = new NodeResultArgs([rhs1, rhs2]);

        const rhs3a = new NodeResult('RHS3-A');
        const rhs3b = new NodeResult('RHS3-B');
        const nodeResults = [rhs3a, rhs3b];

        expect(subject.multiply(nodeResults)).to.eql([
          new NodeResultArgs([rhs1, rhs2, rhs3a]),
          new NodeResultArgs([rhs1, rhs2, rhs3b]),
        ]);
      });
    });
  });

  describe('#apply', () => {
    it('should calculate text representatin', () => {
      const rhs1 = new NodeResult('RHS1', 1.0, 'rhs1()');
      const rhs2 = new NodeResult('RHS2', 0.5, 'rhs2()');
      const subject = new NodeResultArgs([rhs1, rhs2]);
      expect(subject.apply((a, b) => `${a.data}:${b.data}`, 0.1, 'X')).to.eql(
        new NodeResult('RHS1:RHS2', 1.0 * 0.5 * 0.1, 'X(rhs1(), rhs2())')
      );
    });
  });
});

