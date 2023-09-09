import Node from './node'

export default class InteractionGraph {
	//<NodeLike extends Node = Node> {
	/** Each node is mapped to a set of adjacent nodes and query node indicator */
	adjacencyList: Map<Node, [Set<Node>, boolean]>

	constructor(
		public queryNodes: Node[],
		public intervenedNodes: Node[],
		public nonEvidenceNodes: Node[]
	) {
		// console.log(
		// 	'igraph query nodes',
		// 	queryNodes.map(n => n.name),
		// 	'non query nodes',
		// 	nonQueryNodes.map(n => n.name)
		// )
		this.adjacencyList = new Map<Node, [Set<Node>, boolean]>()
		for (const node of queryNodes)
			this.adjacencyList.set(node, [new Set(node.parents), true])
		for (const node of intervenedNodes)
			this.adjacencyList.set(node, [new Set(), false])
		for (const node of nonEvidenceNodes)
			this.adjacencyList.set(node, [new Set(node.parents), false])
		for (const node of queryNodes.concat(nonEvidenceNodes))
			for (const parent of node.parents) {
				// console.log('inner loop', node.name, parent.name)
				this.adjacencyList.get(parent)![0].add(node)
			}
	}

	// static minDegreeNode = <NodeLike extends Node = Node>(nodes: NodeLike[]) =>
	// 	nodes.reduce((a, b) => {
	// 		const aDegree = a.parents.length + a.children.length
	// 		const bDegree = b.parents.length + b.children.length
	// 		return aDegree < bDegree ? a : b
	// 	})

	get minDegreeOrder() {
		// const nodes = this.nodes.slice()
		// const edges = new Map<NodeLike, NodeLike[]>()

		// const adjacencyList = new Map<Node, Set<Node>>()

		// edges.set(node, [
		// 	...(node.parents as NodeLike[]),
		// 	...(node.children as NodeLike[])
		// ])

		const nodes = new Set(this.nonEvidenceNodes.concat(this.intervenedNodes))
		const pi = new Array<Node>(nodes.size)

		for (let i = 0; i < pi.length; i++) {
			// find node with smallest number of neighbors
			let minNeighborsNode
			let minNeighborsNodeNeighbors
			for (const node of nodes) {
				const neighbors = this.adjacencyList.get(node)![0]
				if (
					minNeighborsNode === undefined ||
					minNeighborsNodeNeighbors!.size > neighbors.size
				) {
					minNeighborsNode = node
					minNeighborsNodeNeighbors = neighbors
				}
			}
			// let minNeighborsNode = this.nodes[i]
			// let minNeighborsNodeNeighbors = this.adjacencyList.get(minNeighborsNode)!
			// for (let j = i + 1; j < this.nodes.length; j++) {
			// 	const neighbors = this.adjacencyList.get(this.nodes[j])!
			// 	if (minNeighborsNodeNeighbors.size > neighbors.size) {
			// 		minNeighborsNodeNeighbors = neighbors
			// 		minNeighborsNode = this.nodes[j]
			// 	}
			// }
			if (
				minNeighborsNode === undefined ||
				minNeighborsNodeNeighbors === undefined
			)
				throw new Error('Somehow minNeighborsNode is undefined')
			pi[i] = minNeighborsNode

			// add edge between every pair of non-adjacent neighbors of pi[i]
			// also delete variable pi[i] from graph
			const neighborsArray = Array.from(minNeighborsNodeNeighbors)
			for (let i = 0; i < neighborsArray.length; i++) {
				const neighborNeighbors = this.adjacencyList.get(neighborsArray[i])![0]
				for (let j = i + 1; j < neighborsArray.length; j++) {
					neighborNeighbors.add(neighborsArray[j])
					this.adjacencyList.get(neighborsArray[j])![0].add(neighborsArray[i])
				}
				neighborNeighbors.delete(minNeighborsNode)
			}
			this.adjacencyList.delete(minNeighborsNode)
			nodes.delete(minNeighborsNode)

			// nodes.sort(
			// 	(a, b) => (edges.get(a)?.length ?? 0) - (edges.get(b)?.length ?? 0)
			// )

			// const node = nodes[0]

			// pi[i] = node

			// const neighbors = edges.get(node)!

			// for (const neighbor of neighbors) {
			// 	const neighborEdges = edges.get(neighbor)!

			// 	for (const otherNeighbor of neighbors) {
			// 		if (otherNeighbor === neighbor) continue
			// 		if (neighborEdges.includes(otherNeighbor)) continue

			// 		const otherNeighborEdges = edges.get(otherNeighbor)!

			// 		// Link the non-adjacent neighbors
			// 		neighborEdges.push(otherNeighbor)
			// 		otherNeighborEdges.push(neighbor)
			// 	}

			// 	// Remove any links to the node to be deleted
			// 	neighborEdges.splice(neighborEdges.indexOf(node), 1)
			// }

			// nodes.splice(nodes.indexOf(node), 1)
			// edges.delete(node)
		}

		return pi
	}
}
