import BeliefNetwork from './belief-network'
import DistributionItem from './distribution-item'
import NodeInstantiation from './node-instantiation'
import {
	pluck,
	addArrays,
	normalizeDistribution,
	randomizeDistribution
} from './util'

export default class Node {
	// /** indices of parents in the CPT */
	// parents = new Map<Node, number>()
	parents: Node[] = []
	children = new Set<Node>()
	values: string[] = []
	valueIndices = new Map<string, number>()
	cpt: number[][] = [[]]

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
			this.cpt[0].push(distributionItem.probability)
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
		for (const row of this.cpt) row.push(0)
		// this.cpt.push(new Array(this.cpt[0].length).fill(0))
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
		const parentsInstantiations = this.cpt.length
		const reps = parentsInstantiations / parentPeriod
		// for (const row of this.cpt)
		for (let rep = reps - 1; rep >= 0; rep--)
			// row.splice(
			// 	rep * parentPeriod + valueIndex * prevParentsPeriod,
			// 	0,
			// 	...new Array(prevParentsPeriod).fill(1 / this.values.length)
			// )
			this.cpt.splice(
				rep * parentPeriod + valueIndex * prevParentsPeriod,
				0,
				...Array.from({ length: prevParentsPeriod }, () =>
					new Array(this.values.length).fill(1 / this.values.length)
				)
				// ...[...new Array(prevParentsPeriod)].map(() =>
				// 	new Array(this.values.length).fill(1 / this.values.length)
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
		for (const row of this.cpt) row.splice(index, 1)
		// this.cpt.splice(index, 1)
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
		const parentsInstantiations = this.cpt.length
		const reps = parentsInstantiations / parentPeriod
		// for (const row of this.cpt)
		for (let rep = reps - 1; rep >= 0; rep--)
			this.cpt.splice(
				rep * parentPeriod + valueIndex * prevParentsPeriod,
				prevParentsPeriod
			)
		// row.splice(
		// 	rep * parentPeriod + valueIndex * prevParentsPeriod,
		// 	prevParentsPeriod
		// )
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
		// this.cpt = this.cpt.map(row =>
		// 	new Array(node.values.length).fill(row).flat()
		// )
		this.cpt = Array.from({ length: node.values.length }, () =>
			this.cpt.map(row => row.slice())
		).flat()
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
		const parentsInstantiations = this.cpt.length
		const reps = parentsInstantiations / parentPeriod
		// const reps = this.cpt[0].length / parentPeriod
		for (let rep = reps - 1; rep >= 0; rep--) {
			const repIdx = rep * parentPeriod
			// for (let col = 0; col < this.values.length; col++)
			// cycle through each parent value to add probabilities to first group
			for (let parentVal = parentValues - 1; parentVal >= 1; parentVal--)
				for (let i = prevParentsPeriod - 1; i >= 0; i--)
					this.cpt[repIdx + i] = addArrays(
						this.cpt[repIdx + i],
						this.cpt[repIdx + parentVal * prevParentsPeriod + i]
					)
			// this.cpt[repIdx + i][col] +=
			// 	this.cpt[repIdx + parentVal * prevParentsPeriod + i][col]
			// probabilities have been collapsed into first group, remove other groups
			this.cpt.splice(
				repIdx + prevParentsPeriod,
				prevParentsPeriod * (parentValues - 1)
			)
		}
		this.normalizeCpt()
		this.parents.splice(parentIndex, 1)
	}

	normalizeCpt = () => {
		// for (const distribution of this.cpt) normalizeDistribution(distribution)
		this.cpt.forEach(normalizeDistribution)
	}

	randomizeCpt = () => {
		// for (const [rowIndex, row] of this.cpt.entries())
		// 	for (let column = 0; column < row.length; column++)
		// 		this.cpt[rowIndex][column] = Math.random()
		this.cpt.forEach(randomizeDistribution)
	}

	getValueIndex = (value: string) => {
		let valueIndex = this.valueIndices.get(value)
		if (valueIndex === undefined)
			throw new Error(`Missing value ${value} for node ${this.name}`)
		return valueIndex
	}

	getCptParentInstantiationIndex = (
		parentInstantiations: NodeInstantiation[]
	) => {
		let cptRow = 0
		let cptRowsSoFar = 1
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
			cptRow += parentIndex * cptRowsSoFar
			cptRowsSoFar *= parent.values.length
		}
		return cptRow
	}

	getConditionalProbability = (
		value: string,
		parentInstantiations: NodeInstantiation[]
	) =>
		this.cpt[this.getCptParentInstantiationIndex(parentInstantiations)][
			this.getValueIndex(value)
		]

	getConditionalProbabilityDistribution = (
		parentInstantiations: NodeInstantiation[]
	) => this.cpt[this.getCptParentInstantiationIndex(parentInstantiations)]
	// {
	// 	const probabilities: number[] = new Array(this.values.length)
	// 	for (let i = 0; i < this.cpt.length; i++)
	// 		probabilities[i] =
	// 			this.cpt[i][this.getCptColumnIndex(parentInstantiations)]

	// 	return probabilities
	// }

	setConditionalProbability = (
		value: string,
		parentInstantiations: NodeInstantiation[],
		probability: number
	) => {
		this.cpt[this.getCptParentInstantiationIndex(parentInstantiations)][
			this.getValueIndex(value)
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
		// could just set the CPT row to probabilities, but this avoids moving arrays
		const row =
			this.cpt[this.getCptParentInstantiationIndex(parentInstantiations)]
		for (let i = 0; i < row.length; i++) row[i] = probabilities[i]
	}

	setCpt = (probabilities: number[][]) => {
		if (this.cpt.length !== probabilities.length)
			throw new Error(
				`CPT should be size ${this.cpt.length}, not ${probabilities.length}`
			)
		if (this.cpt[0].length !== probabilities[0].length)
			throw new Error(
				`CPT should have ${this.cpt[0].length} rows, not ${probabilities[0].length}`
			)
		this.cpt = probabilities
	}

	getCptText = () => {
		const parentNames = pluck(this.parents, 'name')
		const values = this.values.map(title => title.padEnd(4, ' '))
		const parentsWidths = pluck(parentNames, 'length')
		const valuesWidths = pluck(values, 'length')
		const parentsAndValues = parentNames.concat(values)
		const widths = parentsWidths.concat(valuesWidths)
		const heading = parentsAndValues.join(' | ')
		const separator = widths.map(width => '-'.repeat(width)).join('-+-')
		const body = this.cpt
			.map(
				dist =>
					parentsWidths.map(width => ' '.repeat(width) + ' | ').join('') +
					dist
						.map((prob, i) =>
							prob.toFixed(2).toString().padEnd(valuesWidths[i])
						)
						.join(' | ')
			)
			.join('\n')
		return heading + '\n' + separator + '\n' + body
	}
}
