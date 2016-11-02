const test = require('tape');
const UnionType = require('../');
const R = require('ramda');
const T = require('sanctuary-def');

const UT = UnionType({
  env: T.env,
  check: true,
});

const Type = UT.Anonymous;
const Named = UT.Named;
const Class = UT.Class;

test('defining a union type with predicates', t => {
  const Num = n => typeof n === 'number';

  const Point = Type(
    {Point: [Num, Num]}
  );
  const p = Point.Point(2, 3);

  const [x, y] = p;

  t.deepEqual([x, y], [2, 3]);
  t.end();
});

test('defining a union type with built ins', t => {

  const I = R.identity;

  /* eslint-disable comma-dangle */
  [
    [2, Number, I],
    ['2', String, I],
    [true, Boolean, I],
    [{a: 1}, Object, I],
    [[0, 1, 2], Array, I],
    [() => 1, Function, f => f()]
  ]
  /* eslint-enable comma-dangle */

  .forEach(
    ([expected, T, f]) => {
      const Class = Type({T: [T]});
      const instance = Class.T(expected);
      const actual = instance[0];

      t.deepEqual(f(expected), f(actual));
    }
  );

  t.end();
});

test('defining a record type', t => {
  const Point = Type(
    {Point: {x: Number, y: Number}}
  );

  const [x, y] = Point.Point(2, 3);

  const [x1, y1] = Point.PointOf({x: 2, y: 3});

  t.deepEqual([x, y], [x1, y1]);
  t.end();
});

test('create instance methods', t => {

  /* eslint-disable */
  const Maybe = Type({
    Just: [T.Any]
    , Nothing: []
  });

  Maybe.prototype.map = function(fn) {
    return Maybe.case({
      Nothing: () => Maybe.Nothing()
      , Just: (v) => Maybe.Just(fn(v))
    }, this);
  }
  /* eslint-enable */

  const just = Maybe.Just(1);
  const nothing = Maybe.Nothing();
  just.map(R.add(1)); // => Just(2)

  t.equal(nothing.map(R.add(1))._name, 'Nothing');
  t.equal(Maybe.Just(4)[0], 4);
  t.end();
});


test('create instance methods declaratively', t => {

  /* eslint-disable */
  const Maybe = Class(
    'Maybe'
    ,{ Just: [T.Any]
    , Nothing: []
    }
    ,{
      map( fn ){
        return Maybe.case({
          Nothing: () => Maybe.Nothing()
          , Just: (v) => Maybe.Just(fn(v))
        }, this)
      }
    }
  );

  /* eslint-enable */

  const just = Maybe.Just(1);
  const nothing = Maybe.Nothing();

  just.map(R.add(1)); // => Just(2)

  t.equal(nothing.map(R.add(1))._name, 'Nothing');
  t.equal(Maybe.Just(4)[0], 4);
  t.end();
});

test('Fields can be described in terms of other types', t => {
  const Point = Type(
    {Point: {x: Number, y: Number}}
  );

  const Shape = Type({
    Circle: [Number, Point],
    Rectangle: [Point, Point],
  });


  const [radius, [x, y]] = Shape.Circle(4, Point.Point(2, 3));

  t.deepEqual([radius, x, y], [4, 2, 3]);


  t.end();
});

test('The values of a type can also have no fields at all', t => {
  const NotifySetting = Type(
    {Mute: [], Vibrate: [], Sound: [T.Number]}
  );

  t.equal('Mute', NotifySetting.Mute()._name);

  t.end();
});

test('If a field value does not match the spec an error is thrown', t => {

  const err =
`TypeError: Invalid value

Point.Point :: Number -> Number -> { x :: Number, y :: Number }
                         ^^^^^^
                           1

1)  "foo" :: String

The value at position 1 is not a member of ‘Number’.
`;

  const Point = Named(
    'Point'
    , {Point: {x: Number, y: Number}}
  );

  try {
    Point.Point(4, 'foo');
  } catch (e){
    t.equal(err, e.toString());
  }

  t.end();
});

test('Switching on union types', t => {

  const Action =
    Type({
      Up: [],
      Right: [],
      Down: [],
      Left: [],
    });

  const player = {x: 0, y: 0};

  const advancePlayer = (action, player) =>
    Action.case({
      Up: () => ({x: player.x, y: player.y - 1}),
      Right: () => ({x: player.x + 1, y: player.y}),
      Down: () => ({x: player.x, y: player.y + 1}),
      Left: () => ({x: player.x - 1, y: player.y}),
    }, action);

  t.deepEqual(
    {x: 0, y: -1},
    advancePlayer(Action.Up(), player)
  );

  t.end();

});

