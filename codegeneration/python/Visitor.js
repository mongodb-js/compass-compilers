/* eslint complexity: 0 camelcase: 0*/
const Python3Visitor = require('../../lib/antlr/Python3Visitor').Python3Visitor;
const {
  BsonTranspilersArgumentError,
  BsonTranspilersAttributeError,
  BsonTranspilersRuntimeError,
  BsonTranspilersTypeError,
  BsonTranspilersReferenceError,
  BsonTranspilersInternalError,
  BsonTranspilersUnimplementedError
} = require('../../helper/error');
const { removeQuotes } = require('../../helper/format');

/**
 * This is a Visitor that visits the tree generated by the Python3.g4 grammar.
 *
 * @returns {Visitor}
 */
class Visitor extends Python3Visitor {
  constructor() {
    super();
    this.requiredImports = {};
    this.idiomatic = true;
    this.processfloat = this.processint;
    this.processInt64 = this.processint;


    // Throw UnimplementedError for nodes with expressions that we don't support
    this.visitDel_stmt =
    this.visitPass_stmt =
    this.visitFlow_stmt =
    this.visitImport_stmt =
    this.visitGlobal_stmt =
    this.visitNonlocal_stmt =
    this.visitAssert_stmt =
    this.visitIf_stmt =
    this.visitWhile_stmt =
    this.visitFor_stmt =
    this.visitTry_stmt =
    this.visitWith_stmt =
    this.visitFuncdef =
    this.visitClassdef =
    this.visitDecorated =
    this.visitAsync_stmt =
    this.visitComp_iter =
    this.visitStar_expr =
    this.visitInline_if =
    this.visitAssign_stmt =
    this.visitEllipsesAtom =
    this.visitAugassign =
      this.unimplemented;
  }
  deepCopyRequiredImports() {
    const copy = Object.assign({}, this.requiredImports);
    [300, 301, 302, 303, 304, 305, 306].forEach((i) => {
      copy[i] = Array.from(this.requiredImports[i]);
    });
    return copy;
  }

  /**
   * As code is generated, any classes that require imports are tracked in
   * this.Imports. Each class has a "code" that is defined in the symbol table.
   * The imports are then generated based on the output language templates.
   *
   *  @return {String} - The list of imports in the target language.
   */
  getImports() {
    const importTemplate = this.Imports.import.template ?
      this.Imports.import.template :
      (s) => (
        Object.values(s)
          .filter((a, i) => (Object.values(s).indexOf(a) === i))
          .join('\n')
      );
    // Remove empty arrays because js [] is not falsey :(
    [300, 301, 302, 303, 304, 305, 306].forEach(
      (i) => {
        if (i in this.requiredImports && this.requiredImports[i].length === 0) {
          this.requiredImports[i] = false;
        }
      });
    const imports = Object.keys(this.requiredImports)
      .filter((code) => {
        return (
          this.requiredImports[code] &&
          this.Imports[code] &&
          this.Imports[code].template
        );
      })
      .reduce((obj, c) => {
        obj[c] = this.Imports[c].template(this.requiredImports[c]);
        return obj;
      }, {});
    return importTemplate(imports);
  }
  /**
   * Selectively visits children of a node.
   *
   * @param {ParserRuleContext} ctx
   * @param {Object} options:
   *    start - child index to start iterating at.
   *    end - child index to end iterating after.
   *    step - how many children to increment each step, 1 visits all children.
   *    separator - a string separator to go between children.
   *    ignore - an array of child indexes to skip.
   *    children - the set of children to visit.
   * @returns {String}
   */
  visitChildren(ctx, options) {
    // console.log('visiting children of ' + ctx.constructor.name);
    const opts = {
      start: 0, step: 1, separator: '', ignore: [], children: ctx.children
    };
    Object.assign(opts, options ? options : {});
    opts.end = ('end' in opts) ? opts.end : opts.children.length;

    let code = '';
    for (let i = opts.start; i < opts.end; i += opts.step) {
      if (opts.ignore.indexOf(i) === -1) {
        code = `${ code }${ this.visit(opts.children[i]) }${
          (i === opts.end - 1) ?
            '' :
            opts.separator
        }`;
      }
    }
    /* Set the node's type to the first child, if it's not already set.
      More often than not, type will be set directly by the visitNode method. */
    if (ctx.type === undefined) {
      ctx.type = opts.children.length ?
        opts.children[0].type :
        this.Types._undefined;
    }
    return code;
  }

