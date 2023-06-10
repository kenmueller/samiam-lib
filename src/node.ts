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

	getConditionalProbability = (
		value: string,
		parentInstantiations: NodeInstantiation[]
	) => {
		let cptColumn = 0
		let cptColumnsSoFar = 1
		// const parentInstantiationMap = new Map<Node, number>()
		// const parentInstantiationMap = parentInstantiations.reduce((map, instantiation) => (map.set(instantiation.node, instantiation.node.valueIndices.get(value) || 0), map), new Map<Node, number>())
		for (const parent of this.parents) {
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
		let valueIndex = this.valueIndices.get(value)
		if (valueIndex === undefined)
			throw new Error(`Missing value ${value} for node ${this.name}`)
		return this.cpt[valueIndex][cptColumn]
		// this.parents.reduce((cptColumn, parent, index) => cptColumn + 1, 0)
		// if (!isSubset(this.parents, pluck(parentInstantiations, 'node')))
		//     throw new Error('Must include instantiations of all parents')
		// const valueIndex = this.values.indexOf(value)
	}
	// can speed up by maintaining a value to index mapping for each node
}
