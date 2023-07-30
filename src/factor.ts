import Node from './node'
import Tensor from './tensor'
import { toSortedWithIndex } from './util'

export default class Factor {
	constructor(private _nodes: Node[], private _tensor: Tensor) {}

	static fromNode = (node: Node) => {
		const nodes = node.parents.concat(node)
		const shape = nodes.map(node => node.values.length)
		const cells = node.cpt.flat()
		const tensor = Tensor.withShapeAndCells(shape, cells)
		const sorted = toSortedWithIndex(nodes, Node.comparator)
		const sortedNodes = sorted.map(([node, _index]) => node)
		const sortedOrder = sorted.map(([_node, index]) => index)
		return new Factor(sortedNodes, tensor.permute(sortedOrder))
	}

	get nodes() {
		return this._nodes
	}
	get tensor() {
		return this._tensor
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
}
