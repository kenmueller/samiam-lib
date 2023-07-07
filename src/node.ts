import BeliefNetwork from './belief-network'
import DistributionItem from './distribution-item'
import NodeInstantiation from './node-instantiation'
import {
	pluck,
	cumProd,
	addArrays,
	normalizeDistribution,
	randomizeDistribution,
	maxArrays,
	clone2dArray,
	areFloatsEqual
} from './util'

declare global {
	interface Array<T> {
		toReversed(): Array<T>
	}
}

if (!Array.prototype.toReversed)
	Object.defineProperty(Array.prototype, 'toReversed', {
		value: function () {
			const rev = [...this]
			rev.reverse()
			return rev
		},
		enumerable: false
	})

export type Id = string | number | symbol

export default class Node {
	// /** indices of parents in the CPT */
	parents: Node[] = []
	children: Node[] = []
	values: string[] = []
	valueIndices = new Map<string, number>()
	cpt: number[][] = [[]]

	constructor(
		public id: Id,
		public name: string,
		private network: BeliefNetwork,
		distribution: DistributionItem[]
	) {
		// this.validateName(name)
		if (!distribution.length) throw new Error('Must have at least 1 value')
		for (const distributionItem of distribution) {
			this.values.push(distributionItem.value)
			this.valueIndices.set(distributionItem.value, this.valueIndices.size)
			this.cpt[0].push(distributionItem.probability)
		}
		network.addNode(this)
	}

	static withIdUniformDistribution = (
		id: Id,
		name: string,
		network: BeliefNetwork,
		values: string[]
	) =>
		new Node(
			id,
			name,
			network,
			values.map(value => ({ value, probability: 1 / values.length }))
		)

	static withUniformDistribution = (
		name: string,
		network: BeliefNetwork,
		values: string[]
	) => this.withIdUniformDistribution('', name, network, values)

	clone = (id: Id) => {
		const cloned = Node.withIdUniformDistribution(
			id,
			this.name,
			this.network,
			this.values
		)
		for (const parent of this.parents) cloned.addParent(parent)
		cloned.setCpt(clone2dArray(this.cpt))
		return cloned
	}

	remove = () => {
		for (const child of this.children) child.removeParent(this)
		for (const parent of this.parents) this.removeParent(parent)

		const thisIndex = this.network.nodes.indexOf(this)
		if (thisIndex >= 0) this.network.nodes.splice(thisIndex, 1)
	}

	validateName = (name: string) => {
		if (!name.length) throw new Error('Name must not be empty')
		// if (this.network.nodeNames.has(name))
		// 	throw new Error(`Another node already has name ${name}`)
	}

	get invalidDistributions() {
		return this.cpt.reduce(
			(distributionIndices, distribution, distributionIndex) => {
				if (
					!areFloatsEqual(
						distribution.reduce((sum, probability) => sum + probability, 0),
						1
					)
				)
					distributionIndices.push(distributionIndex)

				return distributionIndices
			},
			[] as number[]
		)
	}

	rename = (name: string) => {
		// this.validateName(name)
		// this.network.nodeNames.delete(this.name)
		// this.network.nodeNames.add(name)
		this.name = name
	}

	setValue = (index: number, value: string) => {
		this.values[index] = value
	}

