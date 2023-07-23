import { pluck, pretty1dArray, sequence } from './util'

declare global {
	interface Array<T> {
		toSpliced(start: number, deleteCount: number, ...args: unknown[]): Array<T>
		toSorted(): Array<T>
	}
}

if (!Array.prototype.toSpliced)
	Object.defineProperty(Array.prototype, 'toSpliced', {
		value: function (start: number, deleteCount: number, ...args: unknown[]) {
			const toSplice = [...this]
			toSplice.splice(start, deleteCount, ...args)
			return toSplice
		},
		enumerable: false
	})

if (!Array.prototype.toSorted)
	Object.defineProperty(Array.prototype, 'toSorted', {
		value: function () {
			const toSort = [...this]
			toSort.sort()
			return toSort
		},
		enumerable: false
	})

export default class Tensor {
	constructor(
		private _shape: number[],
		private _stride: number[],
		private _cells: number[]
	) {}

	static validate = (shape: number[], cells: number[]) => {
		if (shape.length === 0) throw new Error('Shape must not be empty')
		const requiredCells = shape.reduce((cells, dim) => cells * dim, 1)
		if (requiredCells !== cells.length)
			throw new Error(
				`${requiredCells} cells necessary instead of ${cells.length}`
			)
	}

	static withShapeAndCells = (shape: number[], cells: number[]) => {
		this.validate(shape, cells)
		return new Tensor(shape, this.calcStride(shape), cells)
	}

	// static withMultiDimArray = (cells: )

	static calcStride = (shape: number[]) =>
		shape
			.slice(1)
			.reduceRight((stride, dim) => [dim * stride[0], ...stride], [1])

	get shape() {
		return Object.freeze(this._shape)
	}

	get stride() {
		return Object.freeze(this._stride)
	}

	subTensorString = (depth: number, cellsIndex: number): string =>
		depth === this._shape.length
			? this._cells[cellsIndex].toString()
			: `[${sequence(this._shape[depth])
					.map(i =>
						this.subTensorString(
							depth + 1,
							i * this._stride[depth] + cellsIndex
						)
					)
					.join(',')}]`

	get string() {
		return this.subTensorString(0, 0)
	}

	unsqueeze = (dimension: number) => {
		if (dimension < 0 || dimension > this.shape.length)
			throw new Error(
				`Can only insert a dimension between 0 and ${this._shape.length}`
			)
		const newShape = this._shape.toSpliced(dimension, 0, 1)
		const newStride = this._stride.toSpliced(
			dimension,
			0,
			dimension === 0
				? this._shape.length === 0
					? 1
					: this._stride[0] * this._shape[0]
				: this._stride[dimension - 1]
		)
		return new Tensor(newShape, newStride, this._cells)
	}

	expand = (sizes: number[]) => {
		if (sizes.length < this._shape.length)
			throw new Error(
				`Number of sizes provided (${sizes.length}) must be greater or equal to the number of dimensions (${this._shape.length})`
			)
		for (let i = 0; i < this._shape.length; i++) {
			if (sizes[i] !== -1 && this._shape[i] > 1 && sizes[i] !== this._shape[i])
				throw new Error(
					`Expanded size (${sizes[i]}) must match the existing size (${
						this._shape[i]
					}) at non-singleton dimension ${i}. Target sizes: ${pretty1dArray(
						sizes
					)}.  Tensor sizes: ${pretty1dArray(this._shape)}`
				)
		}
		const newShape = this._shape.slice()
		const newStride = this._stride.slice()
		for (let i = 0; i < newShape.length; i++)
			if (newShape[i] === 1 && sizes[i] > 1) {
				newShape[i] = sizes[i]
				newStride[i] = 0
			}
		return new Tensor(newShape, newStride, this._cells)
	}

	permute = (dimensions: number[]) => {
		if (dimensions.length !== this._shape.length)
			throw new Error(
				`Input dimensions (${dimensions.length}) must match existing dimensions (${this._shape.length})`
			)
		const sortedDimensions = dimensions.toSorted()
		if (sortedDimensions[0] < 0)
			throw new Error(
				`Input dimension (${sortedDimensions[0]}) cannot be negative`
			)
		else if (sortedDimensions[0] > 0)
			throw new Error('Input dimension (0) is missing')
		for (let i = 1; i < sortedDimensions.length; i++)
			if (sortedDimensions[i] < i)
				throw new Error(
					`Duplicate dimension (${sortedDimensions[i]}) is not allowed`
				)
			else if (sortedDimensions[i] > i)
				throw new Error(
					`Input dimension (${sortedDimensions[i - 1] + 1}) is missing`
				)
		const newShape = dimensions.map(i => this._shape[i])
		const newStride = dimensions.map(i => this._stride[i])
		return new Tensor(newShape, newStride, this._cells)
	}
}
