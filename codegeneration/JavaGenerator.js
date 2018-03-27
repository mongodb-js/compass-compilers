/* eslint complexity: 0 */
const CodeGenerator = require('./CodeGenerator.js');
const {
  Types,
  JSClasses,
  BsonClasses
} = require('./SymbolTable');

const {
  doubleQuoteStringify,
  CodeGenerationError
} = require('./helpers');

const JAVA_REGEX_FLAGS = {
  i: 'i', m: 'm', u: 'u', y: '', g: ''
};

const JAVA_BINARY_SUBTYPES = {
  0: 'org.bson.BsonBinarySubType.BINARY',
  1: 'org.bson.BsonBinarySubType.FUNCTION',
  2: 'org.bson.BsonBinarySubType.BINARY',
  3: 'org.bson.BsonBinarySubType.UUID_LEGACY',
  4: 'org.bson.BsonBinarySubType.UUID',
  5: 'org.bson.BsonBinarySubType.MD5',
  128: 'org.bson.BsonBinarySubType.USER_DEFINED'
};

/**
 * This Visitor walks the tree generated by parsers and produces Java code.
 *
 * @returns {object}
 */
function Visitor() {
  CodeGenerator.call(this);
  return this;
}
Visitor.prototype = Object.create(CodeGenerator.prototype);
Visitor.prototype.constructor = Visitor;

/**
 * Child nodes: propertyAssignment+
 *
 * @param {PropertyNameAndValueListContext} ctx
 * @return {String}
 */
Visitor.prototype.visitPropertyNameAndValueList = function(ctx) {
  return this.visitChildren(ctx, {children: ctx.propertyAssignment()});
};

/**
 * Child nodes: (elision* singleExpression*)+
 * @param {ElementListContext} ctx
 * @return {String}
 */
Visitor.prototype.visitElementList = function(ctx) {
  const children = ctx.children.filter((child) => {
    return child.constructor.name !== 'TerminalNodeImpl';
  });
  return this.visitChildren(ctx,
    { children: children, separator: ', '}
  );
};

/**
 * Ignore the new keyword because JS could either have it or not, but we always
 * need it in Java so we'll add it when we call constructors.
 * TODO: do we ever need the second arguments expr?
 *
 * Child nodes: singleExpression arguments?
 *
 * @param {NewExpressionContext} ctx
 * @return {String}
 */
Visitor.prototype.visitNewExpression = function(ctx) {
  const expr = this.visit(ctx.singleExpression());
  ctx.type = ctx.singleExpression().type;
  return expr;
};

/**
 * Child nodes: propertyNameAndValueList?
 * @param {ObjectLiteralContext} ctx
 * @return {String}
 */
Visitor.prototype.visitObjectLiteral = function(ctx) {
  ctx.type = Types._object;
  let chain = '';
  if (ctx.propertyNameAndValueList()) {
    chain = this.visit(ctx.propertyNameAndValueList());
  }
  return `new Document()${chain}`;
};

/**
 * Child nodes: propertyName singleExpression
 * @param {PropertyAssignmentExpressionContext} ctx
 * @return {String}
 */
Visitor.prototype.visitPropertyAssignmentExpression = function(ctx) {
  const key = doubleQuoteStringify(this.visit(ctx.propertyName()));
  const value = this.visit(ctx.singleExpression());
  return `.append(${key}, ${value})`;
};

/**
 * Child nodes: elementList*
 * @param {ArrayLiteralContext} ctx
 * @return {String}
 */
Visitor.prototype.visitArrayLiteral = function(ctx) {
  ctx.type = Types._array;
  if (!ctx.elementList()) {
    return 'Arrays.asList()';
  }
  return `Arrays.asList(${this.visit(ctx.elementList())})`;
};

/**
 * One terminal child.
 * @param {ElisionContext} ctx
 * @return {String}
 */
Visitor.prototype.visitElision = function(ctx) {
  ctx.type = Types._null;
  return 'null';
};

