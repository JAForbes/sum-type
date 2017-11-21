const test = require('tape');
const T = require('..');
const $ = T.$
const J = o => JSON.parse(JSON.stringify(o))

test('type, case and value should now appear on a serialized instance', t => {
  const Identity =
    T.Value('Identity', {
      Identity: $.Number
    });

  const I = x => Identity.Identity(x)

  t.ok(J(I(1)).case, '.case is on the instance')
  t.ok(J(I(1)).type, '.type is on the instance')
  t.ok(J(I(1)).value, '.value is on the instance')

  t.end()
})

test('inject a type into sanctuary\'s env', t => {

  const Identity =
    T.Value('Identity', {
      Identity: $.Number
    })

  const { create, env } = require('sanctuary')

  const S = create({ 
    checkTypes: true, env: env.concat([Identity])
  })

  S.map(S.inc, S.Just(1));

  t.end()
})

test('defining a record type', t => {
  const Point = T.Record(
    'Point'
    ,{ Point: { x: $.Number, y: $.Number } }
  );

  const {x,y} = Point.Point({x: 2, y: 3}).value

  t.deepEqual([x, y], [2,3])
  t.end()
})

test('Fields can be described in terms of other types', t => {
  const Point = T.Record(
    'Point'
    ,{Point: {x: $.Number, y: $.Number}}
  );

  const Shape = T.Record('Shape', {
    Circle: { radius: $.Number, origin: Point }
    ,Rectangle: { width: Point, height: Point}
  });


  Shape.case({
    Circle: () => Point.Point({x: 2, y:2})
    ,Rectangle: () => Point.Point({x: 2, y:2})
  }, Shape.Circle({ radius: 4, origin: Point.Point({ x: 2, y: 3}) }))

  const { radius, origin: { value: {x, y} } } = 
    Shape.Circle({ radius: 4, origin: Point.Point({ x: 2, y: 3}) }).value

  t.deepEqual([radius, x, y], [4, 2, 3])

  t.end();
});

test('The values of a type can also have no fields at all', t => {
  
  const NotifySetting = T.Value(
    'NotifySetting'
    ,{ Mute: T.Unit, Vibrate: $.Any, Sound: $.Number }
  )

  t.deepEqual('Mute', NotifySetting.Mute().case )

  t.end()

})

test('If a field value does not match the spec an error is thrown', t => {

  const Point = T.Record(
    'Point'
    , {Point: {x: $.Number, y: $.Number}}
  )

  t.throws(
    () => Point.Point({ x: 4, y: 'foo' })
    ,/The value at position 1 is not a member of ‘Number’/
  )

  t.throws(
    () => Point.Point(2, 4)
    ,/Function applied to too many arguments/
  )

  t.end();
});

test('Switching on union types', t => {

  const Action =
    T.Record('Action', {
      Up: T.Unit
      ,Right: T.Unit
      ,Down: T.Unit
      ,Left: T.Unit
    });

  const player = {x: 0, y: 0};

  const advancePlayer = (action, player) =>
    Action.case({
      Up: () => ({x: player.x, y: player.y - 1})
      , Right: () => ({x: player.x + 1, y: player.y})
      , Down: () => ({x: player.x, y: player.y + 1})
      , Left: () => ({x: player.x - 1, y: player.y})
    }, action)

  t.deepEqual(
    {x: 0, y: -1},
    advancePlayer(Action.Up(), player)
  );

  t.end();

});

test('Switch on union types point free', t => {

  const Point = T.Record(
    'Point'
    ,{ Point: {x: T.$.Number, y: T.$.Number } }
  )

  const Shape = T.Record('Shape', {
    Circle: { radius: T.$.Number, origin: Point }
    ,Rectangle: { width: Point, height: Point }
  })

  const p1 = Point.Point({ x: 0, y: 0 })
  const p2 = Point.Point({ x: 10, y: 10 })

  {

    const area = Shape.case({
      Circle: ({radius}) => Math.PI * radius * radius
      ,Rectangle: ({ width: { value: p1}, height: { value: p2} }) => 
        (p2.x - p1.x) * (p2.y - p1.y)
    })

    const rect = Shape.Rectangle({ width: p1, height: p2 })

    t.equal(
      100
      , area(rect)
    )

  }

  t.end();
})

