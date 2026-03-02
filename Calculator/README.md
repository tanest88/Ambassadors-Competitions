# UA Glass Calculator

A browser-based calculator project built with plain HTML, CSS, and JavaScript. The UI is defined in `index.html`, styling is in `styles.css`, the main calculator logic is in `app.js`, and the helper math functions live in `calcFunctions.js`.

This version is designed so the app structure already works, while the **student version** may include placeholder functions inside `calcFunctions.js`. Students are expected to implement those math helper functions themselves.

## Project Files

- `index.html` - main page and calculator layout
- `styles.css` - glassmorphism styling and responsive layout
- `app.js` - calculator behavior, parsing, validation, evaluation, memory, keyboard support, and background animation
- `calcFunctions.js` - small math helper functions used by `app.js`

## What You Need to Install

This project does **not** require Node.js, npm, or any external packages.

You only need:

1. A modern web browser such as Chrome, Edge, or Firefox
2. A code editor such as Visual Studio Code
3. Optional: the **Live Server** extension in VS Code for easier launching

## How to Run the Project

### Option 1: Open it directly

1. Download or place all four files in the same folder:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `calcFunctions.js`
2. Make sure the file names stay exactly the same.
3. Double-click `index.html` or right-click it and open it in your browser.

### Option 2: Run with VS Code Live Server

1. Open the project folder in VS Code.
2. Install the **Live Server** extension if you do not already have it.
3. Open `index.html`.
4. Click **Go Live** in VS Code.
5. The calculator should open in your browser automatically.

### Option 3: Run a simple local server with Python

If you want to run it through a local server instead of opening the file directly:

```bash
python -m http.server 8000
```

Then open this in your browser:

```text
http://localhost:8000
```

## Important Setup Note

In `index.html`, `calcFunctions.js` must load **before** `app.js`, because `app.js` depends on the global `CalcOps` object.

The script order should stay like this:

```html
<script src="calcFunctions.js"></script>
<script src="app.js"></script>
```

If that order is changed, the calculator may fail to run correctly.

## Student Version Note

In the version given to students, the functions inside `calcFunctions.js` will be placeholders.

That means:

- the UI and main app flow are already provided
- students should implement the missing math functions in `calcFunctions.js`
- students should not need to rewrite the full interface or parsing system unless instructed

Typical functions students may need to complete include operations such as:

- addition
- subtraction
- multiplication
- division
- power
- square root
- factorial
- percent
- reciprocal
- toggle sign

## How the Project Works

- `index.html` builds the calculator layout and loads the scripts
- `styles.css` controls the appearance
- `app.js` handles button input, keyboard support, expression parsing, validation, evaluation, memory features, display updates, and the animated background
- `calcFunctions.js` provides the small reusable math operations that `app.js` calls

## Features Included

- button-based calculator input
- keyboard support
- parentheses and expression parsing
- constants such as `pi` and `e`
- unary operations such as square root, square, reciprocal, and sign toggle
- postfix operations such as factorial and percent
- memory buttons (`MC`, `MR`, `M+`, `M-`)
- clear, clear entry, and backspace behavior
- animated canvas background

## Troubleshooting

### Nothing happens when I open the calculator

Make sure all files are in the same folder and that `index.html` is loading both JavaScript files correctly.

### I see an error about `CalcOps` not being found

Make sure `calcFunctions.js` is loaded before `app.js` in `index.html`.

### My buttons show up but calculations do not work

If you are using the student version, the functions in `calcFunctions.js` may still be placeholders. Implement those functions first.

### Styles are missing

Make sure `styles.css` is in the same folder as `index.html` and that the filename has not been changed.

## Suggested Workflow for Students

1. Open the project and confirm the interface loads.
2. Read through `calcFunctions.js`.
3. Implement the required placeholder functions.
4. Refresh the browser after each change.
5. Test calculator operations one by one.

## Author

Hidoyat Ruzmetov  
Product Owner: CS Ambassadors, University of Arizona
