import Node from './node'
import Observation from './observation'
import Tensor from './tensor'
import { toSortedWithIndex } from './util'

export default class Factor {
	constructor(private _nodes: Node[], private _tensor: Tensor) {}

	static fromNode = (node: Node) => {
		// Node has parents in reverse order to tensors
		const nodes = [node, ...node.parents].toReversed()
		// const nodes = node.parents.concat(node)
		const shape = nodes.map(node => node.values.length)
		const cells = node.cpt.flat()
		const tensor = Tensor.withShapeAndCells(shape, cells)
		const sorted = toSortedWithIndex(nodes, Node.comparator)
		const sortedNodes = sorted.map(([node, _index]) => node)
		const sortedOrder = sorted.map(([_node, index]) => index)
		return new Factor(sortedNodes, tensor.permute(sortedOrder))
	}

	static fromIntervenedNode = (node: Node, valueIndex: number) => {
		const shape = [node.values.length]
		const cells = new Array(node.values.length).fill(0)
		cells[valueIndex] = 1
		const tensor = Tensor.withShapeAndCells(shape, cells)
		return new Factor([node], tensor)
	}

	static multiplyAll = (factors: Factor[]) =>
		factors
			.slice(1)
			.reduce((product, factor) => product.multiply(factor), factors[0])

	get nodes() {
		return this._nodes
	}
	get tensor() {
		return this._tensor
	}
	get value() {
		if (this._nodes.length > 0)
			throw new Error('Must be 0-dimensional factor to get value')
		return this._tensor.cells[0]
	}
	get normalized() {
		return new Factor(this._nodes, this._tensor.normalized)
	}

	reduction = (observationalEvidence: Observation[]) => {
		// const tensorReduction = this._tensor.clone
		const sortedObsNodes = observationalEvidence
			.map(obs => obs.node)
			.toSorted(Node.comparator)
		let obsNodesIndex = 0
		const observationalIndices = this._nodes.map(node =>
			node === sortedObsNodes[obsNodesIndex]
				? observationalEvidence[obsNodesIndex++].value
				: -1
		)
		return new Factor(this._nodes, this._tensor.reduction(observationalIndices))
	}

	multiply = (other: Factor) => {
		const nodes = Array.from(new Set(this.nodes.concat(other.nodes)))
		let sortedNodes = nodes.sort(Node.comparator)
		let thisTensor = this._tensor
		let otherTensor = other.tensor
		for (let thisI = 0, otherI = 0, i = 0; i < sortedNodes.length; i++) {
			if (this._nodes[thisI] === sortedNodes[i]) thisI++
			else thisTensor = thisTensor.unsqueeze(i)
			if (other.nodes[otherI] === sortedNodes[i]) otherI++
			else otherTensor = otherTensor.unsqueeze(i)
		}
		return new Factor(sortedNodes, thisTensor.multiply(otherTensor))
	}

	project = (nodes: Node[]) =>
		this.projectIndices(nodes.map(node => this._nodes.indexOf(node)))

	projectIndices = (indices: number[]) =>
		new Factor(
			indices.map(i => this._nodes[i]),
			this._tensor.project(indices)
		)

	sumOut = (node: Node) => this.project(this._nodes.filter(n => n !== node))
}
