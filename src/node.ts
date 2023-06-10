import DistributionItem from './distribution-item'
import NodeInstantiation from './node-instantiation'

export default class Node {
	// /** indices of parents in the CPT */
	// parents = new Map<Node, number>()
	parents: Node[] = []
	values: string[] = []
	valueIndices = new Map<string, number>()
	cpt: number[][] = []

	constructor(public name: string, distribution: DistributionItem[]) {
		if (!name.length) throw new Error('Name must not be empty')
		if (!distribution.length) throw new Error('Must have at least 1 value')
		for (const distributionItem of distribution) {
			this.values.push(distributionItem.value)
			this.valueIndices.set(distributionItem.value, this.valueIndices.size)
			this.cpt.push([distributionItem.probability])
		}
	}

	static withUniformDistribution = (name: string, values: string[]) =>
		new Node(
			name,
			values.map(value => ({ value, probability: 1 / values.length }))
		)

	addParent = (node: Node) => {
		// this.parents.set(node, this.parents.size)
		this.parents.push(node)
		for (const row of this.cpt) {
			for (const _ of node.values) row.push(...row)
		}
	}

	normalizeCptColumn = (column: number) => {
		const sum = this.cpt.reduce((total, row) => total + row[column], 0)
		for (const row in this.cpt) this.cpt[row][column] /= sum
	}

	normalizeCpt = () => {
		for (let column = 0; column < this.cpt[0].length; column++)
			this.normalizeCptColumn(column)
	}
	randomizeCpt = () => {
		for (const [rowIndex, row] of this.cpt.entries())
			for (let column = 0; column < row.length; column++)
				this.cpt[rowIndex][column] = Math.random()
		this.normalizeCpt()
	}

	// getValueIndex = (value: string) => this.valueIndices.get(value) || new Error(`Value ${value} not in node ${this.name}`)

	getValueIndex = (value: string) => {
		let valueIndex = this.valueIndices.get(value)
		if (valueIndex === undefined)
			throw new Error(`Missing value ${value} for node ${this.name}`)
		return valueIndex
	}

	getCptColumnIndex = (parentInstantiations: NodeInstantiation[]) => {
		let cptColumn = 0
		let cptColumnsSoFar = 1
		for (const parent of this.parents) {
			// potentially speed up with a parent instantiation map
			const parentInstantiation = parentInstantiations.find(
				instantiation => instantiation.node === parent
			)
			if (parentInstantiation === undefined)
				throw new Error(`Missing instantiation for parent ${parent.name}`)
			const parentIndex = parentInstantiation.node.valueIndices.get(
				parentInstantiation.value
			)
			if (parentIndex === undefined)
				throw new Error(
					`Missing value ${parentInstantiation.value} for parent ${parent.name}`
				)
			cptColumn += parentIndex * cptColumnsSoFar
			cptColumnsSoFar *= parent.values.length
		}
		return cptColumn
	}

	getConditionalProbability = (
		value: string,
		parentInstantiations: NodeInstantiation[]
	) =>
		this.cpt[this.getValueIndex(value)][
			this.getCptColumnIndex(parentInstantiations)
		]

	setConditionalProbability = (
		value: string,
		parentInstantiations: NodeInstantiation[],
		probability: number
	) => {
		this.cpt[this.getValueIndex(value)][
			this.getCptColumnIndex(parentInstantiations)
		] = probability
	}
}
