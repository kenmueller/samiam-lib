import {
	equalArrays,
	maxArrays,
	sum,
	product,
	pretty1dArray,
	sequence,
	dotProd
} from './util'

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
		// if (shape.length === 0) throw new Error('Shape must not be empty')
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

	static incompatible = (
		observationalIndices: number[],
		index: readonly number[]
	) =>
		observationalIndices.some(
			(obsIndex, i) => obsIndex !== -1 && obsIndex !== index[i]
		)

	reduction = (observationalIndices: number[]) => {
		// console.log('obs indices:', observationalIndices)
		const newShape = this._shape.slice()
		const newStride = this._stride.slice()
		const newCells = this._cells.slice()
		Tensor.forEachIndex(this._shape, index => {
			if (Tensor.incompatible(observationalIndices, index))
				newCells[Tensor.cellsIndex(this._stride, index)] = 0
		})
		return new Tensor(newShape, newStride, newCells)
	}

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

	get cells() {
		return Object.freeze(this._cells)
	}

	get clone() {
		return new Tensor(
			this._shape.slice(),
			this._stride.slice(),
			this._cells.slice()
		)
	}

	get normalized() {
		const normalizer = sum(this._cells)
		return new Tensor(
			this._shape.slice(),
			this._stride.slice(),
			this._cells.map(cell => cell / normalizer)
		)
	}

	toString() {
		return `shape: ${pretty1dArray(this._shape)}, stride: ${pretty1dArray(
			this._stride
		)}, cells: ${pretty1dArray(this._cells)}`
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
		const newStride =
			this._shape.length === 0
				? [1]
				: this._stride.toSpliced(
						dimension,
						0,
						dimension === 0
							? this._stride[0] * this._shape[0]
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

	static incrementIndex = (index: number[], shape: readonly number[]) => {
		for (let dim = index.length - 1; dim >= 0; dim--) {
			index[dim] = (index[dim] + 1) % shape[dim]
			if (index[dim] !== 0) return
		}
	}

	static forEachIndex = (
		shape: readonly number[],
		fn: (index: readonly number[], i: number) => any
	) => {
		const index = Array(shape.length).fill(0)
		const indexCount = product(shape)
		for (let i = 0; i < indexCount; i++, Tensor.incrementIndex(index, shape))
			fn(index, i)
	}

	static cellsIndex = (stride: number[], index: readonly number[]) =>
		dotProd(index, stride)

	valueAt = (index: readonly number[]) =>
		this._cells[Tensor.cellsIndex(this._stride, index)]
	setValueAt = (index: readonly number[], value: number) => {
		this._cells[Tensor.cellsIndex(this._stride, index)] = value
	}

	multiply = (other: Tensor) => {
		if (this._shape.length !== other.shape.length)
			throw new Error(
				`This tensor (${pretty1dArray(
					this.shape
				)}) must match number of dimensions of input tensor (${pretty1dArray(
					other.shape
				)})`
			)
		for (let i = 0; i < this._shape.length; i++)
			if (
				this._shape[i] > 1 &&
				other.shape[i] > 1 &&
				this._shape[i] !== other.shape[i]
			)
				throw new Error(
					`This tensor shape (${pretty1dArray(
						this.shape
					)}) must match input tensor shape (${pretty1dArray(
						other.shape
					)}) at non-singleton dimensions`
				)
		const shape = maxArrays(this._shape, other.shape)
		const cells = new Array(product(shape))
		const thisTensor = equalArrays(this._shape, shape)
			? this
			: this.expand(shape)
		const otherTensor = equalArrays(other.shape, shape)
			? other
			: other.expand(shape)
		Tensor.forEachIndex(shape, (index, i) => {
			cells[i] = thisTensor.valueAt(index) * otherTensor.valueAt(index)
		})
		return Tensor.withShapeAndCells(shape, cells)
	}

	project = (dims: number[]) => {
		if (dims.length > 0 && dims[0] < 0)
			throw new Error('Negative dimensions not allowed')
		if (dims.length > 0 && dims[dims.length - 1] >= this.shape.length)
			throw new Error(
				`Cannot project onto dimension ${
					dims[dims.length - 1]
				} as it's beyond the ${this.shape.length} dimensions of this tensor`
			)
		for (let i = 1; i < dims.length; i++)
			if (dims[i - 1] >= dims[i])
				throw new Error(
					`Dimensions to project onto must be in order, dimension ${
						dims[i - 1]
					} must be less than its following dimension ${dims[i]}`
				)
		const projectedShape = dims.map(i => this._shape[i])
		const projectedStride = Tensor.calcStride(projectedShape)
		const projectedCells = new Array(product(projectedShape)).fill(0)
		Tensor.forEachIndex(this._shape, index => {
			projectedCells[
				dotProd(
					dims.map(i => index[i]),
					projectedStride
				)
			] += this.valueAt(index)
		})
		return new Tensor(projectedShape, projectedStride, projectedCells)
	}

	indicesFromCellIndex = (cellIndex: number) => {
		let cell = cellIndex
		return this._stride.map(stride => {
			const nodeIndex = Math.floor(cell / stride)
			cell = cell % stride
			return nodeIndex
		})
	}
}
