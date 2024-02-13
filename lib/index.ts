type Definition = Record<string, (v: any) => any>
export type Constructors<N extends string, D extends Definition> = {
	[R in keyof D]: {
		(value: Parameters<D[R]>[0]): {
			type: N
			tag: R
			value: Parameters<D[R]>[0]
		}
	}
}
export type MatchOptions<D extends Definition, T> = {
	[R in keyof D]: {
		(value: Parameters<D[R]>[0]): T
	}
}
export type CoreAPI<N extends string, D extends Definition> = {
	type: N
	tags: (keyof D)[]
	definition: { [R in keyof D]: D[R] }
	patterns: { [R in keyof D]: string[] }
	match: <T>(
		instance: InternalInstance<N, D, keyof D>,
		options: MatchOptions<D, T>,
	) => T
	def: <T>(
		fn: (x: InternalInstance<N, D, keyof D>) => T,
	) => (x: InternalInstance<N, D, keyof D>) => T
}
export type API<N extends string, D extends Definition> = CoreAPI<N, D> &
	Constructors<N, D> &
	UseIs<N, D> &
	UseGet<N, D> &
	UseGetDefault<N, D> &
	UseGetNull<N, D> &
	UseMap<N, D> &
	UseFlatMap<N, D> &
	Otherwise<D>

export type EitherApi<Name extends string, Yes, No> = API<
	Name,
	{ Y: (_: Yes) => any; N: (_: No) => any }
> & {
	encase<T>(
		fn: (value: T) => Yes,
	): (
		value: T,
	) => InternalInstance<
		Name,
		{ Y: (_: Yes) => any; N: (_: No) => any },
		'Y' | 'N'
	>
	get<T>(
		instance: InternalInstance<
			Name,
			{ Y: (_: Yes) => any; N: (_: No) => any },
			'Y' | 'N'
		>,
		defaultValue: T,
		visitor: (x: Yes) => T,
	): T
	get<T>(
		instance: InternalInstance<
			Name,
			{ Y: (_: Yes) => any; N: (_: No) => any },
			'Y' | 'N'
		>,
		defaultValue: T,
	): T | Yes
	bifold<T>(
		instance: InternalInstance<
			Name,
			{ Y: (_: Yes) => any; N: (_: No) => any },
			'Y' | 'N'
		>,
		noVisitor: (x: No) => T,
		yesVisitor: (x: Yes) => T,
	): T
	// map<T>(
	// 	instance: InternalInstance<
	// 		Name,
	// 		{ Y: (_: Yes) => any; N: (_: No) => any },
	// 		'Y' | 'N'
	// 	>,
	// 	yesVisitor: (x: Yes) => T,
	// ): InternalInstance<
	// 	Name,
	// 	{ Y: (_: Yes) => any; N: (_: No) => any },
	// 	'Y' | 'N'
	// >

	map: API<Name, { Y: (_: Yes) => any; N: (_: No) => any }>['mapY']

	flatMap: API<Name, { Y: (_: Yes) => any; N: (_: No) => any }>['flatMapY']
}

type InternalInstance<
	N extends string,
	D extends Definition,
	K extends keyof D,
> = ReturnType<Constructors<N, D>[K]>

function match(instance: any, options: any): any {
	return options[instance.tag](instance.value)
}

function def(fn: any): any {
	return (x: any) => fn(x)
}

function otherwise(tags: string[]) {
	return (fn: any) => Object.fromEntries(tags.map((tag) => [tag, fn]))
}

export function type<N extends string, D extends Definition>(
	type: N,
	definition: D,
): API<N, D> {
	const tags = Object.keys(definition)
	const api: any = {
		type,
		tags,
		patterns: {},
		definition,
		match,
		def,
		otherwise: (tagNames = tags) => otherwise(tagNames),
	}

	for (const tag of Object.keys(definition)) {
		api[tag] = (value: any = {}) => {
			return { type, tag, value }
		}

		api[`is${tag}`] = (v: any) => v.tag === tag
		api[`get${tag}`] = (v: any, fallback: any, f: any) => {
			if (f) {
				return v.tag === tag ? f(v.value) : fallback ?? null
			}
			return v.tag === tag ? v.value : fallback ?? null
		}
		api[`map${tag}`] = (v: any, f: any) => {
			return v.tag === tag ? { ...v, value: f(v.value) } : v ?? null
		}
		api[`flatMap${tag}`] = (v: any, f: any) => {
			return v.tag === tag ? f(v.value) : v ?? null
		}
	}
	return api
}

