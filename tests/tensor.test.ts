import Tensor from '../src/tensor'

const zeroDim = Tensor.withShapeAndCells([], [42]) // tensor(42)
const small = Tensor.withShapeAndCells([2, 1], [3, 5]) // tensor([[3],[5]])
const medium = Tensor.withShapeAndCells([2, 1, 3], [5, 7, 11, 13, 17, 19]) // tensor([[[5,7,11]],[[13,17,19]]])
const large = Tensor.withShapeAndCells([2, 2, 3, 4], [...Array(48).keys()]) // tensor([[[[0,1,2,3],[4,5,6,7],[8,9,10,11]],[[12,13,14,15],[16,17,18,19],[20,21,22,23]]],[[[24,25,26,27],[28,29,30,31],[32,33,34,35]],[[36,37,38,39],[40,41,42,43],[44,45,46,47]]]])

test('invalid initialization', () => {
	expect(() => Tensor.withShapeAndCells([], [])).toThrow(
		'1 cells necessary instead of 0'
	)
	expect(() => Tensor.withShapeAndCells([2], [])).toThrow(
		'2 cells necessary instead of 0'
	)
	expect(() => Tensor.withShapeAndCells([2, 3], [])).toThrow(
		'6 cells necessary instead of 0'
	)
	expect(() =>
		Tensor.withShapeAndCells([2, 3, 5], [...Array(48).keys()])
	).toThrow('30 cells necessary instead of 48')
})
test('correct strides', () => {
	expect(zeroDim.stride).toEqual([1])
	expect(small.stride).toEqual([1, 1])
	expect(medium.stride).toEqual([3, 3, 1])
	expect(large.stride).toEqual([24, 12, 4, 1])
})
test('unsqueeze', () => {
	expect(() => zeroDim.unsqueeze(1)).toThrow(
		'Can only insert a dimension between 0 and 0'
	)
	expect(zeroDim.unsqueeze(0).shape).toEqual([1])
	expect(zeroDim.unsqueeze(0).stride).toEqual([1])
	expect(small.unsqueeze(0).shape).toEqual([1, 2, 1])
	expect(small.unsqueeze(0).stride).toEqual([2, 1, 1])
	expect(small.unsqueeze(1).shape).toEqual([2, 1, 1])
	expect(small.unsqueeze(1).stride).toEqual([1, 1, 1])
	expect(small.unsqueeze(2).shape).toEqual([2, 1, 1])
	expect(small.unsqueeze(2).stride).toEqual([1, 1, 1])
	expect(medium.unsqueeze(0).shape).toEqual([1, 2, 1, 3])
	expect(medium.unsqueeze(0).stride).toEqual([6, 3, 3, 1])
	expect(medium.unsqueeze(2).shape).toEqual([2, 1, 1, 3])
	expect(medium.unsqueeze(2).stride).toEqual([3, 3, 3, 1])
	expect(medium.unsqueeze(3).shape).toEqual([2, 1, 3, 1])
	expect(medium.unsqueeze(3).stride).toEqual([3, 3, 1, 1])
	expect(large.unsqueeze(1).shape).toEqual([2, 1, 2, 3, 4])
	expect(large.unsqueeze(1).stride).toEqual([24, 24, 12, 4, 1])
	expect(large.unsqueeze(3).shape).toEqual([2, 2, 3, 1, 4])
	expect(large.unsqueeze(3).stride).toEqual([24, 12, 4, 4, 1])
})
test('expand', () => {
	expect(() => small.expand([5])).toThrow(
		'Number of sizes provided (1) must be greater or equal to the number of dimensions (2)'
	)
	expect(() => small.expand([5, 1])).toThrow(
		'Expanded size (5) must match the existing size (2) at non-singleton dimension 0. Target sizes: [5, 1].  Tensor sizes: [2, 1]'
	)
	expect(small.expand([-1, -1]).shape).toEqual([2, 1])
	expect(small.expand([-1, -1]).stride).toEqual([1, 1])
	expect(small.expand([-1, 1]).shape).toEqual([2, 1])
	expect(small.expand([-1, 1]).stride).toEqual([1, 1])
	expect(small.expand([-1, 9]).shape).toEqual([2, 9])
	expect(small.expand([-1, 9]).stride).toEqual([1, 0])
	expect(medium.expand([2, 1, 3]).shape).toEqual([2, 1, 3])
	expect(medium.expand([2, 1, 3]).stride).toEqual([3, 3, 1])
	expect(medium.expand([-1, 7, 3]).shape).toEqual([2, 7, 3])
	expect(medium.expand([-1, 7, 3]).stride).toEqual([3, 0, 1])
	expect(medium.unsqueeze(3).expand([2, 5, 3, 7]).shape).toEqual([2, 5, 3, 7])
	expect(medium.unsqueeze(3).expand([2, 5, 3, 7]).stride).toEqual([3, 0, 1, 0])
	expect(large.unsqueeze(0).expand([2, -1, -1, -1, -1]).shape).toEqual([
		2, 2, 2, 3, 4
	])
	expect(large.unsqueeze(0).expand([2, -1, -1, -1, -1]).stride).toEqual([
		0, 24, 12, 4, 1
	])
	expect(
		large.unsqueeze(3).unsqueeze(5).expand([2, 2, 3, 3, 4, 4]).shape
	).toEqual([2, 2, 3, 3, 4, 4])
	expect(
		large.unsqueeze(3).unsqueeze(5).expand([2, 2, 3, 3, 4, 4]).stride
	).toEqual([24, 12, 4, 0, 1, 0])
})
test('permute', () => {
	expect(() => small.permute([1])).toThrow(
		'Input dimensions (1) must match existing dimensions (2)'
	)
	expect(() => large.permute([0, 1, 2, 3, 4, 5])).toThrow(
		'Input dimensions (6) must match existing dimensions (4)'
	)
	expect(() => small.permute([-3, 0])).toThrow(
		'Input dimension (-3) cannot be negative'
	)
	expect(() => medium.permute([1, 2, 2])).toThrow(
		'Input dimension (0) is missing'
	)
	expect(() => large.permute([1, 2, 0, 2])).toThrow(
		'Duplicate dimension (2) is not allowed'
	)
	expect(() => large.permute([1, 2, 0, 8])).toThrow(
		'Input dimension (3) is missing'
	)
	expect(small.permute([0, 1]).string).toBe('[[3],[5]]')
	expect(small.permute([1, 0]).string).toBe('[[3,5]]')
	const mediumPermuted = medium.permute([1, 2, 0])
	expect(mediumPermuted.string).toBe('[[[5,13],[7,17],[11,19]]]')
	expect(mediumPermuted.shape).toEqual([1, 3, 2])
	expect(mediumPermuted.stride).toEqual([3, 1, 3])
})
test('unsqueeze, expand, and permute', () => {
	expect(small.permute([1, 0]).unsqueeze(1).expand([1, 3, 2]).string).toBe(
		'[[[3,5],[3,5],[3,5]]]'
	)
})
test('value at', () => {
	expect(small.valueAt([0, 0])).toBe(3)
	expect(small.valueAt([1, 0])).toBe(5)
	expect(medium.valueAt([0, 0, 0])).toBe(5)
	expect(medium.valueAt([0, 0, 1])).toBe(7)
	expect(medium.valueAt([0, 0, 2])).toBe(11)
	expect(medium.valueAt([1, 0, 0])).toBe(13)
	expect(medium.valueAt([1, 0, 1])).toBe(17)
	expect(medium.valueAt([1, 0, 2])).toBe(19)
	expect(large.valueAt([0, 0, 0, 0])).toBe(0)
	expect(large.valueAt([1, 1, 2, 3])).toBe(47)
})
test('multiply', () => {
	expect(() => small.multiply(medium)).toThrow(
		'This tensor ([2, 1]) must match number of dimensions of input tensor ([2, 1, 3])'
	)
	const result = small
		.permute([1, 0])
		.unsqueeze(1)
		.expand([1, 3, 2])
		.multiply(medium.permute([1, 2, 0]))
	expect(result.shape).toEqual([1, 3, 2])
	expect(result.stride).toEqual([6, 2, 1])
	expect(result.cells).toEqual([15, 65, 21, 85, 33, 95])
})

