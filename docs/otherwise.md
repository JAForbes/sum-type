#### Otherwise

`string[] -> f -> { [key:string]: f }`

A helper function for generating folds that are versioned separately to the type definition.  It's useful when you want to avoid specifying each clause in a fold without losing type safety or introducing [other modelling problems](https://github.com/JAForbes/sum-type/issues/13)

```js

const { Y, N } = T.Maybe
const Platform = T.tags ('Platform') ([
	'ModernWindows',
	'XP',
	'Linux',
	'Darwin'
])

// defined separately to detect changes in intent
const rest = T.otherwise([
	'ModernWindows',
	'XP',
	'Linux',
	'Darwin'
])

const windows = T.otherwise([
	'ModernWindows',
	'XP'
])

const foldWindows = f => T.map(Platform) ({
	... rest(N),
	... windows( () => Y(f()) )
})

const winPing = 
	foldWindows
		( () => 'ping \\t www.google.com' )

winPing( Platform.Darwin() )
// => T.Maybe.N()

winPing( Platform.XP() )
// => T.Maybe.Y('ping \t www.google.com')

```

At a later date, you may add support for WSL.  Which will likely break earlier assumptions because it's both linux _and_ windows.

```js
const Platform = T.tags ('Platform') ([
	'ModernWindows',
	'XP',
	'WSL',
	'Linux',
	'Darwin'
])
```

Now `sumType` will helpfully throw a `MissingTags` error for all the usages of our original `otherwise` functions that no longer discriminate the union.

We can now create a new otherwise for that assumption:

```js


const windows = T.otherwise([ //OLD
	'ModernWindows',
	'XP'
])

const rest = T.otherwise([ //OLD
	'ModernWindows',
	'XP',
	'Linux',
	'Darwin'
])

const rest2 = T.otherwise([ // NEW!
	'ModernWindows',
	'XP',
	'WSL', // NEW
	'Linux',
	'Darwin',
])

const windowsGUI = T.otherwise([ // NEW
	'ModernWindows',
	'XP',
])

const foldWindowsGUI = f => T.map(Platform) ({ // NEW
	... rest2(N),
	... windowsGUI( () => Y(f()) )
})

const foldWindows = f => T.map(Platform) ({ // OLD
	... rest(N),
	... windows( () => Y(f()) )
})

```

Our original `ping` function is using our old function, let's revisit our assumptions:

```js
const winPing = 
	foldWindows
		( () => 'ping \\t www.google.com' )

const winPing2 =
	foldWindowsGUI
		( () => 'ping \\t www.google.com' )
```

When we've updated all the references, `sumType` will stop throwing errors on initialization.  You can then delete the old definitions and update the new definitions to have the old names.  Leaving us with:

```js
const { Y, N } = T.Maybe
const Platform = T.tags ('Platform') ([
	'ModernWindows',
	'XP',
	'Linux',
	'Darwin'
])

const rest = T.otherwise([ // renamed
	'ModernWindows',
	'XP',
	'WSL',
	'Linux',
	'Darwin',
])

const windowsGUI = T.otherwise([
	'ModernWindows',
	'XP',
])

const foldWindowsGUI = f => T.map(Platform) ({
	... rest2(N),
	... windowsGUI( () => Y(f()) )
})

const winPing =
	foldWindowsGUI
		( () => 'ping \\t www.google.com' )

```

If we hadn't versioned our `otherwise` structures separately to the type, we'd get no initialization errors and instead our code would break in unpredictable ways.  For example `WSL` has it's own `ping` and `\t` doesn't do anything on the linux version.  This is what makes separately versioned placeholders so powerful. 
