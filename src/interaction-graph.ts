import Node from './node'

export default class InteractionGraph<NodeLike extends Node = Node> {
	constructor(public nodes: NodeLike[]) {}

	static minDegreeNode = <NodeLike extends Node = Node>(nodes: NodeLike[]) =>
		nodes.reduce((a, b) => {
			const aDegree = a.parents.length + a.children.length
			const bDegree = b.parents.length + b.children.length
			return aDegree < bDegree ? a : b
		})

	get minDegreeOrder() {
		const nodes = this.nodes.slice()
		const edges = new Map<NodeLike, NodeLike[]>()

		for (const node of nodes)
			edges.set(node, [
				...(node.parents as NodeLike[]),
				...(node.children as NodeLike[])
			])

		const pi = new Array<NodeLike>(nodes.length)

		for (let i = 0; i < pi.length; i++) {
			nodes.sort(
				(a, b) => (edges.get(a)?.length ?? 0) - (edges.get(b)?.length ?? 0)
			)

			const node = nodes[0]

			pi[i] = node

			const neighbors = edges.get(node)!

			for (const neighbor of neighbors) {
				const neighborEdges = edges.get(neighbor)!

				for (const otherNeighbor of neighbors) {
					if (otherNeighbor === neighbor) continue
					if (neighborEdges.includes(otherNeighbor)) continue

					const otherNeighborEdges = edges.get(otherNeighbor)!

					// Link the non-adjacent neighbors
					neighborEdges.push(otherNeighbor)
					otherNeighborEdges.push(neighbor)
				}

				// Remove any links to the node to be deleted
				neighborEdges.splice(neighborEdges.indexOf(node), 1)
			}

			nodes.splice(nodes.indexOf(node), 1)
			edges.delete(node)
		}

		return pi
	}
}