/**
 * child nodes: arguments
 * grandchild nodes: argumentList?
 * great-grandchild nodes: singleExpression+
 * @param {FuncCallExpressionContext} ctx
 * @return {String}
 */
Visitor.prototype.visitRegularExpressionLiteral = function(ctx) {
  ctx.type = JSClasses.Regex;
  let pattern;
  let flags;
  try {
    const regexobj = this.executeJavascript(ctx.getText());
    pattern = regexobj.source;
    flags = regexobj.flags;
  } catch (error) {
    throw new CodeGenerationError(error.message);
  }

  let javaflags = flags.replace(/[imuyg]/g, m => JAVA_REGEX_FLAGS[m]);
  javaflags = javaflags === '' ? '' : `(?${javaflags})`;

  // Double escape characters except for slashes
  const escaped = pattern.replace(/\\(?!\/)/, '\\\\');

  return `Pattern.compile(${doubleQuoteStringify(escaped + javaflags)})`;
};

/*  ************** Emit Helpers **************** */

/**
 * child nodes: arguments
 * grandchild nodes: argumentList?
 * great-grandchild nodes: singleExpression+
 * @param {FuncCallExpressionContext} ctx
 * @return {String}
 */
Visitor.prototype.emitObjectCreate = function(ctx) {
  ctx.type = Types._object;
  const argList = ctx.arguments().argumentList();

  if (!argList || argList.singleExpression().length !== 1) {
    throw new CodeGenerationError('Object.create() requires one argument');
  }

  const arg = argList.singleExpression()[0];
  const obj = this.visit(arg);

  if (arg.type !== Types._object) {
    throw new CodeGenerationError('Object.create() requires an object argument');
  }

  return obj;
};

/**
 * child nodes: arguments
 * grandchild nodes: argumentList?
 * great-grandchild nodes: singleExpression+
 * @param {FuncCallExpressionContext} ctx
 * @return {String}
 */
Visitor.prototype.emitDate = function(ctx) {
  ctx.type = JSClasses.Date;
  const args = ctx.arguments();
  if (!args.argumentList()) {
    return 'new java.util.Date()';
  }
  let epoch;
  try {
    epoch = this.executeJavascript(ctx.getText()).getTime();
  } catch (error) {
    throw new CodeGenerationError(error.message);
  }
  return `new java.util.Date(${epoch})`;
};

Visitor.prototype.emitRegExp = Visitor.prototype.visitRegularExpressionLiteral;

/**
 * The arguments to Code can be either a string or actual javascript code.
 *
 * child nodes: arguments
 * grandchild nodes: argumentList?
 * great-grandchild nodes: singleExpression+
 * @param {FuncCallExpressionContext} ctx
 * @return {String}
 */
Visitor.prototype.emitCode = function(ctx) {
  ctx.type = BsonClasses.Code;
  const argList = ctx.arguments().argumentList();
  if (!argList ||
     !(argList.singleExpression().length === 1 ||
       argList.singleExpression().length === 2)) {
    throw new CodeGenerationError('Code requires one or two arguments');
  }
  const args = argList.singleExpression();
  const code = doubleQuoteStringify(args[0].getText());

  if (args.length === 2) {
    /* NOTE: we have to visit the subtree first before type checking or type may
       not be set. We might have to just suck it up and do two passes, but maybe
       we can avoid it for now. */
    const scope = this.visit(args[1]);
    if (args[1].type !== Types._object) {
      throw new CodeGenerationError('Code requires scope to be an object');
    }
    return `new CodeWithScope(${code}, ${scope})`;
  }

  return `new Code(${code})`;
};

/**
 * child nodes: arguments
 * grandchild nodes: argumentList?
 * great-grandchild nodes: singleExpression+
 * @param {FuncCallExpressionContext} ctx
 * @return {String}
 */
