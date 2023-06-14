export const isSubset = <T>(subset: T[], superset: T[]): boolean =>
	new Set([...subset, ...superset]).size === superset.length

export const pluck = <T, K extends keyof T>(objects: T[], key: K): T[K][] =>
	objects.map(object => object[key])

export const equalArrays = <T>(a: T[], b: T[]) =>
	a.length === b.length && a.every((element, index) => element === b[index])

export const equal2DArrays = <T>(a: T[][], b: T[][]) =>
	a.length === b.length &&
	a.every((element, index) => equalArrays(element, b[index]))
