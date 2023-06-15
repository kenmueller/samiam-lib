import BeliefNetwork from './belief-network'
import DistributionItem from './distribution-item'
import NodeInstantiation from './node-instantiation'

export default class Node {
	// /** indices of parents in the CPT */
	// parents = new Map<Node, number>()
	parents: Node[] = []
	children = new Set<Node>()
	values: string[] = []
	valueIndices = new Map<string, number>()
	cpt: number[][] = []

	constructor(
		public name: string,
		private network: BeliefNetwork,
		distribution: DistributionItem[]
	) {
		if (!name.length) throw new Error('Name must not be empty')
		if (network.nodeNames.has(name))
			throw new Error(`Duplicate name ${name} for node`)
		if (!distribution.length) throw new Error('Must have at least 1 value')
		for (const distributionItem of distribution) {
			this.values.push(distributionItem.value)
			this.valueIndices.set(distributionItem.value, this.valueIndices.size)
			this.cpt.push([distributionItem.probability])
		}
		network.nodes.add(this)
		network.nodeNames.add(name)
	}

	static withUniformDistribution = (
		name: string,
		network: BeliefNetwork,
		values: string[]
	) =>
		new Node(
			name,
			network,
			values.map(value => ({ value, probability: 1 / values.length }))
		)

	addValue = (value: string) => {
		if (this.values.includes(value))
			throw new Error(`Value ${value} already exists for node ${this.name}`)
		this.values.push(value)
		// add cpt entries of 0 probability for the new value
		this.cpt.push(new Array(this.cpt[0].length).fill(0))
		// no need to normalize with new entries of probability 0
		for (const child of this.children)
			child.parentValueAdded(this, this.values.length - 1)
	}

	parentValueAdded = (parent: Node, valueIndex: number) => {
		const parentIndex = this.parents.indexOf(parent)
		let prevParentsPeriod = 1
		for (let prevParentIdx = 0; prevParentIdx < parentIndex; prevParentIdx++)
			prevParentsPeriod *= this.parents[prevParentIdx].values.length
		// this CPT still represents the parent's original values (1 less than now)
		const parentPeriod = prevParentsPeriod * (parent.values.length - 1)
		const reps = this.cpt[0].length / parentPeriod
		for (const row of this.cpt)
			for (let rep = reps - 1; rep >= 0; rep--)
				row.splice(
					rep * parentPeriod + valueIndex * prevParentsPeriod,
					0,
					...new Array(prevParentsPeriod).fill(1 / this.values.length)
				)
	}

	removeValue = (value: string) => {
		if (this.values.length === 1)
			throw new Error(`Node ${this.name} only has 1 value left`)
		const index = this.values.indexOf(value)
		if (index === -1)
			throw new Error(`Value ${value} doesn't exist for node ${this.name}`)
		this.removeValueIndex(index)
	}

	removeValueIndex = (index: number) => {
		this.values.splice(index, 1)
		// remove cpt entries for row corresponding to this value
		this.cpt.splice(index, 1)
		this.normalizeCpt()
		for (const child of this.children) child.parentValueRemoved(this, index)
	}

	parentValueRemoved = (parent: Node, valueIndex: number) => {
		const parentIndex = this.parents.indexOf(parent)
		let prevParentsPeriod = 1
		for (let prevParentIdx = 0; prevParentIdx < parentIndex; prevParentIdx++)
			prevParentsPeriod *= this.parents[prevParentIdx].values.length
		// this CPT still represents the parent's original values (1 more than now)
		const parentPeriod = prevParentsPeriod * (parent.values.length + 1)
		const reps = this.cpt[0].length / parentPeriod
		for (const row of this.cpt)
			for (let rep = reps - 1; rep >= 0; rep--)
				row.splice(
					rep * parentPeriod + valueIndex * prevParentsPeriod,
					prevParentsPeriod
				)
	}

	/** assume acyclic */
	isDescendant = (possibleDescendant: Node): boolean => {
		for (const child of this.children)
			if (child === possibleDescendant) return true
			else return child.isDescendant(possibleDescendant)
		return false
	}

	addParent = (node: Node) => {
		if (this === node)
			throw new Error(`Node ${this.name} cannot be a parent of itself`)
		if (this.isDescendant(node))
			throw new Error(
				`Adding parent node ${node.name} to node ${this.name} induces a cycle`
			)
		if (this.parents.includes(node))
			throw new Error(`Node ${this.name} already has parent ${node.name}`)
		this.parents.push(node)
		node.children.add(this)
		this.cpt = this.cpt.map(row =>
			new Array(node.values.length).fill(row).flat()
		)
	}

	removeParent = (parent: Node) => {
		const index = this.parents.indexOf(parent)
		if (index === -1)
			throw new Error(`${parent.name} isn't a parent for node ${this.name}`)
		this.removeParentIndex(index)
	}

	removeParentIndex = (parentIndex: number) => {
		let prevParentsPeriod = 1
		for (let prevParentIdx = 0; prevParentIdx < parentIndex; prevParentIdx++)
			prevParentsPeriod *= this.parents[prevParentIdx].values.length
		const parentValues = this.parents[parentIndex].values.length
		const parentPeriod = prevParentsPeriod * parentValues
		// # times to collapse cells due to the remove of parent
		const reps = this.cpt[0].length / parentPeriod
		for (const row of this.cpt)
			for (let rep = reps - 1; rep >= 0; rep--) {
				const repIdx = rep * parentPeriod
				// cycle through each parent value to add probabilities to first group
				for (let parentVal = parentValues - 1; parentVal >= 1; parentVal--)
					for (let i = prevParentsPeriod - 1; i >= 0; i--)
						row[repIdx + i] += row[repIdx + parentVal * prevParentsPeriod + i]
				// probabilities have been collapsed into first group, remove other groups
				row.splice(
					repIdx + prevParentsPeriod,
					prevParentsPeriod * (parentValues - 1)
				)
			}
		this.normalizeCpt()
		this.parents.splice(parentIndex, 1)
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

	getConditionalProbabilityDistribution = (
		parentInstantiations: NodeInstantiation[]
	) => {
		const probabilities: number[] = new Array(this.values.length)
		for (let i = 0; i < this.cpt.length; i++)
			probabilities[i] =
				this.cpt[i][this.getCptColumnIndex(parentInstantiations)]

		return probabilities
	}

	setConditionalProbability = (
		value: string,
		parentInstantiations: NodeInstantiation[],
		probability: number
	) => {
		this.cpt[this.getValueIndex(value)][
			this.getCptColumnIndex(parentInstantiations)
		] = probability
	}

	setConditionalProbabilityDistribution = (
		parentInstantiations: NodeInstantiation[],
		probabilities: number[]
	) => {
		if (this.values.length !== probabilities.length)
			throw new Error(
				`Probability distribution should be size ${this.values.length}, not ${probabilities.length}`
			)
		for (let i = 0; i < this.cpt.length; i++)
			this.cpt[i][this.getCptColumnIndex(parentInstantiations)] =
				probabilities[i]
	}

	setCpt = (probabilities: number[][]) => {
		if (this.values.length !== probabilities.length)
			throw new Error(
				`CPT should be size ${this.values.length}, not ${probabilities.length}`
			)
		if (this.cpt[0].length !== probabilities[0].length)
			throw new Error(
				`CPT should have ${this.cpt[0].length} rows, not ${probabilities[0].length}`
			)
		this.cpt = probabilities
	}

	getCptText = () => {
		return JSON.stringify(this.cpt)
	}
}