test('projection', () => {
	expect(() => large.project([-2, 1, 2])).toThrow(
		'Negative dimensions not allowed'
	)
	expect(() => large.project([0, 1, 6])).toThrow(
		"Cannot project onto dimension 6 as it's beyond the 4 dimensions of this tensor"
	)
	expect(() => large.project([3, 1, 2])).toThrow(
		'Dimensions to project onto must be in order, dimension 3 must be less than its following dimension 1'
	)
	const smallProjected0 = small.project([0])
	expect(smallProjected0.shape).toEqual([2])
	expect(smallProjected0.stride).toEqual([1])
	expect(smallProjected0.cells).toEqual([3, 5])
	const smallProjected1 = small.project([1])
	expect(smallProjected1.shape).toEqual([1])
	expect(smallProjected1.stride).toEqual([1])
	expect(smallProjected1.cells).toEqual([8])
	const mediumProjected1 = medium.project([1])
	expect(mediumProjected1.shape).toEqual([1])
	expect(mediumProjected1.stride).toEqual([1])
	expect(mediumProjected1.cells).toEqual([72])
	const mediumProjected02 = medium.project([0, 2])
	expect(mediumProjected02.shape).toEqual([2, 3])
	expect(mediumProjected02.stride).toEqual([3, 1])
	expect(mediumProjected02.cells).toEqual([5, 7, 11, 13, 17, 19])
	const largeProjected12 = large.project([1, 2])
	expect(largeProjected12.shape).toEqual([2, 3])
	expect(largeProjected12.stride).toEqual([3, 1])
	expect(largeProjected12.cells).toEqual([108, 140, 172, 204, 236, 268])
})
test('string', () => {
	expect(zeroDim.string).toBe('42')
	expect(small.string).toBe('[[3],[5]]')
	expect(medium.string).toBe('[[[5,7,11]],[[13,17,19]]]')
	expect(large.string).toBe(
		'[[[[0,1,2,3],[4,5,6,7],[8,9,10,11]],[[12,13,14,15],[16,17,18,19],[20,21,22,23]]],[[[24,25,26,27],[28,29,30,31],[32,33,34,35]],[[36,37,38,39],[40,41,42,43],[44,45,46,47]]]]'
	)
})
test('indices from cell index', () => {
	expect(zeroDim.indicesFromCellIndex(0)).toEqual([0])
	expect(small.indicesFromCellIndex(0)).toEqual([0, 0])
	expect(small.indicesFromCellIndex(1)).toEqual([1, 0])
	expect(medium.indicesFromCellIndex(0)).toEqual([0, 0, 0])
	expect(medium.indicesFromCellIndex(1)).toEqual([0, 0, 1])
	expect(medium.indicesFromCellIndex(2)).toEqual([0, 0, 2])
	expect(medium.indicesFromCellIndex(3)).toEqual([1, 0, 0])
	expect(medium.indicesFromCellIndex(4)).toEqual([1, 0, 1])
	expect(medium.indicesFromCellIndex(5)).toEqual([1, 0, 2])
	expect(large.indicesFromCellIndex(0)).toEqual([0, 0, 0, 0])
	expect(large.indicesFromCellIndex(2)).toEqual([0, 0, 0, 2])
	expect(large.indicesFromCellIndex(4)).toEqual([0, 0, 1, 0])
	expect(large.indicesFromCellIndex(8)).toEqual([0, 0, 2, 0])
	expect(large.indicesFromCellIndex(11)).toEqual([0, 0, 2, 3])
	expect(large.indicesFromCellIndex(12)).toEqual([0, 1, 0, 0])
	expect(large.indicesFromCellIndex(23)).toEqual([0, 1, 2, 3])
	expect(large.indicesFromCellIndex(24)).toEqual([1, 0, 0, 0])
	expect(large.indicesFromCellIndex(46)).toEqual([1, 1, 2, 2])
	expect(large.indicesFromCellIndex(47)).toEqual([1, 1, 2, 3])
})
