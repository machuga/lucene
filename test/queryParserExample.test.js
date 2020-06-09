'use strict';

const expect = require('chai').expect;

const lucene = require('../');

describe('Lucene Query syntax documentation examples', () => {
  /*
      Examples from Lucene documentation at

      http://lucene.apache.org/java/2_9_4/queryparsersyntax.html

      title:"The Right Way" AND text:go
      title:"Do it right" AND right
      title:Do it right

      te?t
      test*
      te*t

      roam~
      roam~0.8

      "jakarta apache"~10
      mod_date:[20020101 TO 20030101]
      title:{Aida TO Carmen}

      jakarta apache
      jakarta^4 apache
      "jakarta apache"^4 "Apache Lucene"
      "jakarta apache" jakarta
      "jakarta apache" OR jakarta
      "jakarta apache" AND "Apache Lucene"
      +jakarta lucene
      "jakarta apache" NOT "Apache Lucene"
      NOT "jakarta apache"
      "jakarta apache" -"Apache Lucene"
      (jakarta OR apache) AND website
      title:(+return +"pink panther")
  */

  it('parses example: title:"The Right Way" AND text:go', () => {
    const results = lucene.parse('title:"The Right Way" AND text:go');

    expect(results.left.field).to.equal('title');
    expect(results.left.term).to.equal('The Right Way');
    expect(results.operator).to.equal('AND');
    expect(results.right.field).to.equal('text');
    expect(results.right.term).to.equal('go');
  });

  it('parses example: title:"Do it right" AND right', () => {
    const results = lucene.parse('title:"Do it right" AND right');

    expect(results.left.field).to.equal('title');
    expect(results.left.term).to.equal('Do it right');
    expect(results.operator).to.equal('AND');
    expect(results.right.field).to.equal('<implicit>');
    expect(results.right.term).to.equal('right');
  });

  it('parses example: title:Do it right', () => {
    const results = lucene.parse('title:Do it right');
    const rightNode = results.right;

    expect(results.left.field).to.equal('title');
    expect(results.left.term).to.equal('Do');
    expect(results.operator).to.equal('<implicit>');


    expect(rightNode.left.field).to.equal('<implicit>');
    expect(rightNode.left.term).to.equal('it');
    expect(rightNode.operator).to.equal('<implicit>');

    expect(rightNode.right.field).to.equal('<implicit>');
    expect(rightNode.right.term).to.equal('right');
  });

  it('parses example: te?t', () => {
    const results = lucene.parse('te?t');

    expect(results.left.field).to.equal('<implicit>');
    expect(results.left.term).to.equal('te?t');
  });

  it('parses example: test*', () => {
    const results = lucene.parse('test*');

    expect(results.left.field).to.equal('<implicit>');
    expect(results.left.term).to.equal('test*');
  });

  it('parses example: te*t', () => {
    const results = lucene.parse('te*t');

    expect(results.left.field).to.equal('<implicit>');
    expect(results.left.term).to.equal('te*t');
  });

  it('parses example: roam~', () => {
    const results = lucene.parse('roam~');

    expect(results.left.field).to.equal('<implicit>');
    expect(results.left.term).to.equal('roam');
    expect(results.left.similarity).to.equal(0.5);
  });

  it('parses example: roam~0.8', () => {
    const results = lucene.parse('roam~0.8');

    expect(results.left.field).to.equal('<implicit>');
    expect(results.left.term).to.equal('roam');
    expect(results.left.similarity).to.equal(0.8);
  });

  it('parses example: "jakarta apache"~10', () => {
    const results = lucene.parse('"jakarta apache"~10');

    expect(results.left.field).to.equal('<implicit>');
    expect(results.left.term).to.equal('jakarta apache');
    expect(results.left.proximity).to.equal(10);
  });

  it('parses example: mod_date:[20020101 TO 20030101]', () => {
    const results = lucene.parse('mod_date:[20020101 TO 20030101]');

    expect(results.left.field).to.equal('mod_date');
    expect(results.left.termMin).to.equal('20020101');
    expect(results.left.termMax).to.equal('20030101');
    expect(results.left.minInclusive).to.equal(true);
    expect(results.left.maxInclusive).to.equal(true);
  });

  it('parses example: title:{Aida TO Carmen}', () => {
    const results = lucene.parse('title:{Aida TO Carmen}');

    expect(results.left.field).to.equal('title');
    expect(results.left.termMin).to.equal('Aida');
    expect(results.left.termMax).to.equal('Carmen');
    expect(results.left.minInclusive).to.equal(false);
    expect(results.left.maxInclusive).to.equal(false);
  });

  it('parses example: jakarta apache', () => {
    const results = lucene.parse('jakarta apache');

    expect(results.left.field).to.equal('<implicit>');
    expect(results.left.term).to.equal('jakarta');
    expect(results.operator).to.equal('<implicit>');
    expect(results.right.field).to.equal('<implicit>');
    expect(results.right.term).to.equal('apache');
  });

  it('parses example: jakarta^4 apache', () => {
    const results = lucene.parse('jakarta^4 apache');

    expect(results.left.field).to.equal('<implicit>');
    expect(results.left.term).to.equal('jakarta');
    expect(results.left.boost).to.equal(4);
    expect(results.operator).to.equal('<implicit>');
    expect(results.right.field).to.equal('<implicit>');
    expect(results.right.term).to.equal('apache');
  });

  it('parses example: "jakarta apache"^4 "Apache Lucene"', () => {
    const results = lucene.parse('"jakarta apache"^4 "Apache Lucene"');


    expect(results.left.field).to.equal('<implicit>');
    expect(results.left.term).to.equal('jakarta apache');
    expect(results.left.boost).to.equal(4);
    expect(results.operator).to.equal('<implicit>');
    expect(results.right.field).to.equal('<implicit>');
    expect(results.right.term).to.equal('Apache Lucene');

  });

  it('parses example: "jakarta apache" jakarta', () => {
    const results = lucene.parse('"jakarta apache" jakarta');

    expect(results.left.field).to.equal('<implicit>');
    expect(results.left.term).to.equal('jakarta apache');
    expect(results.operator).to.equal('<implicit>');
    expect(results.right.field).to.equal('<implicit>');
    expect(results.right.term).to.equal('jakarta');
  });

  it('parses example: "jakarta apache" OR jakarta', () => {
    const results = lucene.parse('"jakarta apache" OR jakarta');

    expect(results.left.field).to.equal('<implicit>');
    expect(results.left.term).to.equal('jakarta apache');
    expect(results.operator).to.equal('OR');
    expect(results.right.field).to.equal('<implicit>');
    expect(results.right.term).to.equal('jakarta');
  });

  it('parses example: "jakarta apache" AND "Apache Lucene"', () => {
    const results = lucene.parse('"jakarta apache" AND "Apache Lucene"');

    expect(results.left.field).to.equal('<implicit>');
    expect(results.left.term).to.equal('jakarta apache');
    expect(results.operator).to.equal('AND');
    expect(results.right.field).to.equal('<implicit>');
    expect(results.right.term).to.equal('Apache Lucene');
  });

  it('parses example: +jakarta lucene', () => {
    const results = lucene.parse('+jakarta lucene');

    expect(results.left.field).to.equal('<implicit>');
    expect(results.left.term).to.equal('jakarta');
    expect(results.left.prefix).to.equal('+');
  });

  it('parses example: "jakarta apache" NOT "Apache Lucene"', () => {
    const results = lucene.parse('"jakarta apache" NOT "Apache Lucene"');

    expect(results.left.field).to.equal('<implicit>');
    expect(results.left.term).to.equal('jakarta apache');
    expect(results.operator).to.equal('NOT');
    expect(results.right.field).to.equal('<implicit>');
    expect(results.right.term).to.equal('Apache Lucene');
  });

  it('parses example: NOT "jakarta apache"', () => {
    const results = lucene.parse('NOT "jakarta apache"');

    expect(results.left.field).to.equal('<implicit>');
    expect(results.left.term).to.equal('jakarta apache');
    expect(results.start).to.equal('NOT');
    expect(results.right).to.equal(undefined);
    expect(results.operator).to.equal(undefined);
  });

  it('parses example: "jakarta apache" -"Apache Lucene"', () => {
    const results = lucene.parse('"jakarta apache" -"Apache Lucene"');

    expect(results.left.field).to.equal('<implicit>');
    expect(results.left.term).to.equal('jakarta apache');
    expect(results.operator).to.equal('<implicit>');
    expect(results.right.field).to.equal('<implicit>');
    expect(results.right.term).to.equal('Apache Lucene');
    expect(results.right.prefix).to.equal('-');
  });

  it('parses example: (jakarta OR apache) AND website', () => {
    const results = lucene.parse('(jakarta OR apache) AND website');
    const leftNode = results.left;

    expect(leftNode.left.field).to.equal('<implicit>');
    expect(leftNode.left.term).to.equal('jakarta');
    expect(leftNode.operator).to.equal('OR');
    expect(leftNode.right.field).to.equal('<implicit>');
    expect(leftNode.right.term).to.equal('apache');

    expect(results.operator).to.equal('AND');
    expect(results.right.field).to.equal('<implicit>');
    expect(results.right.term).to.equal('website');
  });

  it('parses example: title:(+return +"pink panther")', () => {
    const results = lucene.parse('title:(+return +"pink panther")');
    const leftNode = results.left;

    expect(leftNode.left.field).to.equal('<implicit>');
    expect(leftNode.left.term).to.equal('return');
    expect(leftNode.left.prefix).to.equal('+');
    expect(leftNode.operator).to.equal('<implicit>');
    expect(leftNode.right.field).to.equal('<implicit>');
    expect(leftNode.right.term).to.equal('pink panther');
    expect(leftNode.right.prefix).to.equal('+');
    expect(leftNode.field).to.equal('title');
  });

  it('parses example: java AND NOT yamaha', () => {
    const results = lucene.parse('java AND NOT yamaha');

    expect(results.left.field).to.equal('<implicit>');
    expect(results.left.term).to.equal('java');
    expect(results.operator).to.equal('AND NOT');
    expect(results.right.field).to.equal('<implicit>');
    expect(results.right.term).to.equal('yamaha');
  });

  it('parses example: NOT (java OR python) AND android', () => {
    const results = lucene.parse('NOT (java OR python) AND android');
    const leftNode = results.left;

    expect(results.start).to.equal('NOT');

    expect(leftNode.left.field).to.equal('<implicit>');
    expect(leftNode.left.term).to.equal('java');
    expect(leftNode.operator).to.equal('OR');
    expect(leftNode.right.field).to.equal('<implicit>');
    expect(leftNode.right.term).to.equal('python');

    expect(results.operator).to.equal('AND');
    expect(results.right.field).to.equal('<implicit>');
    expect(results.right.term).to.equal('android');
  });

  it('must handle whitespace in parens', () => {
    const result = lucene.parse('foo ( bar OR baz)');

    expect(result.left.field).to.equal('<implicit>');
    expect(result.left.term).to.equal('foo');
    expect(result.operator).to.equal('<implicit>');
    expect(result.right.left.term).to.equal('bar');
    expect(result.right.operator).to.equal('OR');
    expect(result.right.right.term).to.equal('baz');
  });
});
