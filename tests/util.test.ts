import * as util from '../src/util'

const cpt = [
	[0.1, 0.2, 0.7],
	[0.3, 0.3, 0.4],
	[0, 0, 1],
	[0.5, 0.3, 0.2]
]
test('transpose 4x3 matrix', () => {
	expect(util.transpose(cpt)).toEqual([
		[0.1, 0.3, 0, 0.5],
		[0.2, 0.3, 0, 0.3],
		[0.7, 0.4, 1, 0.2]
	])
})
test('cumulative product', () => {
	expect(util.cumProd(cpt[0])).toEqual([
		0.1, 0.020000000000000004, 0.014000000000000002
	])
	expect(util.cumProd(cpt[1])).toEqual([0.3, 0.09, 0.036])
	expect(util.cumProd(cpt[2])).toEqual([0, 0, 0])
	expect(util.cumProd(cpt[3])).toEqual([0.5, 0.15, 0.03])
})
test('probability complement', () => {
	expect(util.probComplement(0.8)).toBe(0.2)
	expect(util.probComplement(0.2)).toBe(0.8)
	expect(util.probComplement(1)).toBe(0)
	expect(util.probComplement(0)).toBe(1)
})
test('clone 2d array', () => {
	const arr = [
		[2, 3, 5],
		[7, 11, 13]
	]
	const cloned = util.clone2dArray(arr)
	expect(arr).toEqual(cloned)
	cloned[1][2] = 17
	expect(arr[1][2]).toBe(13)
	expect(cloned[1][2]).toBe(17)
})
test('product', () => {
	expect(util.product([])).toBe(1)
	expect(util.product([0])).toBe(0)
	expect(util.product([2])).toBe(2)
	expect(util.product([1, 2, 3, 4, 5, 6])).toBe(720)
	expect(util.product([0.2, 687, 0, 1, 32.45])).toBe(0)
})
test('dot product', () => {
	expect(util.dotProd([2, 3, 5], [7, 11, 13])).toBe(112)
})
