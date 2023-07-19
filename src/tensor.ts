import { pretty1dArray } from './util'

declare global {
	interface Array<T> {
		toSpliced(start: number, deleteCount: number, ...args: unknown[]): Array<T>
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

	unsqueeze = (dimension: number) => {
		if (dimension < 0 || dimension > this.shape.length)
			throw new Error(
				`Can only insert a dimension between 0 and ${this._shape.length}`
			)
		const newShape = this._shape.toSpliced(dimension, 0, 1)
		return new Tensor(newShape, Tensor.calcStride(newShape), this._cells)
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
}
