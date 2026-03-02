/*
  File: app.js
  Project: UA Glass Calculator (Competition Ready)
  Author: Hidoyat Ruzmetov
  Product Owner: CS Ambassadors, University of Arizona

  Description:
  This runner file owns ALL logic:
  - Input rules (multi-digit numbers, decimals, constants, parentheses)
  - Validation (mismatched parentheses, bad operator placement, invalid postfix usage)
  - Tokenization (from button presses / keyboard into tokens)
  - Parsing and evaluation order (Shunting Yard -> RPN -> evaluate)
  - Error messaging 
  - AC / CE / backspace behavior
  - Memory buttons
  - Dynamic geometric canvas background with mouse attraction

  Note:
  calcFunctions.js contains ONLY small math functions (CalcOps.*).
  No parsing/validation/error strings exist there.
*/

/* global CalcOps */

(function () {
  "use strict";

  /* ---------------------------------------------
     Safety checks
  ---------------------------------------------- */

  if (!window.CalcOps) {
    // If this triggers, ensure calcFunctions.js is loaded before app.js in index.html.
    console.error("CalcOps not found. Load calcFunctions.js before app.js.");
  }

  /* ---------------------------------------------
     State
  ---------------------------------------------- */

  /**
   * @desc Central app state.
   */
  const state = {
    tokens: [],            // Expression tokens (strings): numbers, ops, parentheses, constants, postfix ops
    lastShown: "0",        // Big display string
    justEvaluated: false,  // True right after equals
    error: false,          // Error mode flag
    memory: 0,             // Memory register
    memorySet: false       // Whether memory has a user-set value
  };

  /* ---------------------------------------------
     DOM helpers
  ---------------------------------------------- */

  /**
   * @desc Returns an element by id.
   * @param {string} id - Element id.
   * @return {HTMLElement} DOM element.
   */
  function byId(id) {
    return /** @type {HTMLElement} */ (document.getElementById(id));
  }

  /**
   * @desc Returns the last token or an empty string.
   * @return {string} Last token.
   */
  function lastToken() {
    return state.tokens.length ? state.tokens[state.tokens.length - 1] : "";
  }

  /**
   * @desc Converts tokens to a pretty string for the history display.
   * @param {string[]} tokens - Token list.
   * @return {string} Pretty expression.
   */
  function tokensToPretty(tokens) {
    return tokens
      .map((t) => {
        if (t === "*") return "×";
        if (t === "/") return "÷";
        if (t === "-") return "−";
        if (t === "pi") return "π";
        return t;
      })
      .join(" ");
  }

  /**
   * @desc Updates UI display and memory indicator.
   * @return {void}
   */
  function render() {
    const history = tokensToPretty(state.tokens);
    byId("history").textContent = history || " ";
    byId("current").textContent = state.lastShown;

    const pill = byId("memIndicator");
    pill.style.opacity = state.memorySet ? "0.95" : "0.25";
  }

  /* ---------------------------------------------
     Formatting
  ---------------------------------------------- */

  /**
   * @desc Formats a number for display while avoiding ugly floating artifacts.
   * @param {number} value - Number to format.
   * @return {string} Display string.
   */
  function formatNumber(value) {
    if (!Number.isFinite(value)) return "Error";
    if (Object.is(value, -0)) value = 0;

    const abs = Math.abs(value);

    // Large/small numbers go exponential for readability
    if (abs !== 0 && (abs >= 1e12 || abs < 1e-4)) {  // ✏️ YOUR FIX HERE — Bug #6
      return value.toExponential(8).replace("+", "");
    }

    // tame floating noise with precision
    const rounded = Number(value.toPrecision(14));
    const text = String(rounded);

    // keep within a reasonable display width
    if (text.length > 18) {
      return Number(value.toPrecision(10)).toString();
    }

    return text;
  }

  /* ---------------------------------------------
     Token type helpers
  ---------------------------------------------- */

  /**
   * @desc True if token is an operator (+ - * / ^).
   * @param {string} t - Token.
   * @return {boolean} True if operator.
   */
  function isOperator(t) {
    return t === "+" || t === "-" || t === "*" || t === "/";  // ✏️ YOUR FIX HERE — Bug #4
  }

  /**
   * @desc True if token is postfix (! or %).
   * @param {string} t - Token.
   * @return {boolean} True if postfix operator.
   */
  function isPostfix(t) {
    return t === "!" || t === "%";
  }

  /**
   * @desc True if token is a constant (pi or e).
   * @param {string} t - Token.
   * @return {boolean} True if constant.
   */
  function isConstant(t) {
    return t === "pi" || t === "e";
  }

  /**
   * @desc True if token is a number string we are willing to parse.
   * @param {string} t - Token.
   * @return {boolean} True if number token.
   */
  function isNumberToken(t) {
    if (!t) return false;
    if (t === ".") return false;
    const n = Number(t);
    return Number.isFinite(n);
  }

  /**
   * @desc True if the token behaves like a value at the end of an expression.
   *       This includes numbers, constants, ')', and postfix results.
   * @param {string} t - Token.
   * @return {boolean} True if value-like.
   */
  function isValueLike(t) {
    return isNumberToken(t) || isConstant(t) || t === ")" || isPostfix(t);
  }

  /**
   * @desc Counts parentheses balance.
   * @return {number} Positive means more '(' than ')'.
   */
  function parenBalance() {
    let bal = 0;
    for (const t of state.tokens) {
      if (t === "(") bal++;
      // ✏️ YOUR FIX HERE — Bug #5 (a line is missing here)
    }
    return bal;
  }

  /**
   * @desc Returns whether a '-' token at position i is unary (negation).
   * @param {string[]} tokens - Token list.
   * @param {number} i - Index.
   * @return {boolean} True if unary minus.
   */
  function isUnaryMinusAt(tokens, i) {
    const t = tokens[i];
    if (t !== "-") return false;
    if (i === 0) return true;

    const prev = tokens[i - 1];
    return prev === "(" || isOperator(prev);
  }

  /* ---------------------------------------------
     Error handling
  ---------------------------------------------- */

  /**
   * @desc Enters error mode with a human-friendly message.
   * @param {string} message - Error message.
   * @return {void}
   */
  function enterError(message) {
    state.error = true;
    state.tokens = [];
    state.justEvaluated = false;
    state.lastShown = "Error";

    byId("history").textContent = message || "Invalid input";
    byId("current").textContent = state.lastShown;
  }

  /**
   * @desc Resets expression (AC). Memory is preserved.
   * @return {void}
   */
  function allClear() {
    state.tokens = [];
    state.lastShown = "0";
    state.justEvaluated = false;
    state.error = false;
    render();
  }

  /* ---------------------------------------------
     Implicit multiplication
  ---------------------------------------------- */

  /**
   * @desc Inserts '*' when a value is followed by '(' or a constant/number.
   *       Example: 2(3) => 2 * ( 3 ), 2π => 2 * pi, )3 => ) * 3
   * @param {"value"|"lparen"} nextKind - What we are inserting next.
   * @return {void}
   */
  function maybeInsertImplicitMultiply(nextKind) {
    const t = lastToken();
    if (!t) return;

    // Value-like followed by '(' or another value should imply multiplication.
    if (isValueLike(t) && (nextKind === "value" || nextKind === "lparen")) {
      state.tokens.push("*");
    }
  }

  /* ---------------------------------------------
     Editing: AC / CE / Backspace
  ---------------------------------------------- */

  /**
   * @desc Clears the most recent "entry".
   *       Practical behavior: remove the last token if it is value-like or postfix or ')'.
   * @return {void}
   */
  function clearEntry() {
    if (state.error) {
      allClear();
      return;
    }

    if (!state.tokens.length) {
      state.lastShown = "0";
      render();
      return;
    }

    const t = lastToken();

    // Remove postfix first if present (e.g., 5 ! => remove "!" only)
    if (isPostfix(t)) {
      state.tokens.pop();
      state.lastShown = "0";
      state.justEvaluated = false;
      render();
      return;
    }

    // Remove last value/constant/close-paren as a single "entry"
    if (isNumberToken(t) || isConstant(t) || t === ")") {
      state.tokens.pop();
      state.lastShown = "0";
      state.justEvaluated = false;
      render();
      return;
    }

    // If last token is operator or '(' just remove it
    state.tokens.pop();
    state.lastShown = "0";
    state.justEvaluated = false;
    render();
  }

  /**
   * @desc Backspace removes one digit from a number token, or removes the last token.
   * @return {void}
   */
  function backspace() {
    if (state.error) {
      allClear();
      return;
    }

    if (!state.tokens.length) return;

    const t = lastToken();

    // If last token is a number, remove one character
    if (isNumberToken(t) || (t && /^-?\d*\.?\d*$/.test(t) && t !== "-" && t !== "")) {
      const next = t.slice(0, -1);

      // If the number collapses to "" or "-", remove token entirely
      if (!next || next === "-" || next === ".") {
        state.tokens.pop();
      } else {
        state.tokens[state.tokens.length - 1] = next;
      }

      state.lastShown = state.tokens.length ? currentTokenToDisplay(lastToken()) : "0";
      state.justEvaluated = false;
      render();
      return;
    }

    // Otherwise remove the last token
    state.tokens.pop();
    state.lastShown = state.tokens.length ? currentTokenToDisplay(lastToken()) : "0";
    state.justEvaluated = false;
    render();
  }

  /**
   * @desc Converts a token into a small display-friendly value for the main display.
   * @param {string} t - Token.
   * @return {string} Display string.
   */
  function currentTokenToDisplay(t) {
    if (t === "pi") return "π";
    if (t === "e") return "e";
    if (t === "(") return "(";
    if (t === ")") return ")";
    if (isOperator(t)) return "0";
    if (isPostfix(t)) return "0";
    return t || "0";
  }

  /* ---------------------------------------------
     Input building: digits, decimals, constants, parentheses, operators
  ---------------------------------------------- */

  /**
   * @desc Appends a digit, supporting multi-digit numbers correctly.
   * @param {string} d - Digit '0'..'9'.
   * @return {void}
   */
  function appendDigit(d) {
    if (state.error) allClear();

    // If user types after "=", start a new expression
    if (state.justEvaluated) {
      state.tokens = [];
      state.justEvaluated = false;
    }

    const t = lastToken();

    // If last is ')' or constant or postfix, insert implicit multiplication first
    if (t === ")" || isConstant(t) || isPostfix(t)) {
      maybeInsertImplicitMultiply("value");
      state.tokens.push(d);
      state.lastShown = d;
      render();
      return;
    }

    // If last token is a unary '-' placeholder (e.g., start or after '(' or operator), merge into number
    if (t === "-" && isUnaryMinusAt(state.tokens, state.tokens.length - 1)) {
      state.tokens[state.tokens.length - 1] = "-" + d;
      state.lastShown = state.tokens[state.tokens.length - 1];
      render();
      return;
    }

    // If last token is a number, append digit to it
    if (t && /^-?\d*\.?\d*$/.test(t) && !isOperator(t) && t !== "(" && t !== ")" && !isPostfix(t) && !isConstant(t)) {
      // Replace clean leading zero: "0" + "7" => "7" (but allow "0." cases)
      if (t === "0") {
        state.tokens[state.tokens.length - 1] = d;
      } else if (t === "-0") {
        state.tokens[state.tokens.length - 1] = "-" + d;
      } else {
        state.tokens[state.tokens.length - 1] = t + d;
      }

      state.lastShown = state.tokens[state.tokens.length - 1];
      render();
      return;
    }

    // Otherwise start a new number token
    state.tokens.push(d);
    state.lastShown = d;
    render();
  }

  /**
   * @desc Appends a decimal point to the current number token.
   * @return {void}
   */
  function appendDecimal() {
    if (state.error) allClear();

    if (state.justEvaluated) {
      state.tokens = [];
      state.justEvaluated = false;
    }

    const t = lastToken();

    // If last is ')' or constant or postfix, implicit multiply then start "0."
    if (t === ")" || isConstant(t) || isPostfix(t)) {
      maybeInsertImplicitMultiply("value");
      state.tokens.push("0.");
      state.lastShown = "0.";
      render();
      return;
    }

    // Merge unary minus placeholder into "-0."
    if (t === "-" && isUnaryMinusAt(state.tokens, state.tokens.length - 1)) {
      state.tokens[state.tokens.length - 1] = "-0.";
      state.lastShown = "-0.";
      render();
      return;
    }

    // If last token is a number-in-progress, add decimal if missing
    if (t && /^-?\d*\.?\d*$/.test(t) && !isOperator(t) && t !== "(" && t !== ")" && !isPostfix(t) && !isConstant(t)) {
      if (t.includes(".")) return; // no double decimal
      state.tokens[state.tokens.length - 1] = t + ".";
      state.lastShown = state.tokens[state.tokens.length - 1];
      render();
      return;
    }

    // Otherwise start a new decimal number
    state.tokens.push("0.");
    state.lastShown = "0.";
    render();
  }

  /**
   * @desc Inserts constant pi or e.
   * @param {"pi"|"e"} kind - Constant kind.
   * @return {void}
   */
  function insertConstant(kind) {
    if (state.error) allClear();

    if (state.justEvaluated) {
      state.tokens = [];
      state.justEvaluated = false;
    }

    const t = lastToken();

    if (isValueLike(t)) {
      maybeInsertImplicitMultiply("value");
    }

    state.tokens.push(kind);
    state.lastShown = (kind === "pi") ? "π" : "e";
    render();
  }

  /**
   * @desc Inserts '(' with implicit multiplication when appropriate.
   * @return {void}
   */
  function insertLParen() {
    if (state.error) allClear();

    if (state.justEvaluated) {
      state.tokens = [];
      state.justEvaluated = false;
    }

    const t = lastToken();
    if (isValueLike(t)) {
      maybeInsertImplicitMultiply("lparen");
    }

    state.tokens.push("(");
    state.lastShown = "(";
    render();
  }

  /**
   * @desc Inserts ')' only when valid.
   * @return {void}
   */
  function insertRParen() {
    if (state.error) allClear();

    if (parenBalance() <= 0) return;

    const t = lastToken();
    if (!t) return;

    // Must follow a value-like token
    if (!isValueLike(t)) return;
    if (t === "(") return;

    state.tokens.push(")");
    state.lastShown = ")";
    render();
  }

  /**
   * @desc Appends or replaces a binary operator.
   * @param {string} op - Operator token.
   * @return {void}
   */
  function appendOperator(op) {
    if (state.error) allClear();

    if (state.justEvaluated) {
      state.justEvaluated = false;
    }

    const t = lastToken();

    // If empty expression, only allow unary '-'
    if (!t) {
      if (op === "-") {
        state.tokens.push("-");
        state.lastShown = "0";
        render();
      }
      return;
    }

    // If last token is '(' allow unary '-'
    if (t === "(") {
      if (op === "-") {
        state.tokens.push("-");
        state.lastShown = "0";
        render();
      }
      return;
    }

    // If last token is another operator, replace it
    if (isOperator(t)) {
      state.tokens[state.tokens.length - 1] = op;
      render();
      return;
    }

    // If last token is postfix, ')', number, constant => operator is allowed
    if (!isValueLike(t) || t === "(") return;

    state.tokens.push(op);
    state.lastShown = "0";
    render();
  }

  /**
   * @desc Inserts power operator '^'.
   * @return {void}
   */
  function insertPower() {
    appendOperator("^");
  }

  /**
   * @desc Applies postfix percent token '%' when valid.
   * @return {void}
   */
  function applyPercentToken() {
    if (state.error) allClear();

    const t = lastToken();
    if (!t) return;

    // Must follow a value-like token and cannot chain postfixes endlessly
    if (!isValueLike(t)) return;
    if (t === "(") return;
    if (isPostfix(t)) return;

    state.tokens.push("%");
    state.lastShown = "0";
    render();
  }

  /**
   * @desc Applies postfix factorial token '!' when valid (placement checked here).
   * @return {void}
   */
  function applyFactorialToken() {
    if (state.error) allClear();

    const t = lastToken();
    if (!t) return;

    if (!isValueLike(t)) return;
    if (t === "(") return;
    if (isPostfix(t)) return;

    state.tokens.push("!");
    state.lastShown = "0";
    render();
  }

  /* ---------------------------------------------
     Unary buttons: sqrt, square, reciprocal, toggle sign
     These are applied by app.js (NOT by functions file).
  ---------------------------------------------- */

  /**
   * @desc Reads the expression result if needed, otherwise reads last simple value.
   *       If last token is a number or constant, returns that.
   *       Otherwise, evaluates the full expression first.
   * @return {[boolean, number]} Tuple [ok, value].
   */
  function readTargetValueForUnary() {
    if (!state.tokens.length) return [false, 0];

    const t = lastToken();

    // If last token is a plain number, use it
    if (isNumberToken(t)) return [true, Number(t)];

    // If last token is constant, use it
    if (t === "pi") return [true, Math.PI];
    if (t === "e") return [true, Math.E];

    // Otherwise evaluate the whole expression
    const evalResult = evaluateCurrentTokens();
    return evalResult;
  }

  /**
   * @desc Replaces the last value token if simple; otherwise replaces entire expression with result.
   * @param {number} newValue - The value to place.
   * @param {boolean} replaceAll - If true, replaces entire token list.
   * @return {void}
   */
  function applyUnaryResult(newValue, replaceAll) {
    const formatted = formatNumber(newValue);
    if (formatted === "Error") {
      enterError("Result is not a valid number.");
      return;
    }

    if (replaceAll) {
      state.tokens = [formatted];
      state.lastShown = formatted;
      state.justEvaluated = true;
      state.error = false;
      render();
      return;
    }

    // Replace last token only
    state.tokens[state.tokens.length - 1] = formatted;
    state.lastShown = formatted;
    state.justEvaluated = false;
    state.error = false;
    render();
  }

  /**
   * @desc Applies square root as a unary button operation.
   * @return {void}
   */
  function applySqrt() {
    if (state.error) allClear();

    const last = lastToken();
    const simple = (isNumberToken(last) || isConstant(last));
    const [ok, val] = readTargetValueForUnary();
    if (!ok) {
      enterError("Nothing to apply √ to.");
      return;
    }
    if (!Number.isFinite(val)) {
      enterError("Invalid input for √.");
      return;
    }
    if (val < 0) {
      enterError("√ requires a non-negative input.");
      return;
    }

    const out = CalcOps.sqrt(val); // [ok, value]
    if (!out[0]) {
      enterError("√ failed.");
      return;
    }

    applyUnaryResult(out[1], !simple);
  }

  /**
   * @desc Applies square (x²) as a unary button operation.
   * @return {void}
   */
  function applySquare() {
    if (state.error) allClear();

    const last = lastToken();
    const simple = (isNumberToken(last) || isConstant(last));
    const [ok, val] = readTargetValueForUnary();
    if (!ok) {
      enterError("Nothing to apply x² to.");
      return;
    }
    if (!Number.isFinite(val)) {
      enterError("Invalid input for x².");
      return;
    }

    const out = CalcOps.square(val);
    if (!Number.isFinite(out)) {
      enterError("x² produced an invalid number.");
      return;
    }

    applyUnaryResult(out, !simple);
  }

  /**
   * @desc Applies reciprocal (1/x) as a unary button operation.
   * @return {void}
   */
  function applyReciprocal() {
    if (state.error) allClear();

    const last = lastToken();
    const simple = (isNumberToken(last) || isConstant(last));
    const [ok, val] = readTargetValueForUnary();
    if (!ok) {
      enterError("Nothing to apply 1/x to.");
      return;
    }
    if (!Number.isFinite(val)) {
      enterError("Invalid input for 1/x.");
      return;
    }
    if (val === 0) {
      enterError("Cannot divide by zero.");
      return;
    }

    const out = CalcOps.reciprocal(val); // [ok, value]
    if (!out[0]) {
      enterError("Cannot divide by zero.");
      return;
    }
    if (!Number.isFinite(out[1])) {
      enterError("1/x produced an invalid number.");
      return;
    }

    applyUnaryResult(out[1], !simple);
  }

  /**
   * @desc Toggles the sign (±).
   *       If last is a simple value, flips it in place. Otherwise, negates the whole expression result.
   * @return {void}
   */
  function applyToggleSign() {
    if (state.error) allClear();

    if (!state.tokens.length) {
      state.tokens.push("-");
      state.lastShown = "0";
      render();
      return;
    }

    const last = lastToken();
    const simple = (isNumberToken(last) || isConstant(last));

    // If user is in a unary-minus typing state, remove it (e.g., "(-" or "+ -")
    if (last === "-" && isUnaryMinusAt(state.tokens, state.tokens.length - 1)) {
      state.tokens.pop();
      state.lastShown = "0";
      render();
      return;
    }

    const [ok, val] = readTargetValueForUnary();
    if (!ok) {
      enterError("Nothing to apply ± to.");
      return;
    }
    if (!Number.isFinite(val)) {
      enterError("Invalid input for ±.");
      return;
    }

    const out = CalcOps.toggleSign(val);
    if (!Number.isFinite(out)) {
      enterError("± produced an invalid number.");
      return;
    }

    applyUnaryResult(out, !simple);
  }

  /* ---------------------------------------------
     Evaluation pipeline (tokenize -> parse -> evaluate)
     This is ALL app.js (per your requirement).
  ---------------------------------------------- */

  /**
   * @desc Validates basic expression structure before equals.
   * @return {[boolean, string]} Tuple [ok, message].
   */
  function validateBeforeEquals() {
    if (!state.tokens.length) return [false, "Empty expression."];
    if (parenBalance() !== 0) return [false, "Mismatched parentheses."];

    const t = lastToken();
    if (!isValueLike(t) || t === "(" || isOperator(t)) {
      return [false, "Expression cannot end with an operator."];
    }

    return [true, ""];
  }

  /**
   * @desc Converts a value token to a JS number.
   * @param {string} t - Token.
   * @return {[boolean, number]} Tuple [ok, value].
   */
  function tokenToNumber(t) {
    if (t === "pi") return [true, Math.PI];
    if (t === "e") return [true, Math.E];

    const n = Number(t);
    if (!Number.isFinite(n)) return [false, 0];
    return [true, n];
  }

  /**
   * @desc Operator precedence for parsing.
   * @param {string} op - Operator token.
   * @return {number} Precedence.
   */
  function precedence(op) {
    if (op === "u-") return 4;   // unary minus
    if (op === "^") return 2;  // ✏️ YOUR FIX HERE — Bug #8
    if (op === "*" || op === "/") return 2;
    if (op === "+" || op === "-") return 1;
    return 0;
  }

  /**
   * @desc Whether an operator is right associative.
   * @param {string} op - Operator token.
   * @return {boolean} True if right associative.
   */
  function isRightAssociative(op) {
    return op === "u-";  // ✏️ YOUR FIX HERE — Bug #9
  }

  /**
   * @desc Converts infix tokens into RPN tokens (Shunting Yard).
   *       Supports parentheses, postfix (!, %), and unary minus.
   * @param {string[]} infix - Infix token list.
   * @return {[boolean, string[], string]} Tuple [ok, rpn, message].
   */
  function infixToRpn(infix) {
    const output = [];
    const ops = [];

    for (let i = 0; i < infix.length; i++) {
      const t = infix[i];

      // value
      if (isNumberToken(t) || isConstant(t)) {
        output.push(t);
        continue;
      }

      // postfix operators: apply immediately in RPN
      if (isPostfix(t)) {
        // must follow a value or ')'
        const prev = i > 0 ? infix[i - 1] : "";
        if (!(isNumberToken(prev) || isConstant(prev) || prev === ")" || isPostfix(prev))) {
          return [false, [], "Postfix operator placed incorrectly."];
        }
        output.push(t);
        continue;
      }

      if (t === "(") {
        ops.push(t);
        continue;
      }

      if (t === ")") {
        let found = false;
        while (ops.length) {
          const top = ops.pop();
          if (top === "(") {
            found = true;
            break;
          }
          output.push(top);
        }
        if (!found) return [false, [], "Mismatched parentheses."];

        // If a unary minus was waiting before the parenthesis, apply it now
        if (ops.length && ops[ops.length - 1] === "u-") {
          output.push(ops.pop());
        }
        continue;
      }

      // operators + - * / ^
      if (isOperator(t)) {
        let op = t;

        // convert unary minus into "u-"
        if (t === "-" && isUnaryMinusAt(infix, i)) {
          op = "u-";
        }

        // if unary plus in a unary spot, ignore it cleanly
        if (t === "+" && (i === 0 || infix[i - 1] === "(" || isOperator(infix[i - 1]))) {
          continue;
        }

        while (ops.length) {
          const top = ops[ops.length - 1];
          if (top === "(") break;

          const pTop = precedence(top);
          const pCur = precedence(op);

          const shouldPop = isRightAssociative(op) ? (pTop > pCur) : (pTop >= pCur);
          if (!shouldPop) break;

          output.push(ops.pop());
        }

        ops.push(op);
        continue;
      }

      return [false, [], "Invalid token encountered."];
    }

    while (ops.length) {
      const top = ops.pop();
      if (top === "(") return [false, [], "Mismatched parentheses."];
      output.push(top);
    }

    return [true, output, ""];
  }

  /**
   * @desc Evaluates RPN tokens using CalcOps simple functions.
   * @param {string[]} rpn - RPN token list.
   * @return {[boolean, number, string]} Tuple [ok, value, message].
   */
  function evalRpn(rpn) {
    const stack = [];

    for (const t of rpn) {
      if (isNumberToken(t) || isConstant(t)) {
        const [ok, val] = tokenToNumber(t);
        if (!ok) return [false, 0, "Invalid number."];
        stack.push(val);
        continue;
      }

      // unary minus
      if (t === "u-") {
        if (stack.length < 1) return [false, 0, "Invalid negation."];
        const x = stack.pop();
        const out = CalcOps.toggleSign(x);
        if (!Number.isFinite(out)) return [false, 0, "Negation produced an invalid number."];
        stack.push(out);
        continue;
      }

      // postfix percent
      if (t === "%") {
        if (stack.length < 1) return [false, 0, "Invalid percent."];
        const x = stack.pop();
        const out = CalcOps.percent(x);
        if (!Number.isFinite(out)) return [false, 0, "Percent produced an invalid number."];
        stack.push(out);
        continue;
      }

      // postfix factorial
      if (t === "!") {
        if (stack.length < 1) return [false, 0, "Invalid factorial."];
        const x = stack.pop();

        // App-level validation rules (competition-friendly):
        if (!Number.isFinite(x)) return [false, 0, "Factorial input is invalid."];
        if (!Number.isInteger(x)) return [false, 0, "Factorial requires an integer."];
        if (x < 0) return [false, 0, "Factorial requires a non-negative integer."];
        if (x > 170) return [false, 0, "Factorial too large (overflow)." ];

        const res = CalcOps.factorial(x); // [ok, value]
        if (!res[0]) return [false, 0, "Factorial failed."];
        if (!Number.isFinite(res[1])) return [false, 0, "Factorial overflow."];
        stack.push(res[1]);
        continue;
      }

      // binary operators
      if (t === "+" || t === "-" || t === "*" || t === "/" || t === "^") {
        if (stack.length < 2) return [false, 0, "Incomplete expression."];
        const b = stack.pop();
        const a = stack.pop();

        let out = 0;

        if (t === "+") out = CalcOps.add(a, b);
        if (t === "-") out = CalcOps.subtract(a, b);
        if (t === "*") out = CalcOps.multiply(a, b);

        if (t === "/") {
          const res = CalcOps.divide(b, a);  // ✏️ YOUR FIX HERE — Bug #7
          if (!res[0]) return [false, 0, "Cannot divide by zero."];
          out = res[1];
        }

        if (t === "^") {
          out = CalcOps.power(a, b);
        }

        if (!Number.isFinite(out)) return [false, 0, "Operation produced an invalid number."];
        stack.push(out);
        continue;
      }

      return [false, 0, "Invalid token during evaluation."];
    }

    if (stack.length !== 1) return [false, 0, "Invalid expression structure."];
    return [true, stack[0], ""];
  }

  /**
   * @desc Evaluates the current state.tokens expression end-to-end.
   * @return {[boolean, number]} Tuple [ok, value].
   */
  function evaluateCurrentTokens() {
    const v = validateBeforeEquals();
    if (!v[0]) {
      enterError(v[1]);
      return [false, 0];
    }

    const [okRpn, rpn, msg] = infixToRpn(state.tokens);
    if (!okRpn) {
      enterError(msg);
      return [false, 0];
    }

    const [okVal, value, msg2] = evalRpn(rpn);
    if (!okVal) {
      enterError(msg2);
      return [false, 0];
    }

    return [true, value];
  }

  /**
   * @desc Equals button: validates, evaluates, then replaces expression with result.
   * @return {void}
   */
  function equals() {
    if (state.error) {
      allClear();
      return;
    }

    const [ok, value] = evaluateCurrentTokens();
    if (!ok) return;

    const formatted = formatNumber(value);
    if (formatted === "Error") {
      enterError("Result is not a valid number.");
      return;
    }

    state.tokens = [formatted];
    state.lastShown = formatted;
    state.justEvaluated = true;
    state.error = false;
    render();
  }

  /* ---------------------------------------------
     Memory
  ---------------------------------------------- */

  /**
   * @desc Reads the current big display as a number.
   * @return {[boolean, number]} Tuple [ok, value].
   */
  function readDisplayAsNumber() {
    const n = Number(state.lastShown);
    if (!Number.isFinite(n)) return [false, 0];
    return [true, n];
  }

  function memoryClear() {
    state.memory = 0;
    state.memorySet = true;  // ✏️ YOUR FIX HERE — Bug #10
    render();
  }

  function memoryRecall() {
    if (!state.memorySet) return;

    const formatted = formatNumber(state.memory);
    if (formatted === "Error") {
      enterError("Memory value is invalid.");
      return;
    }

    if (state.justEvaluated) {
      state.tokens = [formatted];
      state.lastShown = formatted;
      state.justEvaluated = false;
      render();
      return;
    }

    const t = lastToken();
    if (isValueLike(t)) maybeInsertImplicitMultiply("value");

    state.tokens.push(formatted);
    state.lastShown = formatted;
    render();
  }

  function memoryAdd() {
    const [ok, val] = readDisplayAsNumber();
    if (!ok) return;

    state.memory = (state.memorySet ? state.memory : 0) + val;
    state.memorySet = true;
    render();
  }

  function memorySubtract() {
    const [ok, val] = readDisplayAsNumber();
    if (!ok) return;

    state.memory = (state.memorySet ? state.memory : 0) - val;
    state.memorySet = true;
    render();
  }

  /* ---------------------------------------------
     Action router
  ---------------------------------------------- */

  /**
   * @desc Routes button actions to the correct handlers.
   * @param {string} action - Button action.
   * @param {string|null} value - Optional value.
   * @return {void}
   */
  function handleAction(action, value) {
    if (action === "digit" && value) appendDigit(value);
    else if (action === "decimal") appendDecimal();

    else if (action === "op" && value) appendOperator(value);
    else if (action === "power") insertPower();

    else if (action === "lparen") insertLParen();
    else if (action === "rparen") insertRParen();

    else if (action === "const" && value === "pi") insertConstant("pi");
    else if (action === "const" && value === "e") insertConstant("e");

    else if (action === "percent") applyPercentToken();
    else if (action === "factorial") applyFactorialToken();

    else if (action === "sqrt") applySqrt();
    else if (action === "square") applySquare();
    else if (action === "reciprocal") applyReciprocal();
    else if (action === "toggleSign") applyToggleSign();

    else if (action === "equals") equals();

    else if (action === "ac") allClear();
    else if (action === "ce") clearEntry();
    else if (action === "backspace") backspace();

    else if (action === "mc") memoryClear();
    else if (action === "mr") memoryRecall();
    else if (action === "mplus") memoryAdd();
    else if (action === "mminus") memorySubtract();
  }

  /* ---------------------------------------------
     Keyboard support
  ---------------------------------------------- */

  /**
   * @desc Keyboard mapping to calculator actions.
   * @param {KeyboardEvent} e - Keyboard event.
   * @return {void}
   */
  function handleKeydown(e) {
    const key = e.key;

    if (key >= "0" && key <= "9") {
      e.preventDefault();
      appendDigit(key);
      return;
    }

    if (key === ".") {
      e.preventDefault();
      appendDecimal();
      return;
    }

    if (key === "(") {
      e.preventDefault();
      insertLParen();
      return;
    }

    if (key === ")") {
      e.preventDefault();
      insertRParen();
      return;
    }

    if (key === "+" || key === "-" || key === "*" || key === "/" || key === "^") {
      e.preventDefault();
      appendOperator(key);
      return;
    }

    if (key === "%") {
      e.preventDefault();
      applyPercentToken();
      return;
    }

    if (key === "!") {
      e.preventDefault();
      applyFactorialToken();
      return;
    }

    if (key === "Enter" || key === "=") {
      e.preventDefault();
      equals();
      return;
    }

    if (key === "Backspace") {
      e.preventDefault();
      backspace();
      return;
    }

    if (key === "Escape") {
      e.preventDefault();
      allClear();
      return;
    }

    // Convenience: 'p' for pi, 'e' for e
    if (key === "p" || key === "P") {
      e.preventDefault();
      insertConstant("pi");
      return;
    }

    if (key === "e") {
      e.preventDefault();
      insertConstant("e");
    }
  }

  /* ---------------------------------------------
     Dynamic geometric background (canvas)
  ---------------------------------------------- */

  /**
   * @desc Initializes the canvas-based geometric background with mouse attraction.
   * @return {void}
   */
function initBackground() {
  const canvas = /** @type {HTMLCanvasElement} */ (byId("bgCanvas"));
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const prefersReducedMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) return;

  /* -----------------------------
     Canvas sizing
  ------------------------------ */
  let w = 0;
  let h = 0;

  /**
   * @desc Resize canvas with device pixel ratio for crisp rendering.
   * @return {void}
   */
  function resize() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    w = Math.floor(window.innerWidth);
    h = Math.floor(window.innerHeight);

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener("resize", resize);
  resize();

  /* -----------------------------
     Mouse interaction
  ------------------------------ */
  const mouse = {
    x: w * 0.5,
    y: h * 0.5,
    active: false
  };

  window.addEventListener("pointermove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  });

  window.addEventListener("pointerleave", () => {
    mouse.active = false;
  });

  /* -----------------------------
     Mesh configuration
     - A grid of points that drift
     - Triangulated-like connections (diagonal + orthogonal)
     - Mouse warp effect on points + glow orbs
  ------------------------------ */
  const GRID_SPACING = 95;                 // smaller => denser mesh
  const JITTER = 16;                       // random offset per point
  const DRIFT_SPEED = 0.015;               // how fast the mesh "breathes"
  const WARP_RADIUS = 190;                 // mouse influence radius
  const WARP_STRENGTH = 0.22;              // how strongly points are displaced
  const LINK_ALPHA = 0.22;                 // base link opacity
  const TRI_ALPHA = 0.09;                  // triangle fill opacity
  const ORB_COUNT = 7;                     // drifting glow orbs
  const ORB_LINK_RADIUS = 210;             // orbs connect to nearby points

  /**
   * @desc Builds mesh points in a grid.
   * @return {{points: any[], cols: number, rows: number}}
   */
  function buildMesh() {
    const cols = Math.ceil(w / GRID_SPACING) + 2;
    const rows = Math.ceil(h / GRID_SPACING) + 2;

    const points = [];
    let idx = 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const baseX = (c - 0.5) * GRID_SPACING;
        const baseY = (r - 0.5) * GRID_SPACING;

        const ox = (Math.random() * 2 - 1) * JITTER;
        const oy = (Math.random() * 2 - 1) * JITTER;

        points.push({
          id: idx++,
          c,
          r,
          baseX,
          baseY,
          x: baseX + ox,
          y: baseY + oy,
          ox,
          oy,
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    return { points, cols, rows };
  }

  let mesh = buildMesh();

  /**
   * @desc Rebuild mesh when resizing changes dimensions.
   * @return {void}
   */
  function rebuildMesh() {
    mesh = buildMesh();
  }

  window.addEventListener("resize", rebuildMesh);

  /* -----------------------------
     Glow orbs (engaging motion)
  ------------------------------ */

  /**
   * @desc Creates a glow orb.
   * @return {{x:number,y:number,vx:number,vy:number,r:number,t:number,kind:number}}
   */
  function makeOrb() {
    const speed = 0.25 + Math.random() * 0.45;
    const angle = Math.random() * Math.PI * 2;

    return {
      x: Math.random() * w,
      y: Math.random() * h,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: 80 + Math.random() * 120,  // glow radius
      t: Math.random() * Math.PI * 2,
      kind: Math.random() < 0.5 ? 0 : 1 // 0 = UA red, 1 = UA blue
    };
  }

  const orbs = Array.from({ length: ORB_COUNT }, makeOrb);

  /* -----------------------------
     Utility: UA-tinted colors
  ------------------------------ */

  /**
   * @desc Returns a UA color with opacity.
   * @param {number} kind - 0=red, 1=blue.
   * @param {number} a - Opacity.
   * @return {string} RGBA string.
   */
  function uaColor(kind, a) {
    return (kind === 0)
      ? `rgba(171, 5, 32, ${a})`   // UA red
      : `rgba(12, 35, 75, ${a})`;  // UA blue
  }

  /**
   * @desc Draws a soft radial glow.
   * @param {number} x - Center x.
   * @param {number} y - Center y.
   * @param {number} r - Radius.
   * @param {number} kind - 0=red, 1=blue.
   * @return {void}
   */
  function drawGlow(x, y, r, kind) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, uaColor(kind, 0.22));
    g.addColorStop(0.6, uaColor(kind, 0.08));
    g.addColorStop(1, uaColor(kind, 0.0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  /* -----------------------------
     Animation loop
  ------------------------------ */
  let lastTime = performance.now();

  function tick(now) {
    const dt = Math.min(40, now - lastTime);
    lastTime = now;

    /* Subtle overlay for consistent contrast */
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(5, 8, 18, 0.16)";
    ctx.fillRect(0, 0, w, h);

    /* Move orbs + draw glow */
    for (const o of orbs) {
      o.t += 0.0025 * dt;

      o.x += o.vx;
      o.y += o.vy;

      // bounce softly off edges
      if (o.x < -120 || o.x > w + 120) o.vx *= -1;
      if (o.y < -120 || o.y > h + 120) o.vy *= -1;

      // slow oscillation to avoid straight lines
      o.vx += Math.cos(o.t) * 0.0008 * dt;
      o.vy += Math.sin(o.t) * 0.0008 * dt;

      // gentle damping
      o.vx *= 0.995;
      o.vy *= 0.995;

      drawGlow(o.x, o.y, o.r, o.kind);
    }

    /* Update mesh points (breathing drift + mouse warp) */
    const time = now * 0.001;

    for (const p of mesh.points) {
      // baseline drift around the grid anchor
      const driftX = Math.cos(time * 1.05 + p.phase) * (JITTER * DRIFT_SPEED * 60);
      const driftY = Math.sin(time * 0.95 + p.phase) * (JITTER * DRIFT_SPEED * 60);

      let x = p.baseX + p.ox + driftX;
      let y = p.baseY + p.oy + driftY;

      // mouse warp (repel + swirl)
      if (mouse.active) {
        const dx = x - mouse.x;
        const dy = y - mouse.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0 && dist < WARP_RADIUS) {
          const k = (1 - dist / WARP_RADIUS) * WARP_STRENGTH;

          // repel
          x += (dx / dist) * (k * 32);

          // subtle swirl
          x += (-dy / dist) * (k * 18);
          y += (dx / dist) * (k * 18);
        }
      }

      p.x = x;
      p.y = y;
    }

    /* Draw mesh links + triangle fills */
    const { points, cols, rows } = mesh;

    // helper: index
    function idx(c, r) {
      return r * cols + c;
    }

    // links
    for (let r = 0; r < rows - 1; r++) {
      for (let c = 0; c < cols - 1; c++) {
        const p00 = points[idx(c, r)];
        const p10 = points[idx(c + 1, r)];
        const p01 = points[idx(c, r + 1)];
        const p11 = points[idx(c + 1, r + 1)];

        // choose diagonal direction alternating to create a triangulated feel
        const diagA = ((r + c) % 2 === 0);

        // triangle fill (very subtle)
        ctx.fillStyle = uaColor(diagA ? 1 : 0, TRI_ALPHA);
        ctx.beginPath();
        if (diagA) {
          ctx.moveTo(p00.x, p00.y);
          ctx.lineTo(p10.x, p10.y);
          ctx.lineTo(p11.x, p11.y);
        } else {
          ctx.moveTo(p00.x, p00.y);
          ctx.lineTo(p01.x, p01.y);
          ctx.lineTo(p11.x, p11.y);
        }
        ctx.closePath();
        ctx.fill();

        // mesh edges
        const drawEdge = (a, b, kind) => {
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          const alpha = Math.max(0, 1 - d / (GRID_SPACING * 1.25)) * LINK_ALPHA;
          if (alpha <= 0) return;

          ctx.strokeStyle = uaColor(kind, alpha);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        };

        drawEdge(p00, p10, 1);
        drawEdge(p00, p01, 0);
        drawEdge(p10, p11, 0);
        drawEdge(p01, p11, 1);

        // diagonal
        if (diagA) drawEdge(p10, p01, 0);
        else drawEdge(p00, p11, 1);
      }
    }

    /* Orbs connect to nearby points for extra engagement */
    for (const o of orbs) {
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const d = Math.hypot(p.x - o.x, p.y - o.y);
        if (d < ORB_LINK_RADIUS) {
          const alpha = (1 - d / ORB_LINK_RADIUS) * 0.22;
          ctx.strokeStyle = uaColor(o.kind, alpha);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(o.x, o.y);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }
      }
    }

    /* Points (tiny dots) */
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const kind = (i % 4 === 0) ? 0 : 1;
      ctx.fillStyle = uaColor(kind, 0.45);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.35, 0, Math.PI * 2);
      ctx.fill();
    }

    window.requestAnimationFrame(tick);
  }

  window.requestAnimationFrame(tick);
}


  /* ---------------------------------------------
     Main bootstrap
  ---------------------------------------------- */

  /**
   * @desc Initializes UI, background, events.
   * @return {void}
   */
  function main() {
    render();
    initBackground();

    const pad = document.querySelector(".pad");
    pad.addEventListener("click", (ev) => {
      const target = /** @type {HTMLElement} */ (ev.target);
      if (!target) return;

      const btn = target.closest("button");
      if (!btn) return;

      const action = btn.getAttribute("data-action");
      const value = btn.getAttribute("data-value");

      if (!action) return;
      handleAction(action, value);
    });

    window.addEventListener("keydown", handleKeydown);

    // prevent accidental selection during fast clicking
    byId("current").addEventListener("mousedown", (e) => e.preventDefault());
  }

  document.addEventListener("DOMContentLoaded", main);
})();
