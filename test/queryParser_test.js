'use strict';

const expect = require('chai').expect;

const lucene = require('../');

describe('queryParser', () => {
  describe('whitespace handling', () => {
    // term parsing
    it('handles empty string', () => {
      const results = lucene.parse('');

      expect(isEmpty(results)).to.equal(true);
    });

    it('handles leading whitespace with no contents', () => {
      const results = lucene.parse(' \r\n');

      expect(isEmpty(results)).to.equal(true);
    });

    it('handles leading whitespace before an expression string', () => {
      const results = lucene.parse(' Test:Foo');

      expect(results.left.field).to.equal('Test');
      expect(results.left.term).to.equal('Foo');
    });

    it('handles whitespace between colon and term', () => {
      const results = lucene.parse('foo: bar');

      expect(results.left.field).to.equal('foo');
      expect(results.left.term).to.equal('bar');
    });

    function isEmpty(arr) {
      for (let i in arr) {
        return false;
      }
      return true;
    }
  });


  describe('term parsing', () => {
    // term parsing
    it('parses terms', () => {
      const results = lucene.parse('bar');

      expect(results.left.term).to.equal('bar');
      expect(results.left.quoted).to.be.false;
      expect(results.left.regex).to.be.false;
    });

    it('parses quoted terms', () => {
      const results = lucene.parse('"fizz buzz"');

      expect(results.left.term).to.equal('fizz buzz');
      expect(results.left.quoted).to.be.true;
      expect(results.left.regex).to.be.false;
    });

    it('parses regex terms', () => {
      const results = lucene.parse('/f[A-z]?o*/');

      expect(results.left.term).to.equal('f[A-z]?o*');
      expect(results.left.quoted).to.be.false;
      expect(results.left.regex).to.be.true;
    });

    it('parses regex terms with escape sequences', () => {
      const results = lucene.parse('/f[A-z]?\\/o*/');

      expect(results.left.term).to.equal('f[A-z]?\\/o*');
      expect(results.left.quoted).to.be.false;
      expect(results.left.regex).to.be.true;
    });

    it('accepts terms with \'-\'', () => {
      const results = lucene.parse('created_at:now-5d');

      expect(results.left.term).to.equal('now-5d');
    });

    it('accepts terms with \'+\'', () => {
      const results = lucene.parse('published_at:now+5d');

      expect(results.left.term).to.equal('now+5d');
    });
  });


  describe('term prefix operators', () => {
    it('parses prefix operators (-)', () => {
      const results = lucene.parse('-bar');

      expect(results.left.term).to.equal('bar');
      expect(results.left.prefix).to.equal('-');
    });

    it('parses prefix operator (!)', () => {
      const results = lucene.parse('!bar');

      expect(results.left.term).to.equal('bar');
      expect(results.left.prefix).to.equal('!');
    });

    it('parses prefix operator (+)', () => {
      const results = lucene.parse('+bar');

      expect(results.left.term).to.equal('bar');
      expect(results.left.prefix).to.equal('+');
    });

    it('parses prefix operator on quoted term (-)', () => {
      const results = lucene.parse('-"fizz buzz"');

      expect(results.left.term).to.equal('fizz buzz');
      expect(results.left.prefix).to.equal('-');
    });

    it('parses prefix operator on quoted term (!)', () => {
      const results = lucene.parse('!"fizz buzz"');

      expect(results.left.term).to.equal('fizz buzz');
      expect(results.left.prefix).to.equal('!');
    });

    it('parses prefix operator on quoted term (+)', () => {
      const results = lucene.parse('+"fizz buzz"');

      expect(results.left.term).to.equal('fizz buzz');
      expect(results.left.prefix).to.equal('+');
    });
  });

  describe('field name support', () => {
    it('parses implicit field name for term', () => {
      const results = lucene.parse('bar');

      expect(results.left.field).to.equal('<implicit>');
      expect(results.left.term).to.equal('bar');
    });

    it('parses implicit field name for quoted term', () => {
      const results = lucene.parse('"fizz buzz"');

      expect(results.left.field).to.equal('<implicit>');
      expect(results.left.term).to.equal('fizz buzz');
    });

    it('parses explicit field name for term', () => {
      const results = lucene.parse('foo:bar');

      expect(results.left.field).to.equal('foo');
      expect(results.left.term).to.equal('bar');
    });

    it('parses explicit field name for date term', () => {
      const results = lucene.parse('foo:2015-01-01');

      expect(results.left.field).to.equal('foo');
      expect(results.left.term).to.equal('2015-01-01');
    });

    it('parses explicit field name including dots (e.g \'sub.field\') for term', () => {
      const results = lucene.parse('sub.foo:bar');

      expect(results.left.field).to.equal('sub.foo');
      expect(results.left.term).to.equal('bar');
    });

    it('parses explicit field name for quoted term', () => {
      const results = lucene.parse('foo:"fizz buzz"');

      expect(results.left.field).to.equal('foo');
      expect(results.left.term).to.equal('fizz buzz');
    });

    it('parses explicit field name for term with - prefix', () => {
      const results = lucene.parse('-foo:bar');

      expect(results.left.field).to.equal('foo');
      expect(results.left.term).to.equal('bar');
      expect(results.left.prefix).to.equal('-');
    });

    it('parses explicit field name for term with + prefix', () => {
      const results = lucene.parse('+foo:bar');

      expect(results.left.field).to.equal('foo');
      expect(results.left.term).to.equal('bar');
      expect(results.left.prefix).to.equal('+');
    });

    it('parses explicit field name for quoted term with - prefix', () => {
      const results = lucene.parse('-foo:"fizz buzz"');

      expect(results.left.field).to.equal('foo');
      expect(results.left.term).to.equal('fizz buzz');
      expect(results.left.prefix).to.equal('-');
    });

    it('parses explicit field name for quoted term with + prefix', () => {
      const results = lucene.parse('+foo:"fizz buzz"');

      expect(results.left.field).to.equal('foo');
      expect(results.left.term).to.equal('fizz buzz');
      expect(results.left.prefix).to.equal('+');
    });
  });

  describe('conjunction operators', () => {
    it('parses implicit conjunction operator (OR)', () => {
      const results = lucene.parse('fizz buzz');
      expect(results.left.term).to.equal('fizz');
      expect(results.operator).to.equal('<implicit>');
      expect(results.right.term).to.equal('buzz');
    });

    it('parses explicit conjunction operator (AND)', () => {
      const results = lucene.parse('fizz AND buzz');

      expect(results.left.term).to.equal('fizz');
      expect(results.operator).to.equal('AND');
      expect(results.right.term).to.equal('buzz');
    });

    it('parses explicit conjunction operator (OR)', () => {
      const results = lucene.parse('fizz OR buzz');

      expect(results.left.term).to.equal('fizz');
      expect(results.operator).to.equal('OR');
      expect(results.right.term).to.equal('buzz');
    });

    it('parses explicit conjunction operator (NOT)', () => {
      const results = lucene.parse('fizz NOT buzz');

      expect(results.left.term).to.equal('fizz');
      expect(results.operator).to.equal('NOT');
      expect(results.right.term).to.equal('buzz');
    });

    it('parses explicit conjunction operator (&&)', () => {
      const results = lucene.parse('fizz && buzz');

      expect(results.left.term).to.equal('fizz');
      expect(results.operator).to.equal('&&');
      expect(results.right.term).to.equal('buzz');
    });

    it('parses explicit conjunction operator (||)', () => {
      const results = lucene.parse('fizz || buzz');

      expect(results.left.term).to.equal('fizz');
      expect(results.operator).to.equal('||');
      expect(results.right.term).to.equal('buzz');
    });
  });

  describe('parentheses groups', () => {
    it('parses parentheses group', () => {
      const results = lucene.parse('fizz (buzz baz)');

      expect(results.left.term).to.equal('fizz');
      expect(results.operator).to.equal('<implicit>');
      expect(results.parenthesized).to.equal(undefined);

      const rightNode = results.right;

      expect(rightNode.left.term).to.equal('buzz');
      expect(rightNode.operator).to.equal('<implicit>');
      expect(rightNode.parenthesized).to.equal(true);
      expect(rightNode.right.term).to.equal('baz');
    });

    it('parses parentheses groups with explicit conjunction operators ', () => {
      const results = lucene.parse('fizz AND (buzz OR baz)');

      expect(results.left.term).to.equal('fizz');
      expect(results.operator).to.equal('AND');

      const rightNode = results.right;

      expect(rightNode.left.term).to.equal('buzz');
      expect(rightNode.operator).to.equal('OR');
      expect(rightNode.right.term).to.equal('baz');
    });
  });

  describe('range expressions', () => {
    it('parses inclusive range expression', () => {
      const results = lucene.parse('foo:[bar TO baz]');

      expect(results.left.field).to.equal('foo');
      expect(results.left.termMin).to.equal('bar');
      expect(results.left.termMax).to.equal('baz');
      expect(results.left.minInclusive).to.equal(true);
      expect(results.left.maxInclusive).to.equal(true);
    });

    it('parses exclusive range expression', () => {
      const results = lucene.parse('foo:{bar TO baz}');

      expect(results.left.field).to.equal('foo');
      expect(results.left.termMin).to.equal('bar');
      expect(results.left.termMax).to.equal('baz');
      expect(results.left.minInclusive).to.equal(false);
      expect(results.left.maxInclusive).to.equal(false);
    });

    it('parses mixed range expression (left inclusive)', () => {
      const results = lucene.parse('foo:[bar TO baz}');

      expect(results.left.field).to.equal('foo');
      expect(results.left.termMin).to.equal('bar');
      expect(results.left.termMax).to.equal('baz');
      expect(results.left.minInclusive).to.equal(true);
      expect(results.left.maxInclusive).to.equal(false);
    });

    it('parses mixed range expression (right inclusive)', () => {
      const results = lucene.parse('foo:{bar TO baz]');

      expect(results.left.field).to.equal('foo');
      expect(results.left.termMin).to.equal('bar');
      expect(results.left.termMax).to.equal('baz');
      expect(results.left.minInclusive).to.equal(false);
      expect(results.left.maxInclusive).to.equal(true);
    });

    it('parses ranges with spaces', () => {
      const results = lucene.parse('foo:{ bar TO baz      ]');

      expect(results.left.field).to.equal('foo');
      expect(results.left.termMin).to.equal('bar');
      expect(results.left.termMax).to.equal('baz');
      expect(results.left.minInclusive).to.equal(false);
      expect(results.left.maxInclusive).to.equal(true);
    });

    it('handles quoted terms in range', () => {
      const results = lucene.parse('foo:{"1000" TO "1001"]');

      expect(results.left.field).to.equal('foo');
      expect(results.left.termMin).to.equal('"1000"');
      expect(results.left.termMax).to.equal('"1001"');
      expect(results.left.minInclusive).to.equal(false);
      expect(results.left.maxInclusive).to.equal(true);
    });

    it('parses mixed range expression (right inclusive) with date ISO format', () => {
      const results = lucene.parse('date:{2017-11-17T01:32:45.123Z TO 2017-11-18T04:28:11.999Z]');

      expect(results.left.field).to.equal('date');
      expect(results.left.termMin).to.equal('2017-11-17T01:32:45.123Z');
      expect(results.left.termMax).to.equal('2017-11-18T04:28:11.999Z');
      expect(results.left.minInclusive).to.equal(false);
      expect(results.left.maxInclusive).to.equal(true);
    });

    describe('single-sided range expressions', function() {
      it('parses a left inclusive range', () => {
        const results = lucene.parse('foo:>=42');

        expect(results.left.field).to.equal('foo');
        expect(results.left.termMin).to.equal('42');
        expect(results.left.termMax).to.equal('<implicit>');
        expect(results.left.minInclusive).to.equal(true);
        expect(results.left.maxInclusive).to.equal(true);
      });

      it('parses a left exclusive range', () => {
        const results = lucene.parse('foo:>42');

        expect(results.left.field).to.equal('foo');
        expect(results.left.termMin).to.equal('42');
        expect(results.left.termMax).to.equal('<implicit>');
        expect(results.left.minInclusive).to.equal(false);
        expect(results.left.maxInclusive).to.equal(true);
      });

      it('parses a right inclusive range', () => {
        const results = lucene.parse('foo:<=42');

        expect(results.left.field).to.equal('foo');
        expect(results.left.termMin).to.equal('<implicit>');
        expect(results.left.termMax).to.equal('42');
        expect(results.left.minInclusive).to.equal(true);
        expect(results.left.maxInclusive).to.equal(true);
      });

      it('parses a right exclusive range', () => {
        const results = lucene.parse('foo:<42');

        expect(results.left.field).to.equal('foo');
        expect(results.left.termMin).to.equal('<implicit>');
        expect(results.left.termMax).to.equal('42');
        expect(results.left.minInclusive).to.equal(true);
        expect(results.left.maxInclusive).to.equal(false);
      });

      it('parses date math', () => {
        const results = lucene.parse('foo:>now+5d');

        expect(results.left.field).to.equal('foo');
        expect(results.left.termMin).to.equal('now+5d');
        expect(results.left.termMax).to.equal('<implicit>');
        expect(results.left.minInclusive).to.equal(false);
        expect(results.left.maxInclusive).to.equal(true);
      });
    });
  });

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

  describe('syntax errors', () => {
    it('must throw on missing brace', () => {
      expect(() => lucene.parse('(foo:bar')).to.throw(/SyntaxError: Expected/);
    });

    it('must throw on missing brace', () => {
      expect(() => lucene.parse('foo:')).to.throw(/SyntaxError: Expected/);
    });
  });

  describe('escaped sequences in quoted terms', () => {
    it('must support simple quote escape', () => {
      const results = lucene.parse('foo:"a\\"b"');

      expect(results.left.field).to.equal('foo');
      expect(results.left.term).to.equal('a\\"b');
    });

    it('must support multiple quoted terms', () => {
      const results = lucene.parse('"a\\"b" "c\\"d"');

      expect(results.left.term).to.equal('a\\"b');
      expect(results.right.term).to.equal('c\\"d');
    });

    it('must correctly escapes other reserved characters', () => {
      const results = lucene.parse('"a\\:b" "c\\~d\\+\\-\\?\\*"');

      expect(results.left.term).to.equal('a\\:b');
      expect(results.right.term).to.equal('c\\~d\\+\\-\\?\\*');
    });
  });

  describe('escaped sequences in unquoted terms', () => {
    it('must escape a + character', () => {
      const results = lucene.parse('foo\\: asdf');

      expect(results.left.term).to.equal('foo\\:');
      expect(results.right.term).to.equal('asdf');
    });

    it('must escape brackets, braces, and parenthesis characters', () => {
      const results = lucene.parse('a\\(b\\)\\{c\\}\\[d\\]e');
      expect(results.left.term).to.equal('a\\(b\\)\\{c\\}\\[d\\]e');
    });

    it('must respect quoted whitespace', () => {
      const results = lucene.parse('foo:a\\ b');

      expect(results.left.term).to.equal('a\\ b');
    });

    it('must respect quoted and unquoted whitespace', () => {
      const results = lucene.parse('foo:a\\ b c\\ d');

      expect(results.left.term).to.equal('a\\ b');
      expect(results.right.term).to.equal('c\\ d');
    });
  });

  describe('escaped sequences field names', () => {
    it('escape', () => {
      const results = lucene.parse('foo\\~bar: asdf');

      expect(results.left.field).to.equal('foo\\~bar');
      expect(results.left.term).to.equal('asdf');
    });
  });

  describe('position information', () => {
    it('retains position information', () => {
      const results = lucene.parse('test:Foo');

      expect(results.left.fieldLocation.start.offset).to.equal(0);
      expect(results.left.fieldLocation.end.offset).to.equal(4);
      expect(results.left.termLocation.start.offset).to.equal(5);
      expect(results.left.termLocation.end.offset).to.equal(8);
    });

    it('retains range position information', () => {
      const results = lucene.parse('test:[200 TO     500]');

      expect(results.left.fieldLocation.start.offset).to.equal(0);
      expect(results.left.fieldLocation.end.offset).to.equal(4);
      expect(results.left.termMinLocation.start.offset).to.equal(6);
      expect(results.left.termMinLocation.end.offset).to.equal(9);
      expect(results.left.termMaxLocation.start.offset).to.equal(17);
      expect(results.left.termMaxLocation.end.offset).to.equal(20);
    });
  });
});
