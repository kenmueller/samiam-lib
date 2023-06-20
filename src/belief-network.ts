import Node from './node'

export default class BeliefNetwork<NodeLike extends Node = Node> {
	nodes = new Set<NodeLike>()
	nodeNames = new Set<string>()

	addNode = (node: NodeLike) => {
		this.nodes.add(node)
		this.nodeNames.add(node.name)
	}
}
