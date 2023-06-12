import Node from './node'

export default class BeliefNetwork {
	nodes = new Set<Node>()

	addNode = (node: Node) => {
		this.nodes.add(node)
	}
}
