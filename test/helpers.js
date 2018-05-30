/* eslint no-sync: 0 */
const parse = require('fast-json-parse');
const fs = require('fs');
const chai = require('chai');
const expect = chai.expect;
const compiler = require('../');

const unsupported = {
  success: {
    javascript: {
      java: {},
      python: {},
      csharp: {},
      shell: {}
    },
    shell: {
      java: {},
      javascript: {},
      python: {},
      csharp: {
        'language-types': [ '*' ],
        'bson-methods': [ '*' ],
        'bson-utils': [ '*' ]
      }
    }
  },
  error: {
    javascript: {
      java: {'bson-constructors': [ '*' ]},
      python: {},
      shell: { 'bson-constructors': [ '*' ]},
      csharp: {'bson-constructors': [ '*' ]}
    },
    shell: {
      java: {'bson-constructors': [ '*' ]},
      python: {},
      csharp: {'bson-constructors': [ '*' ]},
      javascript: {'bson-constructors': [ '*' ]}
    }
  }
};

const checkResults = {
  success: function(inputLang, outputLang, test) {
    expect(compiler[inputLang][outputLang].bind(this, test[inputLang])).to.not.throw();
    expect(compiler[inputLang][outputLang](test[inputLang])).to.equal(test[outputLang]);
  },

  error: function(inputLang, outputLang, test) {
    try {
      compiler[inputLang][outputLang](test.query);
    } catch (error) {
      expect(error.code).to.equal(test.errorCode);
    }
  }
};

const readJSON = (filename) => {
  const parseResult = parse(fs.readFileSync(filename));
  // if an error is returned from parsing json, just throw it
  if (parseResult.err) throw new Error(parseResult.err.message);
  return parseResult.value;
};

const runTest = function(mode, testname, inputLang, outputLang, tests) {
  if (inputLang === outputLang) {
    return;
  }
  describe(`${testname}:${inputLang} ==> ${outputLang}`, () => {
    Object.keys(tests).forEach((key) => {
      describe(key, () => {
        tests[key].map((test) => {
          const skip = (
            testname in unsupported[mode][inputLang][outputLang] &&
            (unsupported[mode][inputLang][outputLang][testname].indexOf('*') !== -1 ||
             unsupported[mode][inputLang][outputLang][testname].indexOf(key) !== -1)
          );

          (skip ? xit : it)(
            test.description,
            () => checkResults[mode](inputLang, outputLang, test)
          );
        });
      });
    });
  });
};

module.exports = {readJSON, runTest};
