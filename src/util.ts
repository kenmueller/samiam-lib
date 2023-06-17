export const isSubset = <T>(subset: T[], superset: T[]): boolean =>
	new Set([...subset, ...superset]).size === superset.length

export const pluck = <T, K extends keyof T>(objects: T[], key: K): T[K][] =>
	objects.map(object => object[key])

export const equalArrays = <T>(a: T[], b: T[]) =>
	a.length === b.length && a.every((element, index) => element === b[index])

export const equal2DArrays = <T>(a: T[][], b: T[][]) =>
	a.length === b.length &&
	a.every((element, index) => equalArrays(element, b[index]))

export const addArrays = (a: number[], b: number[]) => a.map((x, i) => x + b[i])

export const normalizeDistribution = (distribution: number[]) => {
	const sum = distribution.reduce((total, x) => total + x, 0)
	for (const i in distribution) distribution[i] /= sum
}

export const normalizedDistribution = (distribution: number[]) => {
	const sum = distribution.reduce((total, x) => total + x, 0)
	return distribution.map(probability => (probability /= sum))
}

export const randomizeDistribution = (distribution: number[]) => {
	for (const i of distribution) distribution[i] = Math.random()
	normalizeDistribution(distribution)
}

export const randomDistribution = (n: number) =>
	normalizedDistribution(Array.from({ length: n }, () => Math.random()))