Visitor.prototype.emitObjectId = function(ctx) {
  ctx.type = BsonClasses.ObjectId;
  const argList = ctx.arguments().argumentList();
  if (!argList) {
    return 'new ObjectId()';
  }
  let hexstr;
  try {
    hexstr = this.executeJavascript(ctx.getText()).toHexString();
  } catch (error) {
    throw new CodeGenerationError(error.message);
  }
  return `new ObjectId(${doubleQuoteStringify(hexstr)})`;
};

/**
 * child nodes: arguments
 * grandchild nodes: argumentList?
 * great-grandchild nodes: singleExpression+
 * @param {FuncCallExpressionContext} ctx
 * @return {String}
 */
Visitor.prototype.emitBinary = function(ctx) {
  ctx.type = BsonClasses.Binary;
  let type;
  let binobj;
  try {
    binobj = this.executeJavascript(ctx.getText());
    type = binobj.sub_type;
  } catch (error) {
    throw new CodeGenerationError(error.message);
  }
  const bytes = doubleQuoteStringify(binobj.toString());
  return `new Binary(${JAVA_BINARY_SUBTYPES[type]}, ${bytes}.getBytes("UTF-8"))`;
};

/**
 * child nodes: arguments
 * grandchild nodes: argumentList?
 * great-grandchild nodes: singleExpression+
 * @param {FuncCallExpressionContext} ctx
 * @return {String}
 */
Visitor.prototype.emitLong = function(ctx) {
  ctx.type = BsonClasses.Long;
  let longstr;
  try {
    longstr = this.executeJavascript(ctx.getText()).toString();
  } catch (error) {
    throw new CodeGenerationError(error.message);
  }
  return `new java.lang.Long(${doubleQuoteStringify(longstr)})`;
};

/**
 * Expects two strings as arguments, the second must contain any of "imxlsu"
 *
 * child nodes: arguments
 * grandchild nodes: argumentList?
 * great-grandchild nodes: singleExpression+
 * @param {FuncCallExpressionContext} ctx
 * @return {String}
 */
Visitor.prototype.emitBSONRegExp = function(ctx) {
  ctx.type = BsonClasses.RegExp;
  const argList = ctx.arguments().argumentList();
  if (!argList ||
      !(argList.singleExpression().length === 1 ||
        argList.singleExpression().length === 2)) {
    throw new CodeGenerationError('BSONRegExp requires one or two arguments');
  }
  const args = argList.singleExpression();
  const pattern = this.visit(args[0]);
  if (args[0].type !== Types._string) {
    throw new CodeGenerationError('BSONRegExp requires pattern to be a string');
  }

  if (args.length === 2) {
    const flags = this.visit(args[1]);
    if (args[1].type !== Types._string) {
      throw new CodeGenerationError('BSONRegExp requires flags to be a string');
    }
    for (let i = 1; i < flags.length - 1; i++) {
      if (
        !(
          flags[i] === 'i' ||
          flags[i] === 'm' ||
          flags[i] === 'x' ||
          flags[i] === 'l' ||
          flags[i] === 's' ||
          flags[i] === 'u'
        )
      ) {
        return `Error: the regular expression options [${flags[i]}] is not supported`;
      }
    }
    return `new BsonRegularExpression(${pattern}, ${flags})`;
  }
  return `new BsonRegularExpression(${pattern})`;
};

// TODO
// Visitor.prototype.visitBSONDecimal128Constructor = function(ctx) {
// };


/*  ************** Object methods **************** */

Visitor.prototype.emitCodetoJSON = function(ctx) {
  const argsList = ctx.singleExpression().singleExpression().arguments();
  const args = argsList.argumentList().singleExpression();
  const code = doubleQuoteStringify(args[0].getText());
  let scope = 'undefined';

  if (args.length === 2) {
    scope = this.visit(args[1]);
  }

  return `new Document().append("code", ${code}).append("scope", ${scope})`;
};

Visitor.prototype.emitObjectIdcreateFromTime = function(ctx) {
  const arg = this.visit(ctx.arguments().argumentList().singleExpression()[0]);
  return `new ObjectId(new java.util.Date(${arg}))`;
};


module.exports = Visitor;
