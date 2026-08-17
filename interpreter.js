/**
 * Safe, sandboxed line-by-line Python interpreter in Javascript
 * Designed specifically for beginner levels (print, input, variables, basic conditions)
 */

export class PythonInterpreter {
  constructor(options = {}) {
    this.onPrint = options.onPrint || console.log;
    this.onInput = options.onInput || (async () => "");
    this.variables = {};
    this.capturedInputs = [];
  }

  // Pre-process and tokenize the lines, measuring indentation
  parseLines(code) {
    const lines = code.split("\n");
    const parsedLines = [];

    for (let i = 0; i < lines.length; i++) {
      const originalLine = lines[i];
      const trimmed = originalLine.trim();

      // Skip comments and empty lines but keep their place or structure if needed
      if (trimmed === "" || trimmed.startsWith("#")) {
        continue;
      }

      // Calculate indentation (spaces or tabs)
      let indent = 0;
      for (let j = 0; j < originalLine.length; j++) {
        const char = originalLine[j];
        if (char === " ") {
          indent++;
        } else if (char === "\t") {
          indent += 4; // count tab as 4 spaces
        } else {
          break;
        }
      }

      parsedLines.push({
        text: trimmed,
        indent: indent,
        lineNum: i + 1
      });
    }

    return parsedLines;
  }

  // Build the hierarchical block structure
  buildBlockTree(lines) {
    let index = 0;

    const parseBlock = (parentIndent) => {
      const statements = [];
      while (index < lines.length) {
        const lineObj = lines[index];

        if (lineObj.indent <= parentIndent) {
          // Indentation decreased; block is over
          break;
        }

        const text = lineObj.text;

        if (text.endsWith(":")) {
          const header = text.slice(0, -1).trim();
          index++;
          const body = parseBlock(lineObj.indent);
          statements.push({
            type: "block",
            header: header,
            body: body,
            indent: lineObj.indent,
            lineNum: lineObj.lineNum
          });
        } else {
          statements.push({
            type: "simple",
            text: text,
            indent: lineObj.indent,
            lineNum: lineObj.lineNum
          });
          index++;
        }
      }
      return statements;
    };

    return parseBlock(-1);
  }

  // Group conditional structures: if, elif, else
  groupIfChains(statements) {
    const result = [];
    let i = 0;

    while (i < statements.length) {
      const stmt = statements[i];

      if (stmt.type === "block" && stmt.header.startsWith("if ")) {
        const chain = {
          type: "if-chain",
          clauses: [
            {
              type: "if",
              condition: stmt.header.substring(3).trim(),
              body: this.groupIfChains(stmt.body),
              lineNum: stmt.lineNum
            }
          ],
          elseBody: null,
          lineNum: stmt.lineNum
        };

        i++;

        // Look for subsequent elif and else blocks at the same indentation level
        while (i < statements.length) {
          const nextStmt = statements[i];
          if (nextStmt.type === "block") {
            if (nextStmt.header.startsWith("elif ")) {
              chain.clauses.push({
                type: "elif",
                condition: nextStmt.header.substring(5).trim(),
                body: this.groupIfChains(nextStmt.body),
                lineNum: nextStmt.lineNum
              });
              i++;
            } else if (nextStmt.header === "else") {
              chain.elseBody = this.groupIfChains(nextStmt.body);
              i++;
              break; // else terminates the chain
            } else {
              break; // different block type
            }
          } else {
            break; // simple statement
          }
        }
        result.push(chain);
      } else {
        if (stmt.type === "block") {
          stmt.body = this.groupIfChains(stmt.body);
        }
        result.push(stmt);
        i++;
      }
    }

    return result;
  }

