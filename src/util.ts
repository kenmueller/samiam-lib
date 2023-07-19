export const isSubset = <T>(subset: T[], superset: T[]): boolean =>
	new Set([...subset, ...superset]).size === superset.length

export const pluck = <T, K extends keyof T>(objects: T[], key: K): T[K][] =>
	objects.map(object => object[key])

export const doublePluck = <T, K1 extends keyof T, K2 extends keyof T[K1]>(
	objects: T[],
	key1: K1,
	key2: K2
) => pluck(pluck(objects, key1), key2)

export const cumSum = (array: number[]) =>
	array.reduce(
		(sums: number[], x, i) => [...sums, sums.length > 0 ? x + sums[i - 1] : x],
		[]
	)

export const cumProd = (array: number[]) =>
	array.reduce(
		(sums: number[], x, i) => [...sums, sums.length > 0 ? x * sums[i - 1] : x],
		[]
	)

export const equalArrays = <T>(a: T[], b: T[]) =>
	a.length === b.length && a.every((element, index) => element === b[index])

export const equal2DArrays = <T>(a: T[][], b: T[][]) =>
	a.length === b.length &&
	a.every((element, index) => equalArrays(element, b[index]))

export const addArrays = (a: number[], b: number[]) => a.map((x, i) => x + b[i])

export const subtractArrays = (a: number[], b: number[]) =>
	a.map((x, i) => x - b[i])

export const maxArrays = (a: number[], b: number[]) =>
	a.map((x, i) => Math.max(x, b[i]))

export const pretty1dArray = <T>(a: T[]) => `[${a.join(', ')}]`

export const clone2dArray = (arr: number[][]) => arr.map(inner => inner.slice())

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

export const inlineTransposeCells = (
	array: number[][],
	i: number,
	j: number
) => {
	const temp = array[i][j]
	array[i][j] = array[j][i]
	array[j][i] = temp
}
export const inlineTranspose = (array: number[][]) => {
	for (let i = 0; i < array.length; i++)
		for (let j = i + 1; j < array[i].length; j++)
			inlineTransposeCells(array, i, j)
}
export const transpose = (array: number[][]) =>
	Array.from({ length: array[0].length }, (_row, i) =>
		Array.from({ length: array.length }, (_col, j) => array[j][i])
	)

const numDecimals = (num: number) => {
	if (Number.isInteger(num)) return 0
	const numString = num.toString()
	return numString.length - numString.indexOf('.') - 1
}

export const probComplement = (prob: number) =>
	Number((1 - prob).toFixed(numDecimals(prob)))

export const areFloatsEqual = (a: number, b: number) =>
	Math.abs(b - a) < Number.EPSILON
