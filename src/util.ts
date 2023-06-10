export const isSubset = <T>(subset: T[], superset: T[]): boolean =>
	new Set([...subset, ...superset]).size === superset.length

export const pluck = <T, K extends keyof T>(objects: T[], key: K): T[K][] =>
	objects.map(object => object[key])