	addValue = (value: string) => {
		if (this.values.includes(value))
			throw new Error(`Value ${value} already exists for node ${this.name}`)
		this.values.push(value)
		// add cpt entries of 0 probability for the new value
		for (const row of this.cpt) row.push(0)
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
		for (let rep = reps - 1; rep >= 0; rep--)
			this.cpt.splice(
				rep * parentPeriod + valueIndex * prevParentsPeriod,
				0,
				...Array.from({ length: prevParentsPeriod }, () =>
					new Array(this.values.length).fill(1 / this.values.length)
				)
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
		for (let rep = reps - 1; rep >= 0; rep--)
			this.cpt.splice(
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
			throw new Error(`${this.name} cannot be a parent of itself`)
		if (this.isDescendant(node))
			throw new Error(
				`Adding parent ${node.name} to ${this.name} induces a cycle`
			)
		if (this.parents.includes(node))
			throw new Error(`${this.name} already has parent ${node.name}`)
		this.parents.push(node)
		node.children.push(this)
		this.cpt = Array.from({ length: node.values.length }, () =>
			this.cpt.map(row => row.slice())
		).flat()
	}

	removeParent = (parent: Node) => {
		const index = this.parents.indexOf(parent)
		if (index === -1)
			throw new Error(`${parent.name} isn't a parent for ${this.name}`)
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
		for (let rep = reps - 1; rep >= 0; rep--) {
			const repIdx = rep * parentPeriod
			// cycle through each parent value to add probabilities to first group
			for (let parentVal = parentValues - 1; parentVal >= 1; parentVal--)
				for (let i = prevParentsPeriod - 1; i >= 0; i--)
					this.cpt[repIdx + i] = addArrays(
						this.cpt[repIdx + i],
						this.cpt[repIdx + parentVal * prevParentsPeriod + i]
					)
			// probabilities have been collapsed into first group, remove other groups
			this.cpt.splice(
				repIdx + prevParentsPeriod,
				prevParentsPeriod * (parentValues - 1)
			)
		}
		this.normalizeCpt()

		const childIndex = this.parents[parentIndex].children.indexOf(this)
		if (childIndex >= 0)
			this.parents[parentIndex].children.splice(childIndex, 1)

		this.parents.splice(parentIndex, 1)
	}

	normalizeCpt = () => {
		this.cpt.forEach(normalizeDistribution)
	}

	randomizeCpt = () => {
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

	setConditionalProbability = (
		value: string,
		parentInstantiations: NodeInstantiation[],
		probability: number
	) => {
		this.setConditionalProbabilityForValueIndex(
			this.getValueIndex(value),
			parentInstantiations,
			probability
		)
	}

	setConditionalProbabilityForValueIndex = (
		valueIndex: number,
		parentInstantiations: NodeInstantiation[],
		probability: number
	) => {
		this.setConditionalProbabilityCell(
			this.getCptParentInstantiationIndex(parentInstantiations),
			valueIndex,
			probability
		)
	}

	setConditionalProbabilityCell = (
		parentInstantiationIndex: number,
		valueIndex: number,
		probability: number
	) => {
		this.cpt[parentInstantiationIndex][valueIndex] = probability
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
		const parents = this.parents.toReversed()
		const parentNames = pluck(parents, 'name')
		const values = this.values.map(title => title.padEnd(4))
		const parentsNameWidths = pluck(parentNames, 'length')
		const valuesWidths = pluck(values, 'length')
		const parentsValues = pluck(parents, 'values')
		const parentsMaxValueWidths = parentsValues.map(vals =>
			Math.max(...pluck(vals, 'length'))
		)
		const parentsWidths = maxArrays(parentsNameWidths, parentsMaxValueWidths)
		const parentPeriods = pluck(parentsValues, 'length')
		const parentCumPeriods = cumProd(parentPeriods.toReversed()).reverse()
		const numParents = this.parents.length
		const widths = parentsWidths.concat(valuesWidths)
		const parentsAndValues = parentNames
			.map((name, i) => name.padEnd(parentsWidths[i]))
			.concat(values)
		const heading = parentsAndValues.join(' | ')
		const separator = widths.map(width => '-'.repeat(width)).join('-+-')
		const body = this.cpt
			.map(
				(dist, row) =>
					parentsWidths
						.map(
							(width, col) =>
								parentsValues[col][
									(col == numParents - 1
										? row
										: Math.floor(row / parentCumPeriods[col + 1])) %
										parentPeriods[col]
								].padEnd(width) + ' | '
						)
						.join('') +
					dist
						.map((prob, i) =>
							prob.toFixed(2).toString().padEnd(valuesWidths[i])
						)
						.join(' | ')
			)
			.join('\n')
		return heading + '\n' + separator + '\n' + body
	}

	getCptLatex = () => {
		const parents = this.parents.toReversed()
		const parentNames = pluck(parents, 'name')
		const parentsValues = pluck(parents, 'values')
		const parentPeriods = pluck(parentsValues, 'length')
		const parentCumPeriods = cumProd(parentPeriods.toReversed()).reverse()
		const numParents = this.parents.length
		const parentsAndValues = parentNames.concat(this.values)
		const header = `\\begin{tabular}{|${'l|'.repeat(
			parentsAndValues.length
		)}}\n\t\\hline`
		const footer = `\t\\hline\n\\end{tabular}`
		const heading = `\t${parentsAndValues.join(' & ')}\\\\\n\t\\hline`
		const body = this.cpt
			.map(
				(dist, row) =>
					'\t' +
					parentsValues
						.map(
							(values, col) =>
								values[
									(col == numParents - 1
										? row
										: Math.floor(row / parentCumPeriods[col + 1])) %
										parentPeriods[col]
								] + ' & '
						)
						.join('') +
					dist.join(' & ') +
					'\\\\'
			)
			.join('\n')
		return [header, heading, body, footer].join('\n')
	}
}
