import test from 'node:test'
import assert from 'node:assert'

import * as T from '../lib/index.js'

test('basic', () => {
	const Resource = T.type('Resource', {
		Loading: (_: any) => null,
		Loaded: (_: { id: string; title: string }) => _,
		Error: (_: Error) => _,
		Empty: (_: any) => _,
	})

	const resource = Resource.Loaded({ id: '1', title: 'Example' })

	assert.equal(Resource.isLoading(resource), false)
	assert.equal(Resource.isLoaded(resource), true)

	const getTitle = (resource: T.Instance<typeof Resource>) =>
		Resource.getLoaded(resource, '', (x) => x.title)

	assert.equal(getTitle(resource), 'Example')
	assert.equal(getTitle(Resource.Loading({})), '')
})

test('get overloads', () => {
	const Resource = T.type('Resource', {
		Loading: (_: any) => null,
		Loaded: (_: { id: string; title: string }) => _,
		Error: (_: Error) => _,
		Empty: (_: any) => _,
	})

	const loaded = Resource.Loaded({ id: '1', title: 'Example' })
	const empty = Resource.Empty({})

	assert.deepEqual(Resource.getLoaded(empty), null)
	assert.deepEqual(Resource.getLoaded(empty, 0), 0)
	assert.deepEqual(Resource.getLoaded(empty, 0, () => 1), 0)

	assert.deepEqual(Resource.getLoaded(loaded), { id: '1', title: 'Example' })
	assert.deepEqual(Resource.getLoaded(loaded, 0), { id: '1', title: 'Example' })
	assert.deepEqual(Resource.getLoaded(loaded, 0, () => 1), 1)
})

test('match', () => {
	const Resource = T.Resource<'ExampleResource', { id: string; title: string }>('ExampleResource')

	{
		assert.equal(
			// @ts-expect-error
			Resource.match(Resource.Loaded({ title: 'Example' }), {
				Loaded: (x) => x.title,
			}),
			'Example',
			'No runtime type checks',
		)

		assert.throws(
			() =>
				// @ts-expect-error
				Resource.match(Resource.Loading(), {
					Loaded: (x) => x.title,
				}),
			/is not a function/,
		)
	}
})

test('Resource', () => {
	type File = { file_id: string }
	const FileResource = T.Resource<'FileResource', File>('FileResource')

	// @ts-expect-error
	FileResource.Loaded({})

	// @ts-expect-error
	FileResource.Loading({ file_id: 'cool' })

	FileResource.Loading({})
	FileResource.Loading({ progress: 45 })

	FileResource.Empty({})

	// @ts-expect-error
	FileResource.Empty({ progress: 45 })

	// @ts-expect-error
	FileResource.Error({})

	FileResource.Error(new Error('Could not load file') )
})

test('either', () => {
	// The duplication of `'LoadedFile'` can be removed once microsoft/TypeScript#26349 is merged
	// const LoadedFile = Loaded<File, 'LoadedFile'>('LoadedFile')

	const LoadedFile = T.either('LoadedFile', (_: File) => _)
	type File = { file_id: string }
	
	assert.deepEqual(LoadedFile.N({}), {
		type: 'LoadedFile',
		tag: 'N',
		value: {},
	})

	assert.deepEqual(LoadedFile.Y({ file_id: '1' }), {
		type: 'LoadedFile',
		tag: 'Y',
		value: { file_id: '1' },
	})
})

test('either::encase', () => {
	const JSONValue = T.either(
		'JSONValue',
		(_: any) => _,
		(_: Error) => _,
	)

	const parseJSON = JSONValue.encase((value: string) => JSON.parse(value))

	assert.deepEqual(parseJSON('invalid json'), {
		type: 'JSONValue',
		tag: 'N',
		value: new SyntaxError(
			`Unexpected token 'i', "invalid json" is not valid JSON`,
		),
	})
	assert.deepEqual(parseJSON(JSON.stringify({ example: 'awesome' })), JSONValue.Y({ example: 'awesome' }))

	
	{
		const parsed = parseJSON(JSON.stringify({ example: 'awesome' }))
		const property = JSONValue.getY(parsed, 'not awesome', x => x.example as string)
		assert.equal(property, 'awesome')
	}
	{
		const parsed = parseJSON('invalid json')
		const property = JSONValue.getY(parsed, 'not awesome', x => x.example as string)
		assert.equal(property, 'not awesome')
	}

})

test('either::bifold', () => {
	type Config = {
		isConfig: true
	}
	const JSONConfig = T.either(
		'JSONConfig',
		(_: Config) => _,
		(_: Error) => _,
	)

	const parseJSON = JSONConfig.encase((value: string) => JSON.parse(value))

	{
		const result = JSONConfig.bifold( parseJSON('invalid'), () => null, x => x )
		assert.equal(
			result, null
		)
	}

	{
		const result = JSONConfig.bifold( parseJSON('{ "isConfig": true }'), () => null, x => x )
		assert.deepEqual(
			result, { isConfig: true }
		)
	}
	
})

test('either::get', () => {
	type Config = {
		isConfig: true
	}
	const JSONConfig = T.either(
		'JSONConfig',
		(_: Config) => _,
		(_: Error) => _,
	)

	const parseJSON = JSONConfig.encase((value: string) => JSON.parse(value))

	{
		const result = JSONConfig.get(parseJSON('invalid'), null, x => x.isConfig)
		assert.equal(
			result, null
		)
	}

	{
		const result = JSONConfig.get(parseJSON('{ "isConfig": true }'), null, x => x.isConfig)
		assert.equal(
			result, true
		)
	}

	{
		const result = JSONConfig.get(parseJSON('{ "isConfig": true }'), null)
		assert.deepEqual(
			result, { isConfig: true }
		)
	}
	
})

