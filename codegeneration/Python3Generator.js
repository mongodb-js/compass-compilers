const CodeGenerator = require('./CodeGenerator.js');

/**
 * This Visitor walks the tree generated by parsers and produces Python code.
 *
 * @returns {object}
 */
function Visitor() {
  CodeGenerator.call(this);

  return this;
}
Visitor.prototype = Object.create(CodeGenerator.prototype);
Visitor.prototype.constructor = Visitor;

// /////////////////////////// //
// Nodes that differ in syntax //
// /////////////////////////// //

/**
 * Visit String Literal
 *
 * @param {object} ctx
 * @returns {string}
 */
Visitor.prototype.visitStringLiteral = function(ctx) {
  ctx.type = this.types.STRING;

  return this.singleQuoteStringify(this.visitChildren(ctx));
};

/**
 * Visit Property Expression Assignment
 *
 * @param {object} ctx
 * @returns {string}
 */
Visitor.prototype.visitPropertyExpressionAssignment = function(ctx) {
  const key = this.singleQuoteStringify(this.visit(ctx.getChild(0)));
  const value = this.visit(ctx.getChild(2));

  return `${key}: ${value}`;
};

/**
 * Because python doesn't need `New`, we can skip the first child
 *
 * @param {object} ctx
 * @returns {string}
 */
Visitor.prototype.visitNewExpression = function(ctx) {
  return this.visitChildren(ctx, {start: 1});
};

/**
 * Visit Code Constructor
 *
 * @param {object} ctx
 * @returns {string}
 */
Visitor.prototype.visitBSONCodeConstructor = function(ctx) {
  const args = ctx.getChild(1);

  if (args.getChildCount() !== 3) {
    return 'Error: Code requires one argument';
  }

  /* NOTE: we have to visit the subtree first before type checking or type may
     not be set. We might have to just suck it up and do two passes, but maybe
     we can avoid it for now. */

  const childArgs = this.visit(args.getChild(1));

  if (args.getChild(1).type !== this.types.STRING) {
    return 'Error: Code requires a string argument';
  }

  return `Code(${childArgs})`;
};

/**
 * This evaluates the code in a sandbox and gets the hex string out of the
 * ObjectId.
 *
 * @param {object} ctx
 * @returns {string}
 */
Visitor.prototype.visitBSONObjectIdConstructor = function(ctx) {
  const code = 'ObjectId(';
  const args = ctx.getChild(1);

  if (args.getChildCount() === 2) {
    return `${code})`;
  }

  if (args.getChildCount() !== 3) {
    return 'Error: ObjectId requires zero or one argument';
  }

  // TODO: do we even have to visit the children? this.visit(args.getChild(1));
  let hexstr;

  try {
    hexstr = this.executeJavascript(ctx.getText()).toHexString();
  } catch (error) {
    return error.message;
  }

  return `ObjectId(${this.singleQuoteStringify(hexstr) })`;
};

/**
 * Visit Binary Constructor
 *
 * @param {object} ctx
 * @returns {string}
 */
Visitor.prototype.visitBSONBinaryConstructor = function(ctx) {
  const args = ctx.getChild(1);

  if (args.getChildCount() !== 3) {
    return 'Error: Binary requires one or two arguments';
  }

  const childArgs = args.getChild(1);

  if (childArgs.getChildCount() === 1) {
    const data = this.visit(childArgs);

    if (childArgs.type !== this.types.STRING) {
      return 'Error: Binary first argument should be a string';
    }

    return `Binary(${data})`;
  }

  if (childArgs.getChildCount() === 3) {
    const data = this.visit(childArgs.getChild(0));

    if (childArgs.getChild(0).type !== this.types.STRING) {
      return 'Error: Binary first argument should be a string';
    }

    const subtype = this.strToNumber(this.visit(childArgs.getChild(2)));

    if (
      (
        childArgs.getChild(0).type !== this.types.STRING &&
        childArgs.getChild(0).type !== this.types.INTEGER
      ) ||
      isNaN(parseInt(subtype, 10))
    ) {
      return 'Error: Binary second argument should be a number';
    }

    return `Binary(${data}, ${subtype})`;
  }

  return 'Error: Binary requires one or two arguments';
};

/**
 * Visit Double Constructor
 *
 * @param {object} ctx
 * @returns {string}
 */
Visitor.prototype.visitBSONDoubleConstructor = function(ctx) {
  const args = ctx.getChild(1);

  if (args.getChildCount() !== 3 || args.getChild(1).getChildCount() !== 1) {
    return 'Error: Double requires one argument';
  }

  const childArgs = this.visit(args.getChild(1));

  if (
    args.getChild(1).type !== this.types.DECIMAL &&
    args.getChild(1).type !== this.types.INTEGER
  ) {
    return 'Error: Double requires a number argument';
  }

  return `float(${childArgs})`;
};

/**
 * Visit Long Constructor
 *
 * @param {object} ctx
 * @returns {string}
 */
Visitor.prototype.visitBSONLongConstructor = function(ctx) {
  const args = ctx.getChild(1);

  if (args.getChildCount() !== 3 || args.getChild(1).getChildCount() !== 3) {
    return 'Error: Long requires two arguments';
  }

  const first = this.strToNumber(this.visit(args.getChild(1).getChild(0)));
  const second = this.strToNumber(this.visit(args.getChild(1).getChild(2)));

  const childArgs = `${first}, ${second}`;

  if (
    (
      args.getChild(1).getChild(0).type !== this.types.STRING &&
      args.getChild(1).getChild(0).type !== this.types.DECIMAL &&
      args.getChild(1).getChild(0).type !== this.types.INTEGER
    ) ||
    isNaN(parseInt(first, 10))
  ) {
    return 'Error: Long first argument should be a number';
  }

  if (
    (
      args.getChild(1).getChild(0).type !== this.types.STRING &&
      args.getChild(1).getChild(2).type !== this.types.DECIMAL &&
      args.getChild(1).getChild(2).type !== this.types.INTEGER
    ) ||
    isNaN(parseInt(second, 10))
  ) {
    return 'Error: Long second argument should be a number';
  }

  return `Int64(${childArgs})`;
};

module.exports = Visitor;
