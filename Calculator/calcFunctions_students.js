/*
File: calcFunctions.js
Project: UA Glass Calculator (Competition Ready)
Author: Hidoyat Ruzmetov
Product Owner: CS Ambassadors, University of Arizona

Description:
This file intentionally contains ONLY small math functions.
There is no validation messaging, no parsing, no tokenizing, and no UI logic here.
The app logic in app.js decides what is valid, how to show errors, and how to evaluate expressions.
Your job is to complete each function so it returns the correct result in the correct format.
*/

/* global window */

window.CalcOps = (function () {
"use strict";


// ----------------------------------------------------------------------------
// ----------------------------------- EASY -----------------------------------
// ----------------------------------------------------------------------------


/**
 * @desc Adds two numbers and returns their sum. This is the basic addition operation.
 * For example, add(3, 5) returns 8, add(-2, 7) returns 5, and add(0, 0) returns 0.
 * The function should return a single number.
 * @param {number} a - The first number.
 * @param {number} b - The second number.
 * @return {number} The sum of a and b.
 */
function add(a, b) {
  // Your code here
}

/**
 * @desc Subtracts the second number from the first number and returns the difference.
 * For example, subtract(9, 4) returns 5, subtract(3, 7) returns -4, and subtract(0, 0) returns 0.
 * The order matters because a - b is not the same as b - a.
 * @param {number} a - The starting number.
 * @param {number} b - The number to subtract.
 * @return {number} The result of a minus b.
 */
function subtract(a, b) {
  // Your code here
}

/**
 * @desc Multiplies two numbers and returns the product.
 * For example, multiply(3, 4) returns 12, multiply(-2, 5) returns -10,
 * multiply(-3, -2) returns 6, and multiply(0, 99) returns 0.
 * The function should return a single number.
 * @param {number} a - The first factor.
 * @param {number} b - The second factor.
 * @return {number} The product of a and b.
 */
function multiply(a, b) {
  // Your code here
}

/**
 * @desc Divides the first number by the second number and returns the result in a two-part array.
 * The first part tells whether the operation was valid, and the second part is the answer.
 * For example, divide(8, 2) returns [true, 4], divide(-9, 3) returns [true, -3],
 * and divide(5, 0) returns [false, 0] because division by zero is not allowed.
 * This function must return an array in the form [ok, value].
 * @param {number} a - The numerator.
 * @param {number} b - The denominator.
 * @return {[boolean, number]} Returns [true, quotient] when b is not 0, otherwise [false, 0].
 */
function divide(a, b) {
  // Your code here
}


// ----------------------------------------------------------------------------
// ---------------------------------- MEDIUM ----------------------------------
// ----------------------------------------------------------------------------


/**
 * @desc Squares a number by multiplying it by itself.
 * For example, square(5) returns 25, square(-3) returns 9, and square(0) returns 0.
 * This function returns a single number.
 * @param {number} x - The input number.
 * @return {number} The value of x multiplied by itself.
 */
function square(x) {
  // Your code here
}


/**
 * @desc Converts a number into percent form by dividing it by 100.
 * For example, percent(50) returns 0.5, percent(200) returns 2, and percent(1) returns 0.01.
 * This function returns a single number.
 * @param {number} x - The input number.
 * @return {number} The percent form of x.
 */
function percent(x) {
  // Your code here
}

/**
 * @desc Computes the reciprocal of a number, which means 1 divided by that number.
 * For example, reciprocal(4) returns [true, 0.25], reciprocal(-2) returns [true, -0.5],
 * and reciprocal(0) returns [false, 0] because 1 divided by 0 is not allowed.
 * This function must return an array in the form [ok, value].
 * @param {number} x - The input number.
 * @return {[boolean, number]} Returns [true, 1 / x] when x is not 0, otherwise [false, 0].
 */
function reciprocal(x) {
  // Your code here
}

/**
 * @desc Changes the sign of a number. Positive numbers become negative,
 * negative numbers become positive, and 0 stays 0.
 * For example, toggleSign(5) returns -5, toggleSign(-3) returns 3, and toggleSign(0) returns 0.
 * This function returns a single number.
 * @param {number} x - The input number.
 * @return {number} The value of x with its sign flipped.
 */
function toggleSign(x) {
  // Your code here
}


// ----------------------------------------------------------------------------
// ----------------------------------- HARD -----------------------------------
// ----------------------------------------------------------------------------


/**
 * @desc Raises a base number to an exponent and returns the result.
 * This means multiplying the base by itself over and over.
 * For example, power(2, 3) returns 8 because 2 × 2 × 2 = 8.
 * power(5, 1) returns 5, power(3, 0) returns 1, and power(2, -1) returns 0.5.
 * In this project, treat the exponent as an integer.
 *
 * Algorithm explanation:
 * If the exponent is positive, multiply the base by itself that many times.
 * If the exponent is 0, the answer is 1.
 * If the exponent is negative, first find the answer as if it were positive,
 * then return 1 divided by that answer.
 *
 * Plain-English pseudocode:
 * 1. If b is 0, return 1.
 * 2. Create a variable called result and set it to 1.
 * 3. Create a variable called exponent and set it equal to b.
 * 4. If exponent is negative, change it to its positive version.
 * 5. Repeat the following step exponent number of times:
 *    result = result * a
 * 6. If the original b was negative, return 1 / result.
 * 7. Otherwise, return result.
 *
 * @param {number} a - The base number.
 * @param {number} b - The exponent.
 * @return {number} The value of a raised to the power of b.
 */
function power(a, b) {
  // Your code here
}

/**
 * @desc Computes the square root of a number and returns the result in a two-part array.
 * The square root is the number that, when multiplied by itself, gives the original value.
 * For example, sqrt(9) returns [true, 3], sqrt(0) returns [true, 0],
 * sqrt(2) returns [true, about 1.4142], and sqrt(-1) returns [false, 0].
 * Negative inputs do not have a real square root in this calculator.
 *
 * Algorithm explanation:
 * Use a guess-and-improve method. Start with a guess, then keep making it better.
 * Each new guess gets closer to the real square root. Stop when the guess is no longer changing enough.
 *
 * Plain-English pseudocode:
 * 1. If x is less than 0, return [false, 0].
 * 2. If x is 0, return [true, 0].
 * 3. Start with a guess value.
 * 4. Save the old guess.
 * 5. Make a new guess using:
 *    (old guess + x / old guess) / 2
 * 6. Keep repeating steps 4 and 5 until the guess is very close to the old guess.
 * 7. Return [true, guess].
 *
 * @param {number} x - The input number.
 * @return {[boolean, number]} Returns [true, squareRoot] for non-negative inputs, otherwise [false, 0].
 */
function sqrt(x) {
  // Your code here
}

/**
 * @desc Computes the factorial of a whole number.
 * Factorial means multiplying all whole numbers from 1 up to the given number.
 * For example, factorial(5) is 5 × 4 × 3 × 2 × 1, which is 120.
 * This function returns [true, answer] when the input is valid.
 * It returns [false, 0] when the input is not a whole number in the allowed range.
 * For example, factorial(5) returns [true, 120], factorial(0) returns [true, 1],
 * factorial(-1) returns [false, 0], and factorial(3.5) returns [false, 0].
 *
 * Algorithm explanation:
 * Start with 1, then multiply by each whole number one at a time until you reach n.
 * If the input is not allowed, return [false, 0].
 * Since 0! is defined as 1, that case should return [true, 1].
 *
 * Plain-English pseudocode:
 * 1. If n is not a whole number, return [false, 0].
 * 2. If n is less than 0, return [false, 0].
 * 3. If n is greater than 170, return [false, 0].
 * 4. Create a variable called result and set it to 1.
 * 5. Start a loop from 2 up to n.
 * 6. In each loop step, multiply result by the current number.
 * 7. After the loop ends, return [true, result].
 *
 * @param {number} n - The input value.
 * @return {[boolean, number]} Returns [true, factorialValue] when n is a valid whole number, otherwise [false, 0].
 */
function factorial(n) {
  // Your code here
}



// ---------------------------------------------------------------------------
// ----------------------- DO NOT TOUCH BELOW THIS LINE ----------------------
// ---------------------------------------------------------------------------



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