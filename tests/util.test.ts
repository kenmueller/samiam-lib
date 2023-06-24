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
