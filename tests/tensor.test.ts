import Tensor from '../src/tensor'

const small = Tensor.withShapeAndCells([2, 1], [3, 5]) // tensor([[3],[5]])
const medium = Tensor.withShapeAndCells([2, 1, 3], [5, 7, 11, 13, 17, 19]) // tensor([[[5,7,11]],[[13,17,19]]])
const large = Tensor.withShapeAndCells([2, 2, 3, 4], [...Array(48).keys()]) // tensor([[[[0,1,2,3],[4,5,6,7],[8,9,10,11]],[[12,13,14,15],[16,17,18,19],[20,21,22,23]]],[[[24,25,26,27],[28,29,30,31],[32,33,34,35]],[[36,37,38,39],[40,41,42,43],[44,45,46,47]]]])

test('invalid initialization', () => {
	expect(() => Tensor.withShapeAndCells([], [])).toThrow(
		'Shape must not be empty'
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
	expect(small.stride).toEqual([1, 1])
	expect(medium.stride).toEqual([3, 3, 1])
	expect(large.stride).toEqual([24, 12, 4, 1])
})
test('unsqueeze', () => {
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