export type Value<A> =
	A extends API<any, any>
		? Instance<A>['value']
		: A extends Instance<any>
			? A['value']
			: A extends (x: any) => any
				? Parameters<A>[0]
				: never

export type Tag<A> =
	A extends API<any, any>
		? Instance<A>['tag']
		: A extends Instance<any>
			? A['tag']
			: never

export type IsTemplate<R extends string> = `is${R}`

export type GetTemplate<R extends string> = `get${R}`

export type MapTemplate<R extends string> = `map${R}`

export type FlatMapTemplate<R extends string> = `flatMap${R}`

type Otherwise<D extends Definition> = {
	otherwise: <T, R extends Partial<keyof D>>(
		tags?: R[],
	) => (fn: () => T) => {
		[k in R]: () => T
	}
}

export type UseIs<N extends string, D extends Definition> = {
	[Key in keyof D as IsTemplate<Key extends string ? Key : never>]: (
		value: InternalInstance<N, D, keyof D>,
	) => boolean
}

export type UseMap<N extends string, D extends Definition> = {
	[Key in keyof D as MapTemplate<Key extends string ? Key : never>]: <T>(
		value: InternalInstance<N, D, keyof D>,
		visitor: (value: InternalValue<D[Key]>) => T,
	) => Instance<API<N, Omit<D, Key> & Record<Key, (_: T) => any>>>
}

export type UseFlatMap<N extends string, D extends Definition> = {
	[Key in keyof D as FlatMapTemplate<Key extends string ? Key : never>]: <T>(
		value: InternalInstance<N, D, keyof D>,
		visitor: (
			value: InternalValue<D[Key]>,
		) => Instance<API<N, Omit<D, Key> & Record<Key, (_: T) => any>>>,
	) => Instance<API<N, Omit<D, Key> & Record<Key, (_: T) => any>>>
}

export type UseGet<N extends string, D extends Definition> = {
	[Key in keyof D as GetTemplate<Key extends string ? Key : never>]: <T>(
		value: InternalInstance<N, D, keyof D>,
		fallback: T,
		visitor: (value: InternalValue<D[Key]>) => T,
	) => T
}

export type UseGetDefault<N extends string, D extends Definition> = {
	[Key in keyof D as GetTemplate<Key extends string ? Key : never>]: <T>(
		value: InternalInstance<N, D, keyof D>,
		fallback: T,
	) => T | InternalInstance<N, D, keyof D>['value']
}

export type UseGetNull<N extends string, D extends Definition> = {
	[Key in keyof D as GetTemplate<Key extends string ? Key : never>]: (
		value: InternalInstance<N, D, keyof D>,
	) => null | InternalInstance<N, D, keyof D>['value']
}

type InternalValue<I extends (v: any) => any> = Parameters<I>[0]

export type Instance<A extends CoreAPI<any, any>> = InternalInstance<
	A['type'],
	A['definition'],
	keyof A['definition']
>

export function either<Name extends string, Yes, No>(
	name: Name,
	yes: (_: Yes) => any,
	no: (_: No) => any = () => ({}),
): EitherApi<Name, Yes, No> {
	const api = type(name, {
		Y: yes,
		N: no,
	})

	function encase(fn: any) {
		return (value: any) => {
			try {
				return api.Y(fn(value))
			} catch (error) {
				return api.N(error as No)
			}
		}
	}

	;(api as any).encase = encase
	;(api as any).get = api.getY
	;(api as any).bifold = (instance: any, noFunction: any, yesFunction: any) =>
		api.match(instance, {
			Y: yesFunction,
			N: noFunction,
		})
	;(api as any).map = api.mapY
	;(api as any).flatMap = api.flatMapY
	return api as EitherApi<Name, Yes, No>
}


export function maybe<Name extends string, Yes>(
	name: Name,
	yes: (_: Yes) => any
) {
	return either(name, yes) as any as EitherApi<Name, Yes, Record<string, never>> 
}

export function Resource<Name extends string, Value extends any>(name: Name) {
	const Resource = type(name, {
		Loading: (_: { progress?: number }) => _,
		Loaded: (_: Value) => _,
		Error: (_: Error) => _,
		Empty: (_: Record<string, never>) => _,
	})

	return Resource
}