  unimplemented(ctx) {
    const name = ctx.constructor.name ?
      ctx.constructor.name.replace('_stmt', '') : 'Expression';
    throw new BsonTranspilersUnimplementedError(
      `'${name}' not yet implemented`
    );
  }

  /**
   * This helper function checks for an emit method then applies the templates
   * if they exist for a function call node.
   *
   * @param {ParserRuleContext} ctx - The function call node
   * @param {Object} lhsType - The type
   * @param {Array} args - Arguments to the template
   * @param {String} defaultT - The default name if no template exists.
   * @param {String} defaultA - The default arguments if no argsTemplate exists.
   * @param {Boolean} skipNew - Optional: If true, never add new.
   * @param {Boolean} skipLhs - Optional: If true, don't add lhs to result.
   *
   * @return {String}
   */
  generateCall(ctx, lhsType, args, defaultT, defaultA, skipNew, skipLhs) {
    if (`emit${lhsType.id}` in this) {
      return this[`emit${lhsType.id}`](ctx);
    }
    const lhsArg = lhsType.template ? lhsType.template() : defaultT;
    const rhs = lhsType.argsTemplate ? lhsType.argsTemplate(lhsArg, ...args) : defaultA;
    const lhs = skipLhs ? '' : lhsArg;
    return this.Syntax.new.template
      ? this.Syntax.new.template(`${lhs}${rhs}`, skipNew, lhsType.code)
      : `${lhs}${rhs}`;
  }

  /**
   * Same as generateCall but for type literals instead of function calls.
   * @param {ParserRuleContext} ctx - The literal node
   * @param {Object} lhsType - The type
   * @param {Array} args - Arguments to the template
   * @param {String} defaultT - The default if no template exists.
   * @param {Boolean} skipNew - Optional: If true, never add new.
   *
   * @return {String}
   */
  generateLiteral(ctx, lhsType, args, defaultT, skipNew) {
    if (`emit${lhsType.id}` in this) {
      return this[`emit${lhsType.id}`](ctx);
    }
    if (lhsType.template) {
      const str = lhsType.template(...args);
      return this.Syntax.new.template
        ? this.Syntax.new.template(str, skipNew, lhsType.code)
        : str;
    }
    return defaultT;
  }

  start(ctx) {
    this.requiredImports = {};
    [300, 301, 302, 303, 304, 305, 306].forEach(
      (i) => (this.requiredImports[i] = [])
    );
    return this.visitFile_input(ctx).trim();
  }

  getIndentDepth(ctx) {
    while (ctx.indentDepth === undefined) {
      ctx = ctx.parentCtx;
      if (ctx === undefined || ctx === null) {
        return -1;
      }
    }
    return ctx.indentDepth;
  }

  /**
   * Helper for literals.
   *
   * @param {Object} setType
   * @param {ParserContext} ctx
   * @return {String}
   */
  leafHelper(setType, ctx) {
    ctx.type = setType;
    this.requiredImports[ctx.type.code] = true;
    // Pass the original argument type to the template, not the casted type.
    const type = ctx.originalType === undefined ? ctx.type : ctx.originalType;
    if (`process${ctx.type.id}` in this) {
      return this[`process${ctx.type.id}`](ctx);
    }
    const children = this.visitChildren(ctx);
    return this.generateLiteral(ctx, ctx.type, [children, type.id], children, true);
  }

  visitEof() {
    if (this.Syntax.eof.template) {
      return this.Syntax.eof.template();
    }
    return '';
  }

  visitEos() {
    if (this.Syntax.eos.template) {
      return this.Syntax.eos.template();
    }
    return '\n';
  }

