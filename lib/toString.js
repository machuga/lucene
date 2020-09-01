'use strict';

var implicit = '<implicit>';
var wildcard = '*';
var negativeOps = ['NOT', '!'];

module.exports = function toString(ast) {
  if (!ast) {
    return '';
  }

  var result = '';

  if (ast.start != null) {
    result += (ast.parenthesized ? '(' : '') + ast.start + ' ';
  }

  if (ast.prefix) {
    result += ast.prefix;
  }

  if (ast.field && ast.field !== implicit) {
    result += ast.field + ':';
  }

  if (ast.left) {
    if (ast.parenthesized && !ast.start) {
      result += '(';
    }
    result += toString(ast.left);

    if (ast.parenthesized && !ast.right) {
      result += ')';
    }
  }

  if (ast.operator) {
    var isNegativeOp = negativeOps.indexOf(ast.operator) !== -1;

    if (ast.left && !ast.type && isNegativeOp) {
      result = ast.operator + ' ' + result;
    } else {
      if (ast.left) {
        result += ' ';
      }

      if (ast.operator !== implicit) {
        result += ast.operator;
      }
    }
  }

  if (ast.right) {
    if (ast.operator && ast.operator !== implicit) {
      result += ' ';
    }
    result += toString(ast.right);

    if (ast.parenthesized) {
      result += ')';
    }
  }

  if (ast.term || (ast.term === '' && ast.quoted)) {
    if (ast.quoted) {
      result += '"';
      result += ast.term;
      result += '"';
    } else if (ast.regex) {
      result += '/';
      result += ast.term;
      result += '/';
    } else {
      result += ast.term;
    }

    if (ast.proximity != null) {
      result += '~' + ast.proximity;
    }

    if (ast.boost != null) {
      result += '^' + ast.boost;
    }
  }

  if (ast.termMin) {
    if (ast.termMin === wildcard || ast.termMax === wildcard) {
      result += ast.termMin === wildcard ? '<' : '>';
      result += (ast.minInclusive === true && ast.termMin !== wildcard) || (ast.maxInclusive === true && ast.termMax !== wildcard) ? '=' : '';
      result += ast.termMin === wildcard ? ast.termMax : ast.termMin;
    } else {
      if (ast.minInclusive) {
        result += '[';
      } else {
        result += '{';
      }

      result += ast.termMin;
      result += ' TO ';
      result += ast.termMax;

      if (ast.maxInclusive) {
        result += ']';
      } else {
        result += '}';
      }
    }
  }

  if (ast.similarity) {
    result += '~';

    if (ast.similarity !== 0.5) {
      result += ast.similarity;
    }
  }

  return result;
};