test('Switch on union types point free', t => {

  const Point = Type(
    {Point: {x: T.Number, y: T.Number}}
  );

  const Shape = Type({
    Circle: [T.Number, Point],
    Rectangle: [Point, Point],
  });

  const p1 = Point.PointOf({x: 0, y: 0});
  const p2 = Point.PointOf({x: 10, y: 10});

  {
    const area = Shape.case({
      Circle: (radius, _) => Math.PI * radius * radius,
      Rectangle: (p1, p2) => (p2.x - p1.x) * (p2.y - p1.y),
    });

    const rect = Shape.Rectangle(p1, p2);

    t.equal(
      100
      , area(rect)
    );
  }

  {
    const rect = Shape.Rectangle(p1, p2);

    const area = rect.case({
      Circle: (radius, _) => Math.PI * radius * radius,
      Rectangle: (p1, p2) => (p2.x - p1.x) * (p2.y - p1.y),
    });
    console.log('after', area);

    t.equal(
      100
      , area
    );

  }
  t.end();
});

test('Pass extra args to case via caseOn', t => {
  const Action =
    Type({
      Up: [],
      Right: [],
      Down: [],
      Left: [],
    });

  const player = {x: 0, y: 0};

  const advancePlayer =
    Action.caseOn({
      Up: (p, ...extra) => ['Up', p, ...extra],
      Right: (p, ...extra) => ['Down', p, ...extra],
      Down: (p, ...extra) => ['Left', p, ...extra],
      Left: (p, ...extra) => ['Right', p, ...extra],
    });

  t.deepEqual(
    ['Up', {x: 0, y: 0}, 1, 2, 3]
    , advancePlayer(Action.Up(), player, 1, 2, 3)
  );

  t.end();
});

test('Destructuring assignment to extract values', t => {

  const Point = Type(
    {Point: {x: Number, y: Number}}
  );

  const [x, y] = Point.PointOf({x: 0, y: 0});

  t.deepEqual(
    {x: 0, y: 0},
    {x, y}
  );

  t.end();

});

test('Recursive Union Types', t => {
  /* eslint-disable no-var */
  var List =
    Type({Nil: [], Cons: [T.Any, List]});
  /* eslint-enable no-var */

  const toString =
    List.case({
      Cons: (head, tail) => `${head} : ${toString(tail)}`,
      Nil: () => 'Nil',
    });

  const list =
    List.Cons(1, List.Cons(2, List.Cons(3, List.Nil())));

  t.equal('1 : 2 : 3 : Nil', toString(list));

  t.end();
});

test('Disabling Type Checking', t => {

  const Type = UnionType({
    env: T.env,
    check: false,
  })
    .Anonymous;

  const Point = Type({
    Point: {x: Number, y: Number},
  });

  const p = Point.Point('foo', 4);

  t.equal('foo', p.x);
  t.end();
});

test('Use placeholder for cases without matches', t => {
  /* eslint-disable no-var */
  var List =
    Type({Nil: [], Cons: [T.Any, List]});
  /* eslint-disable no-var */

  t.equal(
    'Nil'
    , List.case({
      Cons: () => 'Cons',
      _: () => 'Nil',
    }, List.Nil())
  );

  const actual = List.Nil().case({
    Cons: () => 'Cons',
    _: () => 'Nil',
  });

  t.equal('Nil', actual);

  t.end();

});

test('caseOn throws an error when not all cases are covered', t => {

  const NotifySetting = Type(
    {Mute: [], Vibrate: [], Sound: [T.Number]}
  );

  try {

    NotifySetting.caseOn({
      Vibrate: () => 'Mute',
    }, NotifySetting.Mute(), 1, 2);
  } catch (e) {
    t.equal(e.toString(), 'TypeError: Non exhaustive case statement');
  }

  t.end();

});

test('Create a Type with no cases', t => {
  Type({});

  t.end();
});

test('Can iterate through a instance\'s values', t => {
  const T = Type({
    Values: [Number, Number, Number],
  });

  const instance = T.Values(1, 2, 3);

  t.plan(3);

  for (const v of instance){
    t.ok(v);
  }

  t.end();
});