  visitStringAtom(ctx) {
    ctx.type = this.Types._string;
    this.requiredImports[ctx.type.code] = true;
    // Pass the original argument type to the template, not the casted type.
    const type = ctx.originalType === undefined ? ctx.type : ctx.originalType;

    let result = this.visitChildren(ctx);
    result = result.replace(/^([rubf]?[rubf]["']|'''|"""|'|")/gi, '');
    result = result.replace(/(["]{3}|["]|[']{3}|['])$/, '');
    return this.generateLiteral(ctx, ctx.type, [result, type.id], `'${result}'`, true);
  }
  visitInteger_literal(ctx) {
    return this.leafHelper(this.Types._long, ctx);
  }
  visitOct_literal(ctx) {
    return this.leafHelper(this.Types._octal, ctx);
  }
  visitHex_literal(ctx) {
    return this.leafHelper(this.Types._hex, ctx);
  }
  visitBin_literal(ctx) {
    return this.leafHelper(this.Types._bin, ctx);
  }
  visitFloat_literal(ctx) {
    return this.leafHelper(this.Types._decimal, ctx);
  }
  visitImag_literal(ctx) {
    return this.leafHelper(this.Types._long, ctx); // TODO: imaginary numbers?
  }
  visitBoolean_literal(ctx) {
    return this.leafHelper(this.Types._bool, ctx);
  }
  visitNone_literal(ctx) {
    return this.leafHelper(this.Types._null, ctx);
  }

  visitExpr_stmt(ctx) {
    if (
      ('assign_stmt' in ctx && ctx.assign_stmt() !== null) ||
      ('augassign' in ctx && ctx.augassign() !== null) ||
      ('annassign' in ctx && ctx.annassign() !== null)
    ) {
      throw new BsonTranspilersUnimplementedError(
        'Assignment not yet implemented'
      );
    }
    return this.visitChildren(ctx);
  }

  /**
   * Want to throw unimplemented for comprehensions instead of reference errors.
   * @param {ParserContext} ctx
   */
  testComprehension(ctx) {
    if (ctx === null) {
      return;
    }
    if (('comp_for' in ctx && ctx.comp_for() !== null) || ('comp_if' in ctx && ctx.comp_if() !== null)) {
      throw new BsonTranspilersUnimplementedError(
        'Comprehensions not yet implemented'
      );
    }
  }

  visitObject_literal(ctx) {
    if (ctx.dictorsetmaker()) {
      this.testComprehension(ctx.dictorsetmaker());
    }
    if (this.idiomatic && 'emitIdiomaticObjectLiteral' in this) {
      return this.emitIdiomaticObjectLiteral(ctx);
    }
    this.requiredImports[10] = true;
    ctx.type = this.Types._object;
    ctx.indentDepth = this.getIndentDepth(ctx) + 1;
    let args = '';
    if (ctx.dictorsetmaker()) {
      const properties = ctx.dictorsetmaker().test();
      if (ctx.type.argsTemplate) {
        args = ctx.type.argsTemplate(
          properties
            .map((key, i) => {
              if (i % 2 === 0) {
                return [
                  this.visit(key),
                  this.visit(properties[i + 1])
                ];
              }
              return null;
            })
            .filter((k) => (k !== null)),
          ctx.indentDepth);
      } else {
        args = this.visit(properties);
      }
    }
    ctx.indentDepth--;
    if (ctx.type.template) {
      return ctx.type.template(args, ctx.indentDepth);
    }
    return this.visitChildren(ctx);
  }

  visitSet_literal(ctx) {
    ctx.type = this.Types._array;
    ctx.indentDepth = this.getIndentDepth(ctx) + 1;
    this.requiredImports[9] = true;
    let args = '';
    const list = ctx.testlist_comp();
    this.testComprehension(list);
    if (list) {
      // Sets of 1 item is the same as the item itself, but keep parens for math
      if (list.children.length === 1) {
        return `(${this.visit(list.children[0])})`;
      }
      const visitedChildren = list.children.map((child) => {
        return this.visit(child);
      });
      const visitedElements = visitedChildren.filter((arg) => {
        return arg !== ',';
      });
      if (ctx.type.argsTemplate) { // NOTE: not currently being used anywhere.
        args = visitedElements.map((arg, index) => {
          const last = !visitedElements[index + 1];
          return ctx.type.argsTemplate(arg, ctx.indentDepth, last);
        }).join('');
      } else {
        args = visitedElements.join(', ');
      }
    }
    if (ctx.type.template) {
      return ctx.type.template(args, ctx.indentDepth);
    }
    return this.visitChildren(ctx);
  }
  visitArray_literal(ctx) {
    ctx.type = this.Types._array;
    ctx.indentDepth = this.getIndentDepth(ctx) + 1;
    this.requiredImports[9] = true;
    let args = '';
    if (ctx.testlist_comp()) {
      this.testComprehension(ctx.testlist_comp());
      const visitedChildren = ctx.testlist_comp().children.map((child) => {
        return this.visit(child);
      });
      const visitedElements = visitedChildren.filter((arg) => {
        return arg !== ',';
      });
      if (ctx.type.argsTemplate) { // NOTE: not currently being used anywhere.
        args = visitedElements.map((arg, index) => {
          const last = !visitedElements[index + 1];
          return ctx.type.argsTemplate(arg, ctx.indentDepth, last);
        }).join('');
      } else {
        args = visitedElements.join(', ');
      }
    }
    if (ctx.type.template) {
      return ctx.type.template(args, ctx.indentDepth);
    }
    return this.visitChildren(ctx);
  }

  /**
   * Visit a leaf node and return a string.
   * *
   * @param {ParserRuleContext} ctx
   * @returns {String}
   */
  visitTerminal(ctx) {
    return ctx.getText();
  }

  visitTerm(ctx) {
    // Skip if fake node
    if (ctx.getChildCount() === 1) {
      return this.visitChildren(ctx);
    }
    if (ctx.getChildCount() > 2) {
      const res = [this.visit(ctx.children[0])];
      for (let i = 1; i < ctx.getChildCount(); i++) {
        const op = this.visit(ctx.children[i]);
        if (op === '//') {
          const rhs = this.visit(ctx.children[i + 1]);
          const lhs = res.pop();
          res.push(this.Syntax.floorDiv.template(lhs, rhs));
          i++;
        } else {
          res.push(op);
        }
      }
      return res.join('');
    }
    return this.visitChildren(ctx);
  }

  visitPower(ctx) {
    // Skip if fake node
    if (ctx.getChildCount() === 1) {
      return this.visitChildren(ctx);
    }
    return this.Syntax.power.template(this.visit(ctx.atom()), this.visit(ctx.factor()));
  }

  visitAnd_test(ctx) {
    // Skip if fake node
    if (ctx.getChildCount() === 1) {
      return this.visitChildren(ctx);
    }
    return this.Syntax.and.template(ctx.not_test().map((t) => ( this.visit(t) )));
  }

  visitOr_test(ctx) {
    // Skip if fake node
    if (ctx.getChildCount() === 1) {
      return this.visitChildren(ctx);
    }
    return this.Syntax.or.template(ctx.and_test().map((t) => ( this.visit(t) )));
  }

  visitNot_test(ctx) {
    // Skip if fake node
    if (ctx.getChildCount() === 1) {
      return this.visitChildren(ctx);
    }
    return this.Syntax.not.template(this.visit(ctx.children[1]));
  }

  visitComparison(ctx) {
    // Skip if fake node
    if (ctx.getChildCount() === 1) {
      return this.visitChildren(ctx);
    }
    let skip = false;
    return ctx.children.reduce((str, e, i, arr) => {
      if (skip) { // Skip for 'in' statements because swallows rhs
        skip = false;
        return str;
      }
      if (i === arr.length - 1) { // Always visit the last element
        return `${str}${this.visit(e)}`;
      }
      if (i % 2 === 0) { // Only ops
        return str;
      }
      const op = this.visit(e);
      if (op === '==' || op === '!=' || op === 'is' || op === 'isnot') {
        return `${str}${this.Syntax.equality.template(this.visit(arr[i - 1]), op, '')}`;
      }
      if (op === 'in' || op === 'notin') {
        skip = true;
        return `${str}${this.Syntax.in.template(this.visit(arr[i - 1]), op, this.visit(arr[i + 1]))}`;
      }
      return `${str}${this.visit(arr[i - 1])} ${op} `;
    }, '');
  }

  visitFunctionCall(ctx) {
    // Skip if fake node
    if (ctx.getChildCount() === 1) {
      return this.visitChildren(ctx);
    }
    const lhs = this.visit(ctx.atom());
    let lhsType = ctx.atom().type;
    if (typeof lhsType === 'string') {
      lhsType = this.Types[lhsType];
    }

    // Special case
    if (`process${lhsType.id}` in this) {
      return this[`process${lhsType.id}`](ctx);
    }
    if (`emit${lhsType.id}` in this) {
      return this[`emit${lhsType.id}`](ctx);
    }

    // Check if callable
    ctx.type = lhsType.type;
    if (!lhsType.callable) {
      throw new BsonTranspilersTypeError(`${lhsType.id} is not callable`);
    }

    // Check arguments
    const expectedArgs = lhsType.args;
    let rhs = this.checkArguments(
      expectedArgs, this.getArguments(ctx), lhsType.id
    );

    // Apply the arguments template
    if (lhsType.argsTemplate) {
      let l = lhs;
      if ('identifier' in ctx.atom()) {
        l = this.visit(ctx.atom().identifier());
      }
      rhs = lhsType.argsTemplate(l, ...rhs);
    } else {
      rhs = `(${rhs.join(', ')})`;
    }

    const expr = `${lhs}${rhs}`;
    const constructor = lhsType.callable === this.SYMBOL_TYPE.CONSTRUCTOR;

    return this.Syntax.new.template
      ? this.Syntax.new.template(expr, !constructor, lhsType.code)
      : expr;
  }

  visitAttributeAccess(ctx) {
    // Skip if fake node
    if (ctx.getChildCount() === 1) {
      return this.visitChildren(ctx);
    }
    const lhs = this.visit(ctx.atom());
    const rhs = ctx.dot_trailer().identifier().getText();

    let type = ctx.atom().type;
    if (typeof type === 'string') {
      type = this.Types[type];
    }
    while (type !== null) {
      if (!(type.attr.hasOwnProperty(rhs))) {
        if (type.id in this.BsonTypes && this.BsonTypes[type.id].id !== null) {
          throw new BsonTranspilersAttributeError(
            `'${rhs}' not an attribute of ${type.id}`
          );
        }
        type = type.type;
        if (typeof type === 'string') {
          type = this.Types[type];
        }
      } else {
        break;
      }
    }
    if (type === null) {
      ctx.type = this.Types._undefined;
      // TODO: how strict do we want to be?
      return `${lhs}.${rhs}`;
    }
    ctx.type = type.attr[rhs];
    if (type.attr[rhs].template) {
      return type.attr[rhs].template(lhs, rhs);
    }

    return `${lhs}.${rhs}`;
  }

  visitIndexAccess(ctx) {
    // Skip if fake node
    if (ctx.getChildCount() === 1) {
      return this.visitChildren(ctx);
    }
    throw new BsonTranspilersUnimplementedError('Indexing not currently supported');
  }

  visitIdentifier(ctx) {
    const name = this.visitChildren(ctx);
    ctx.type = this.Symbols[name];
    if (ctx.type === undefined) {
      throw new BsonTranspilersReferenceError(`Symbol '${name}' is undefined`);
    }
    this.requiredImports[ctx.type.code] = true;

    if (ctx.type.template) {
      return ctx.type.template();
    }
    return name;
  }

  // TODO: translate flags
  // process_regex(ctx) { // eslint-disable-line camelcase
  //   ctx.type = this.Types._regex;
  //   let pattern;
  //   let flags;
  // }
  // processcompile(ctx) {
  //   return this.process_regex(ctx);
  // }
  /**
   * Process BSON regexps because we need to verify the flags are valid.
   *
   * @param {FuncCallExpressionContext} ctx
   * @return {string}
   */
  processRegex(ctx) {
    ctx.type = this.Types.Regex;
    const symbolType = this.Symbols.Regex;

    const args = this.checkArguments(
      symbolType.args, this.getArguments(ctx), 'Regex'
    );

    let flags = null;
    const pattern = args[0];
    if (args.length === 2) {
      flags = args[1];
      for (let i = 1; i < flags.length - 1; i++) {
        if (!(flags[i] in this.Syntax.bsonRegexFlags)) {
          throw new BsonTranspilersRuntimeError(
            `Invalid flag '${flags[i]}' passed to Regexp`
          );
        }
      }
      flags = flags.replace(/[imxlsu]/g, m => this.Syntax.bsonRegexFlags[m]);
    }

    return this.generateCall(
      ctx, symbolType, [pattern, flags], 'Regex',
      `(${pattern}${flags ? ', ' + flags : ''})`
    );
  }
  /**
   * Code is processed in every language because want to generate the scope as
   * a non-idiomatic document.
   *
   * @param {ParserContext} ctx
   * @return {String}
   */
  processCode(ctx) {
    ctx.type = this.Types.Code;
    const symbolType = this.Symbols.Code;
    const args = this.checkArguments(symbolType.args, this.getArguments(ctx), 'Code');
    let scopeStr = '';

    if (args.length === 2) {
      const idiomatic = this.idiomatic;
      this.idiomatic = false;
      const scope = this.visit(this.getArgumentAt(ctx, 1));
      this.idiomatic = idiomatic;
      scopeStr = `, ${scope}`;
      this.requiredImports[113] = true;
      this.requiredImports[10] = true;
      args[1] = scope;
    }
    return this.generateCall(ctx, symbolType, args, 'Code', `(${args[0]}${scopeStr})`);
  }

  processdatetime(ctx) {
    ctx.type = this.Types.Date;
    ctx.wasNew = true; // Always true for non-js
    const symbolType = this.Symbols.datetime;
    let date = null;

    const argsList = this.getArguments(ctx);
    if (argsList.length !== 0) {
      if (argsList.length < 3) {
        throw new BsonTranspilersArgumentError(
          `Wrong number of arguments to datetime: needs at at least 3, got ${argsList.length}`
        );
      }

      try {
        this.checkArguments(symbolType.args, argsList, 'datetime');
      } catch (e) {
        throw new BsonTranspilersArgumentError(
          'Invalid argument to datetime: requires either no args or up to 7 numbers'
        );
      }

      const argvals = argsList.map((k) => {
        let v;
        try {
          v = parseInt(k.getText(), 10);
        } catch (e) {
          throw new BsonTranspilersRuntimeError(
            `Unable to convert datetime argument to integer: ${k.getText()}`
          );
        }
        if (isNaN(v)) {
          throw new BsonTranspilersRuntimeError(
            `Unable to convert datetime argument to integer: ${k.getText()}`
          );
        }
        return v;
      });
      argvals[1]--; // month is 0-based in node, 1-based in everything else (afaict)
      try {
        date = new Date(Date.UTC(...argvals));
      } catch (e) {
        throw new BsonTranspilersInternalError(
          `Unable to construct date from arguments: ${e.message}`
        );
      }
    }
    const dargs = `Date(${date
      ? this.Types._string.template(date.toUTCString())
      : ''})`;
    return this.generateCall(
      ctx, symbolType, [date, false], '', dargs, false, true
    );
  }

  /**
   * Need process method because we want to pass the argument type to the template
   * so that we can determine if the generated number needs to be parsed or casted.
   *
   * @param {Object} ctx
   * @returns {String}
   */

  processint(ctx) {
    const lhsStr = this.visit(ctx.atom());
    let lhsType = ctx.atom().type;
    if (typeof lhsType === 'string') {
      lhsType = this.Types[lhsType];
    }
    ctx.type = lhsType.id === 'float' ? this.Types._decimal : lhsType.type;

    // Get the original type of the argument
    const expectedArgs = lhsType.args;
    let args = this.checkArguments(
      expectedArgs, this.getArguments(ctx), lhsType.id
    );
    let argType;

    if (args.length === 0) {
      args = ['0'];
      argType = this.Types._integer;
    } else {
      const argNode = this.getArgumentAt(ctx, 0);
      const typed = this.getTyped(argNode);
      argType = typed.originalType !== undefined ?
        typed.originalType :
        typed.type;
    }

    return this.generateCall(
      ctx, lhsType, [args[0], argType.id], lhsStr, `(${args.join(', ')})`
    );
  }

  /**
   * Gets a process method because need to tell the template if
   * the argument is a number or a date.
   *
   * @param {ParserRuleContext} ctx
   * @returns {String} - generated code
   */
  processObjectIdfrom_datetime(ctx) {
    const lhsStr = this.visit(ctx.atom());
    let lhsType = ctx.atom().type;
    if (typeof lhsType === 'string') {
      lhsType = this.Types[lhsType];
    }

    const args = this.checkArguments(
      lhsType.args, this.getArguments(ctx), lhsType.id
    );
    const isNumber = this.getArgumentAt(ctx, 0).type.code !== 200;
    return this.generateCall(
      ctx, lhsType, [args[0], isNumber], lhsStr, `(${args.join(', ')})`, true
    );
  }

  /**
   * Binary needs preprocessing because it needs to be executed. Manually check
   * argument length because 'Buffer' not supported.
   *
   * TODO: figure out if it ever makes sense to support Binary.
   */
  processBinary() {
    throw new BsonTranspilersUnimplementedError('Binary type not supported');
  }

  /**
   * Validate each argument against the expected argument types defined in the
   * Symbol table.
   *
   * @param {Array} expected - An array of arrays where each subarray represents
   * possible argument types for that index.
   * @param {Array} args - array of arguments.
   * @param {String} name - The name of the function for error reporting.
   *
   * @returns {Array} - Array containing the generated output for each argument.
   */
  checkArguments(expected, args, name) {
    const argStr = [];
    if (args.length === 0) { // TODO: can maybe skip
      if (expected.length === 0 || expected[0].indexOf(null) !== -1) {
        return argStr;
      }
      throw new BsonTranspilersArgumentError(
        `Argument count mismatch: '${name}' requires least one argument`
      );
    }
    if (args.length > expected.length) {
      throw new BsonTranspilersArgumentError(
        `Argument count mismatch: '${name}' expects ${expected.length} args and got ${args.length}`
      );
    }
    for (let i = 0; i < expected.length; i++) {
      if (args[i] === undefined) {
        if (expected[i].indexOf(null) !== -1) {
          return argStr;
        }
        throw new BsonTranspilersArgumentError(
          `Argument count mismatch: too few arguments passed to '${name}'`
        );
      }
      const result = this.castType(expected[i], args[i]);
      if (result === null) {
        const typeStr = expected[i].map((e) => {
          const id = e && e.id ? e.id : e;
          return e ? id : '[optional]';
        });
        const message = `Argument type mismatch: '${name}' expects types ${
          typeStr} but got type ${args[i].type.id} for argument at index ${i}`;

        throw new BsonTranspilersArgumentError(message);
      }
      argStr.push(result);
    }
    return argStr;
  }

  /**
   * Convert between numeric types. Required so that we don't end up with
   * strange conversions like 'Int32(Double(2))', and can just generate '2'.
   *
   * @param {Array} expectedType - types to cast to.
   * @param {antlr4.ParserRuleContext} actualCtx - ctx to cast from, if valid.
   *
   * @returns {String} - visited result, or null on error.
   */
  castType(expectedType, actualCtx) {
    const result = this.visit(actualCtx);
    const originalCtx = actualCtx;
    actualCtx = this.getTyped(actualCtx); // TODO, needed??

    // If the types are exactly the same, just return.
    if (expectedType.indexOf(actualCtx.type) !== -1 ||
      expectedType.indexOf(actualCtx.type.id) !== -1) {
      return result;
    }

    const numericTypes = [
      this.Types._integer, this.Types._decimal, this.Types._hex,
      this.Types._octal, this.Types._long, this.Types._numeric
    ];
    // If the expected type is "numeric", accept the numeric basic types + numeric bson types
    if (expectedType.indexOf(this.Types._numeric) !== -1 &&
      (numericTypes.indexOf(actualCtx.type) !== -1 ||
        (actualCtx.type.id === 'Long' ||
          actualCtx.type.id === 'Int32' ||
          actualCtx.type.id === 'Double'))) {
      return result;
    }

    // Check if the arguments are both numbers. If so then cast to expected type.
    for (let i = 0; i < expectedType.length; i++) {
      if (numericTypes.indexOf(actualCtx.type) !== -1 &&
        numericTypes.indexOf(expectedType[i]) !== -1) {
        // Need to interpret octal always
        if (actualCtx.type.id === '_octal') {
          const node = {
            type: expectedType[i],
            originalType: actualCtx.type.id,
            children: [ actualCtx ]
          };
          return this.leafHelper(expectedType[i], node);
        }
        actualCtx.originalType = actualCtx.type;
        actualCtx.type = expectedType[i];
        return this.leafHelper(expectedType[i], this.skipFakeNodesDown(originalCtx));
      }
    }
    return null;
  }

  getTyped(actual) {
    if (actual.type === undefined) {
      while (actual.getChild(0)) {
        actual = actual.getChild(0);
        if (actual.type !== undefined) {
          break;
        }
      }
    }
    if (actual.type === undefined) {
      throw new BsonTranspilersInternalError();
    }
    return actual;
  }

  // accessors
  getList(ctx) {
    if (!('testlist_comp' in ctx) || !ctx.testlist_comp()) {
      return [];
    }
    return ctx.testlist_comp().test();
  }
  getArray(ctx) {
    return this.skipFakeNodesDown(ctx, 'array_literal');
  }
  getObject(ctx) {
    return this.skipFakeNodesDown(ctx, 'object_literal');
  }
  getKeyValueList(ctx) {
    if ('dictorsetmaker' in ctx && ctx.dictorsetmaker()) {
      const properties = ctx.dictorsetmaker().test();
      return properties
        .map((key, i) => {
          if (i % 2 === 0) {
            return [
              key,
              properties[i + 1]
            ];
          }
          return null;
        })
        .filter((k) => (k !== null));
    }
    return [];
  }
  getKeyStr(k) {
    return removeQuotes(this.visit(k[0]));
  }
  getParentKeyStr(ctx) { // TODO: fix for long list
    const topNode = this.getParentUntil(ctx.parentCtx, 'dictorsetmaker', 1);
    const objNode = topNode.parentCtx;
    const index = objNode.test().indexOf(topNode);
    const keyNode = objNode.test()[index - 1];
    const key = this.visit(keyNode);
    return removeQuotes(key);
  }
  getValue(k) {
    return k[1];
  }
  getArguments(ctx) {
    const trailer = ctx.paren_trailer();
    if (!('arglist' in trailer) || trailer.arglist() === null) {
      return [];
    }
    return trailer.arglist().argument();
  }
  getArgumentAt(ctx, i) {
    return this.getArguments(ctx)[i];
  }
  getParentUntil(ctx, name, steps) {
    steps = steps === undefined ? 0 : steps;
    let res = ctx;
    let found = false;
    const stack = [];
    while (res !== undefined && res !== null && !found) {
      if (name in res) {
        const goal = res[name]();
        if (goal === stack[stack.length - 1]) {
          found = true;
          break;
        }
      }
      stack.push(res);
      res = res.parentCtx;
    }
    return found ? stack[stack.length - 1 - steps] : false;
  }
  skipFakeNodesDown(ctx, goal) {
    let res = ctx;
    while (res.children !== undefined && res.children.length === 1) {
      res = res.children[0];
      if (goal && goal in res) {
        res = res[goal]();
        break;
      }
    }
    if (res.children === undefined) {
      return res.parentCtx;
    }
    return res;
  }
  skipFakeNodesUp(ctx, goal) {
    let res = ctx.parentCtx;
    while (res !== undefined && res !== null && res.children !== undefined && res.children.length === 1) {
      if (goal && goal in res) {
        res = res[goal]();
        break;
      }
      res = res.parentCtx;
    }
    return res;
  }
  isSubObject(ctx) {
    return this.getParentUntil(ctx.parentCtx, 'dictorsetmaker', 1);
  }
  getObjectChild(ctx) {
    return this.skipFakeNodesDown(ctx);
  }
}

module.exports = Visitor;