  // Parse a simple statement into operations
  parseSimpleStatement(text) {
    let eqIdx = -1;
    let inDoubleQuote = false;
    let inSingleQuote = false;
    let parenDepth = 0;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"' && text[i - 1] !== "\\") {
        if (!inSingleQuote) inDoubleQuote = !inDoubleQuote;
      } else if (char === "'" && text[i - 1] !== "\\") {
        if (!inDoubleQuote) inSingleQuote = !inSingleQuote;
      } else if (!inDoubleQuote && !inSingleQuote) {
        if (char === "(") parenDepth++;
        else if (char === ")") parenDepth--;
        else if (char === "=" && parenDepth === 0) {
          if (text[i + 1] === "=") {
            i++; // skip ==
          } else if (text[i - 1] === ">" || text[i - 1] === "<" || text[i - 1] === "!") {
            // >=, <=, !=
          } else {
            eqIdx = i;
            break;
          }
        }
      }
    }

    if (eqIdx !== -1) {
      const lhs = text.substring(0, eqIdx).trim();
      const rhs = text.substring(eqIdx + 1).trim();
      return {
        type: "assign",
        lhs: lhs,
        rhs: rhs
      };
    }

    if (text.startsWith("print(") && text.endsWith(")")) {
      const expr = text.substring(6, text.length - 1).trim();
      return {
        type: "print",
        expr: expr
      };
    }

    return {
      type: "expr",
      expr: text
    };
  }

  // Safe async expression evaluator
  async evaluateExpr(exprStr) {
    exprStr = exprStr.trim();

    // 1. Check for input() function calls
    // Handle: input("prompt") or input()
    const inputRegex = /input\(([^)]*)\)/;
    const inputMatch = exprStr.match(inputRegex);

    if (inputMatch) {
      const promptExpr = inputMatch[1].trim();
      let promptVal = "";
      if (promptExpr) {
        promptVal = await this.evaluateExpr(promptExpr);
      }
      const inputVal = await this.onInput(promptVal);
      this.capturedInputs.push(inputVal);

      // Replace input(...) with the literal string representation
      const safeStr = JSON.stringify(inputVal);
      const newExprStr = exprStr.replace(inputMatch[0], safeStr);
      return this.evaluateExpr(newExprStr);
    }

    // 2. Check for int(...) type cast
    if (exprStr.startsWith("int(") && exprStr.endsWith(")")) {
      const inner = exprStr.substring(4, exprStr.length - 1).trim();
      const innerVal = await this.evaluateExpr(inner);
      const parsed = parseInt(innerVal, 10);
      if (isNaN(parsed)) {
        throw new Error(`ValueError: invalid literal for int() with base 10: '${innerVal}'`);
      }
      return parsed;
    }

    // 3. String literals
    if (exprStr.startsWith('"') && exprStr.endsWith('"')) {
      try {
        return JSON.parse(exprStr);
      } catch {
        return exprStr.slice(1, -1);
      }
    }
    if (exprStr.startsWith("'") && exprStr.endsWith("'")) {
      return exprStr.slice(1, -1);
    }

    // 4. Numbers
    if (/^\d+$/.test(exprStr)) {
      return Number(exprStr);
    }

    // 5. JavaScript expressions sandboxing (evaluating variable addition, boolean operations)
    // Convert python logical expressions to Javascript
    let jsExpr = exprStr
      .replace(/\band\b/g, "&&")
      .replace(/\bor\b/g, "||")
      .replace(/\bnot\b/g, "!");

    const keys = Object.keys(this.variables);
    const values = Object.values(this.variables);

    try {
      const fn = new Function(...keys, `return (${jsExpr});`);
      return fn(...values);
    } catch (err) {
      // If variable doesn't exist, we'll throw a NameError
      for (const key of keys) {
        if (jsExpr.includes(key)) {
          throw new Error(`NameError: name '${exprStr}' is not defined`);
        }
      }
      throw new Error(`NameError: name '${exprStr}' is not defined`);
    }
  }

  // Execute a series of statements
  async executeStatements(statements) {
    for (const stmt of statements) {
      if (stmt.type === "simple") {
        const parsed = this.parseSimpleStatement(stmt.text);

        if (parsed.type === "print") {
          const val = await this.evaluateExpr(parsed.expr);
          this.onPrint(val !== undefined ? val.toString() : "None");
        } else if (parsed.type === "assign") {
          const val = await this.evaluateExpr(parsed.rhs);
          this.variables[parsed.lhs] = val;
        } else if (parsed.type === "expr") {
          await this.evaluateExpr(parsed.expr);
        }
      } else if (stmt.type === "if-chain") {
        let conditionMet = false;

        for (const clause of stmt.clauses) {
          const condVal = await this.evaluateExpr(clause.condition);
          if (condVal) {
            conditionMet = true;
            await this.executeStatements(clause.body);
            break;
          }
        }

        if (!conditionMet && stmt.elseBody) {
          await this.executeStatements(stmt.elseBody);
        }
      }
    }
  }

  // Main entrypoint
  async run(code) {
    this.variables = {};
    this.capturedInputs = [];
    try {
      const lines = this.parseLines(code);
      const tree = this.buildBlockTree(lines);
      const program = this.groupIfChains(tree);
      await this.executeStatements(program);
      return { success: true, variables: this.variables, capturedInputs: this.capturedInputs };
    } catch (err) {
      this.onPrint(`Error: ${err.message}`);
      return { success: false, error: err.message, variables: this.variables, capturedInputs: this.capturedInputs };
    }
  }
}