test('Destructuring assignment to extract values', t => {

  const Point = T.Record(
    'Point'
    ,{Point: {x: T.$.Number, y: T.$.Number}}
  );

  const value = Point.Point({x: 0, y: 0}).value

  t.deepEqual(
    { x: 0, y: 0 }
    ,value
  );

  t.end();

});

test('Recursive Union Types', t => {
  
  const List =
    T.Recursive('List', $T => ({
      Nil: T.Unit
      ,Cons: $.Pair( $.Any, $T )
    }))

  const toString =
    List.case({
      Cons: ([head, tail]) => `${head} : ${toString(tail)}`
      ,Nil: () => 'Nil'
    })

  const cons = List.Cons
  const nil = List.Nil

  const list =
    cons([1, cons([2, cons([3, nil()])])])

  t.equal('1 : 2 : 3 : Nil', toString(list))

  t.end()
})

test('Disabling Type Checking', t => {

  const T = require('../lib')($, {
    checkTypes: false
  })

  const Point = T.Record('Point', {
    Point: {x: T.$.Number, y: T.$.Number},
  });

  const p = Point.Point({ x: 'foo', y: 4 });

  t.equal('foo', p.value.x);
  t.end();
});

test('case throws if receives a value that isnt a subtype', function(t){

  const ScheduleTask =
   T.Record('Task', {
    Task: { task_message: T.$.String }
  })

  const Response =
    T.Record('Response', {
      Task: { task: ScheduleTask }
      ,TaskStarted: { task: ScheduleTask }
    })

  t.throws(function(){

    Response.case({
      Task: () => t.fail(
        'case should have thrown before executing'
      )
      ,TaskStarted: () => t.fail(
        'case should have thrown before executing'
      )
    }, ScheduleTask.Task('Hey hey') )

  }, /The value at position 1 is not a member of/
  , 'Placeholder requires subtype'
  )

  t.end()
})

test('Lower case case names throws', function(t){
  t.throws(function(){
    // eslint-disable-next-line no-unused-vars
    const ISO8601 =
      T.Value('ISO8601', {
        mm: T.$.Number
        ,ss: T.$.Number
        ,hh: T.$.Number
        ,ms: T.$.Number
      })
  }, /Case names must begin with a capital letter./)
  t.end()
})

test('static case method throws if not all cases are covered', function(t){
  const ISO8601 =
    T.Value('ISO8601', {
      MM: T.$.Number
      ,SS: T.$.Number
      ,HH: T.$.Number
      ,MS: T.$.Number
    })

    
  t.throws(function(){
      const to = {
        ms: ISO8601.case({
          MS: n => n
          ,SS: n => to.ms(ISO8601.MM(n/1000))
          ,MM: n => to.ms(ISO8601.SS(n/60))
          //missing case
        })
      }
  }, /The value at position 1 is not a member of/)

  t.end()
})

test('Predicates!', function(t){

  const Num = T.Value('Num', {
    Even: T.Predicate(x => x % 2 == 0)
  })

  const two = Num.Even( 2 )

  t.equals( two.value, 2 )

  t.throws(function(){
    Num.Even(3)
  }, /not a member of ‘Predicate :: x => x % 2 == 0’/)

  t.end()
})


test('Empty Record type uncurried', function(t){

  const $T1 = T.Record('',{
    Empty: {}
  })

  const $T2 = T.Record('',{
    Empty: T.Unit
  })

  t.throws(function(){
    $T1.Empty()
  },/not a member of ‘{ }’/)

  t.doesNotThrow(function(){
    $T1.Empty({})
  })

  t.throws(function(){
    $T2.Empty({})
  },/too many arguments/)

  t.doesNotThrow(function(){
    $T2.Empty()
  })

  t.end()
})