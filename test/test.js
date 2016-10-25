const test = require('tape')
const UnionType = require('../')
const R = require('ramda')
const T = require('sanctuary-def')

const {Anonymous, Named} = UnionType({
    env: T.env
    ,check: true
})

const Type = Anonymous

test('defining a union type with predicates', function(t){
    const Num = n => typeof n == 'number'

    const Point = Type(
        { Point: [Num, Num] }
    )

    const [x,y] = Point.Point(2,3)

    t.deepEqual([x,y], [2,3])
    t.end()
})

test('defining a union type with built ins', function(t){

    const Point = Type(
        {Point: [Number, Number]}
    )

    const [x,y] = Point.Point(2,3)

    t.deepEqual([x,y], [2,3])
    t.end()
})

test('defining a record type', function(t){
    const Point = Type(
        {Point: {x: Number, y: Number}}
    )

    const [x,y] = Point.Point(2,3)

    const [x1,y1] = Point.PointOf({x: 2, y:3 })

    t.deepEqual([x,y], [x1,y1])
    t.end()
})

test('create instance methods', function(t){
    
    const Maybe = Type(
        {Just: [T.Any], Nothing: []}
    );

    Maybe.prototype.map = function(fn) {
        return Maybe.case({
            Nothing: () => Maybe.Nothing(),
            Just: (v) => Maybe.Just(fn(v))
        }, this);
    }

    const just = Maybe.Just(1);
    const nothing = Maybe.Nothing();

    just.map(R.add(1)); // => Just(2)

    t.equal(nothing.map(R.add(1))._name, 'Nothing')
    t.equal(Maybe.Just(4)[0], 4)
    t.end()
})

test('Fields can be described in terms of other types', function(t){
    const Point = Type(
        {Point: {x: Number, y: Number}}
    )

    const Shape = Type({
        Circle: [Number, Point],
        Rectangle: [Point, Point]
    })

    const [radius, [x,y]] = Shape.Circle(4, Point.Point(2,3))
    
    t.deepEqual([radius, x, y], [4, 2 ,3])
    

    t.end()
})

test('The values of a type can also have no fields at all', function(t){
    const NotifySetting = Type(
        {Mute: [], Vibrate: [], Sound: [T.Number]}
    )

    t.equal('Mute', NotifySetting.Mute()._name)

    t.end()
})

test('If a field value does not match the specification an error is thrown', function(t){

const err = 
`TypeError: Invalid value

Point.Point :: Number -> Number -> { x :: Number, y :: Number }
                         ^^^^^^
                           1

1)  "foo" :: String

The value at position 1 is not a member of ‘Number’.
`

    const Point = Named(
        'Point'
        ,{ Point: {x: Number, y: Number} }
    )

    try {
        Point.Point(4, 'foo');
    } catch( e ){
        t.equal(e.toString(), err)
    }

    t.end()
})

test('Switching on union types', function(t){

    const Action = 
        Type(
            { Up: []
            , Right: []
            , Down: []
            , Left: []
            , Jump: []
            }
        );

    var player = {x: 0, y: 0};

    const advancePlayer = (action, player) =>
        Action.case({
            Up: () => ({x: player.x, y: player.y - 1}),
            Right: () => ({x: player.x + 1, y: player.y}),
            Down: () => ({x: player.x, y: player.y + 1}),
            Left: () => ({x: player.x - 1, y: player.y}),
            _: () => player
        }, action)

    t.deepEqual(
        { x: 0, y: -1}
        ,advancePlayer(Action.Up(), player)
    )


    t.end()

})

test('Switch on union types point free', function(t){

    const Point = Type(
        { Point: {x: T.Number, y: T.Number}}
    )

    const Shape = Type({
        Circle: [T.Number, Point]
        ,Rectangle: [Point, Point]
    })

    const area = Shape.case({
        Circle: (radius, _) => Math.PI * radius * radius
        ,Rectangle: (p1, p2) => (p2.x - p1.x) * (p2.y - p1.y)
    })

    const p1 = Point.PointOf({ x: 0, y: 0 })
    const p2 = Point.PointOf({ x: 10, y: 10 })

    t.equal(
        100
        , area( Shape.Rectangle(p1,p2) )
    )

    t.end()
})

test('Pass extra args to case via caseOn', function(t){
     const Action = 
        Type(
            { Up: []
            , Right: []
            , Down: []
            , Left: []
            , Jump: []
            }
        );

    var player = {x: 0, y: 0};

    const advancePlayer =
        Action.caseOn({
            Up: () => ({x: player.x, y: player.y - 1}),
            Right: () => ({x: player.x + 1, y: player.y}),
            Down: () => ({x: player.x, y: player.y + 1}),
            Left: () => ({x: player.x - 1, y: player.y})
        })

    t.deepEqual(
        { x: 0, y: -1}
        ,advancePlayer(Action.Up(), player, 1)
    )

    t.end()
})

test('Destructuring assignment to extract values', function(t){

    const Point = Type(
        {Point: { x: Number, y: Number }}
    )

    const [x,y] = Point.PointOf({x: 0, y: 0 })

    t.deepEqual(
        { x: 0, y: 0}
        ,{ x, y }
    )

    t.end()

})

test('Recursive Union Types', function(t){
    var List = 
        Type({Nil: [], Cons: [T.Any, List]});

    const toString = 
        List.case({
            Cons: (head, tail) => head + ' : ' + toString(tail)
            ,Nil: () => 'Nil'
        })

    const list = 
        List.Cons(1, List.Cons(2, List.Cons(3, List.Nil())));
    
    t.equal('1 : 2 : 3 : Nil', toString(list) )

    t.end()
})

test('Disabling Type Checking', function(t){

    const Type = UnionType({
        env: T.env
        ,check: false
    })
        .Anonymous

    const Point = Type({
        Point: {x: Number, y: Number}
    })

    const p = Point.Point('foo', 4);
    
    t.equal('foo', p.x)    
    t.end()
})