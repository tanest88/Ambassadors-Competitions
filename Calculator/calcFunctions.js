/*
  File: calcFunctions.js
  Project: UA Glass Calculator (Competition Ready)
  Author: Hidoyat Ruzmetov
  Product Owner: CS Ambassadors, University of Arizona

  Description:
  This file intentionally contains ONLY small math functions.
  There is no validation messaging, no parsing, no tokenizing, no UI logic here.
  App logic (app.js) decides what is valid, how to show errors, and how to evaluate expressions.
*/

/* global window */

window.CalcOps = (function () {
  "use strict";

  /**
   * @desc Adds two numbers.
   * @param {number} a - First number.
   * @param {number} b - Second number.
   * @return {number} Sum.
   */
  function add(a, b) {
    return a + b;
  }

  /**
   * @desc Subtracts b from a.
   * @param {number} a - First number.
   * @param {number} b - Second number.
   * @return {number} Difference.
   */
  function subtract(a, b) {
    return a - b;
  }

  /**
   * @desc Multiplies two numbers.
   * @param {number} a - First number.
   * @param {number} b - Second number.
   * @return {number} Product.
   */
  function multiply(a, b) {
    return a * b;
  }

  /**
   * @desc Divides a by b.
   * @param {number} a - Numerator.
   * @param {number} b - Denominator.
   * @return {[boolean, number]} Tuple: [ok, value]. ok is false when b is 0.
   */
  function divide(a, b) {
    if (b === 0) return [false, 0];
    return [true, a / b];
  }

  /**
   * @desc Computes a raised to the power of b.
   * @param {number} a - Base.
   * @param {number} b - Exponent.
   * @return {number} Power result.
   */
  function power(a, b) {
    return Math.pow(a, b);
  }

  /**
   * @desc Squares a number.
   * @param {number} x - Input.
   * @return {number} x squared.
   */
  function square(x) {
    return x * x;
  }

  /**
   * @desc Computes square root.
   * @param {number} x - Input.
   * @return {[boolean, number]} Tuple: [ok, value]. ok is false when x is negative.
   */
  function sqrt(x) {
    if (x < 0) return [false, 0];
    return [true, Math.sqrt(x)];
  }

  /**
   * @desc Computes factorial for a whole number n (0..170).
   * @param {number} n - Input.
   * @return {[boolean, number]} Tuple: [ok, value]. ok is false if n is invalid.
   */
  function factorial(n) {
    if (!Number.isInteger(n)) return [false, 0];
    if (n < 0) return [false, 0];
    if (n > 170) return [false, 0]; /* Prevent Infinity in JS Number */

    let out = 1;
    for (let i = 2; i <= n; i++) out *= i;
    return [true, out];
  }

  /**
   * @desc Converts a number to percent form (x% => x/100).
   * @param {number} x - Input.
   * @return {number} Percent value.
   */
  function percent(x) {
    return x / 100;
  }

  /**
   * @desc Computes reciprocal 1/x.
   * @param {number} x - Input.
   * @return {[boolean, number]} Tuple: [ok, value]. ok is false when x is 0.
   */
  function reciprocal(x) {
    return divide(1, x);
  }

  /**
   * @desc Toggles sign (negation).
   * @param {number} x - Input.
   * @return {number} -x.
   */
  function toggleSign(x) {
    return -x;
  }

  return {
    add,
    subtract,
    multiply,
    divide,
    power,
    square,
    sqrt,
    factorial,
    percent,
    reciprocal,
    toggleSign
  };
})();
