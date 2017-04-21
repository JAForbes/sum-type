Contributions are very welcome.  Here's some guidelines to ensure a painless PR process.

Issues
======

To avoid wasting your time, and misunderstandings - it's a good idea to open an issue before starting any work.

Feel free to open issues to ask questions, float ideas.

If an issue already exists and you'd like to become the assignee, bring it up in the issue, to avoid duplication of work etc.

Quick Start
===========

To install

```js
git clone ...
npm install
```

To test

```js
npm test
```

Edit the source in `lib/index.js`

Edit tests in `test/test.js`

Tests
=====

sum-type maintains 100% code coverage.

Whenever the tests are run, code coverage stats will print to stdout automatically.

You can also navigate an interactive execution map of the library by opening 
`./coverage/lcov-report/index.html` in your browser.


Code style
==========

The code style may seem a little strange at first, but there's really not much to it.
If a PR isn't 100% exactly the code style, it's OK, I won't reject a PR if the code style is a little different.

Overall:

- 80 character limit
- Operator first for everything except `=` (ternaries, commas, division, additions, etc)
- Avoid mutation, use `const`

There's already an eslint file included that covers the above (and more).  

If you have any questions, feel free to ask.

#### Lists, Objects

- New line per item (even if it will fit)
- Opening brace shares a line with the first item

Do:

```js
const a = 
  { a: 1
  , b: 2
  }
  
const b =
  [ 1
  , 2
  , 3
  , 4
  ]
```

Don't:

```js
const a = {
  a: 1
  ,b: 2
}

const b = { c: 3,  d: 3}

const c = [1,2,3,4,5,6]
```

What we're doing here is optimizing for easy merges and easier re-ordering as opposed to lines of code.

#### Declarations

When declaring a constant/variable, use a line break and indent after the `=`

Do:

```js
const a =
  'hello'
```

Don't

```js
const a = 'hello'
```

It might seem ridiculous, but I don't want nuanced rules for different line lengths.  One rule to rule them all?

The idea is, if the line grows, the formatting doesn't need to change.

#### Functions

Feel free to use arrow functions, function statements, function expressions, whatever helps you solve the problem.

If the function arguments span over the 80 char limit, follow the line break, comma first rules from objects/lists ( above ).

#### Variable names

I prefer names like `x` `xs` `a` etc.  It's nice if the names mimic type variables.  
So if an `ys` is a list of objects, then `y` should be the same type of record that `ys` contains.

But, sometimes more verbose names are helpful.  So totally up to you.

#### Semicolons

Do what you want

#### Tabs vs Spaces?

Whichever it is, use that.  I'm not sure what it currently is.

#### Generators, where do I put the little `*` ?

Doesn't matter.
