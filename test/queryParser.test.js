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