test('otherwise', () => {
	const Resource = T.type('Resource', {
		Loading: (_: any) => _,
		Loaded: (_: { id: string; title: string }) => _,
		Error: (_: Error) => _,
		Empty: (_: any) => _,
	})

	const resource = Resource.Loaded({ id: '1', title: 'Example' })

	{
		const _ = Resource.otherwise()

		const getTitleOtherwise = (resource: T.Instance<typeof Resource>) =>
			Resource.match(resource, {
				..._(() => null),
				Loaded: (x) => x.title,
			})

		assert.equal(getTitleOtherwise(resource), 'Example')
		assert.equal(getTitleOtherwise(Resource.Error(new Error('Whatever'))), null)
	}

	{
		const NoData = Resource.otherwise(['Error', 'Empty'])
		const getTitleOtherwise = (resource: T.Instance<typeof Resource>) =>
	
			// @ts-expect-error
			Resource.match(resource, {
				...NoData(() => null),
				Loaded: (x) => x.title,
			})

		assert.equal(getTitleOtherwise(resource), 'Example')
		assert.equal(getTitleOtherwise(Resource.Error(new Error('Whatever'))), null)

		assert.throws(
			// @ts-expect-error
			() => getTitleOtherwise(Resource.Loading()),
			'is not a function',
		)
	}
})

test('map / flatMap', () => {
	const Resource = T.type('Resource', {
		Loading: (_: number) => _,
		Loaded: (_: { id: string; title: string }) => _,
		Error: (_: Error) => _,
		Empty: (_: any) => _,
	})

	
	const Loaded = 
		T.either("Loaded", (_: string) => _, (_: number) => _)

	{
		const res = Resource.mapLoaded( Resource.Loaded({ id: 'cool', title: 'wow' }), x => 2 )
	
		assert( res.tag === 'Loaded' )
	
		// no type error!
		assert( res.value === 2 )
	
		// equal, but types for Resource.Loaded constructor disallows number constructor (rightfully)
		// @ts-expect-error
		assert.deepEqual( Resource.Loaded(2), res )
	}

	{
		const res = Loaded.map( Loaded.Y('cool'), x => x == 'cool' ? 2 : 4 )

		assert( res.tag === 'Y' )

		assert( res.value == 2 )

		// equal, but types for Loaded.Y constructor disallows number constructor (rightfully)
		// @ts-expect-error
		assert.deepEqual( Loaded.Y(2), res )
	}

	// Note these usages of flatMap are more to test the types
	// are correctly representing functors.  As in, you can map over a Resource
	// and change the internal value of a particular tag without any issues.
	//
	// But, our type constructors are _not_ generic so they rightfully error.
	// To propagate generic types from the constructors to the other types 
	// is something I'm yet to figure out in typescript
	// 
	// But its not a big deal, it just means you can't pass arbitary data to constructors.
	// We solve for that by creating functions that return more specific types
	{
		const input = Resource.Loaded({ id: 'cool', title: 'wow' })
		const res = Resource.flatMapLoaded( 
			input
			, (x) => ({ type: 'Resource', tag: 'Loaded', value: 55 })
		)
		assert.deepEqual(
			res,
			// @ts-expect-error
			Resource.Loaded(55)
		)
	}

	{
		const input = Loaded.Y('cool')
		const res = Loaded.flatMap( 
			input
			, (x) => ({ type: 'Loaded', tag: 'Y', value: 55 })
		)
		assert.deepEqual(
			res,
			// @ts-expect-error
			Loaded.Y(55)
		)
	}

	// now for the more likely usage of flatMap, pivoting to different states
	// from the original definition
	{
		const input = Resource.Loading(100)
		const res = Resource.flatMapLoading( 
			input
			, (x) => x == 100 ? Resource.Loaded({ id: 'cool', title: 'wow' }) : Resource.Loading(x)
		)
		assert.deepEqual(
			res,
			Resource.Loaded({ id: 'cool', title: 'wow' })
		)
	}

	{
		const input = Loaded.Y('cool')
		const res = Loaded.flatMap( 
			input
			, (x) => x == 'cool' ? Loaded.N(0) : Loaded.Y(x)
		)
		assert.deepEqual(
			res,
			Loaded.N(0)
		)
	}

})

test('readme', () => {

	const Loaded = 
		T.either("Loaded", (_: string) => _, (_: number) => _)

	const loaded = 
		Loaded.Y("Hello World")

	const loading = 
		Loaded.N(55)

	const render = (x: T.Instance<typeof Loaded>) =>
		Loaded.bifold(
			x
			, x => `Loading: ${x}%`
			, x => `Loaded: ${x}`
		)

	const transform = (x: T.Instance<typeof Loaded>) =>
		Loaded.mapY(
			x, x => x.toUpperCase()
		)

	assert.deepEqual(Loaded.mapN( loading, x => x+'%' ), {...Loaded.N(55), value: '55%' })

	assert.deepEqual(
		[ render( transform( loaded ) ) 
		, render( transform( loading ) )
		, render( loading )
		],
		[
			'Loaded: HELLO WORLD',
			'Loading: 55%',
			'Loading: 55%',
		]
	)
})


test('lift', () => {
	type File = { file_id: string, file_url: string, file_ext: string, file_upname: string }

	const FileResource = T.Resource<'FileResource', File>('FileResource')

	const fn = FileResource.lift( x => {
		return x.tag
	})

	const tag = fn(FileResource.Loading({ progress: 55 }))

	assert.equal(tag, 'Loading')
	
})