// import Evidence from './evidence'
import Node from './node'
import { adjacencyListString } from './util'

export default class InteractionGraph {
	/** Each node is mapped to a set of adjacent nodes and query node indicator */
	adjacencyList: Map<Node, Set<Node>>

	constructor(
		public queryNodes: Node[],
		public intervenedNodes: Node[],
		public nonQueryIntervenedNodes: Node[]
	) {
		console.log(
			'igraph query nodes',
			queryNodes.map(n => n.name),
			'intervened nodes',
			intervenedNodes.map(n => n.name),
			'remaining nodes',
			nonQueryIntervenedNodes.map(n => n.name),
			'parents',
			[
				...new Set(
					queryNodes.concat(intervenedNodes).concat(nonQueryIntervenedNodes)
				)
			].map(n => `${n.name}: ${n.parents.map(p => p.name)}`)
		)
		this.adjacencyList = new Map<Node, Set<Node>>()
		const nonIntervenedNodes = queryNodes.concat(nonQueryIntervenedNodes)
		for (const node of nonIntervenedNodes)
			this.adjacencyList.set(node, new Set(node.parents))
		for (const node of intervenedNodes) this.adjacencyList.set(node, new Set())
		// for (const node of nonQueryIntervenedNodes)
		// 	this.adjacencyList.set(node, new Set(node.parents))
		for (const node of nonIntervenedNodes)
			for (const parent of node.parents) {
				// console.log('inner loop', node.name, parent.name)
				this.adjacencyList.get(parent)!.add(node)
			}
		console.log('adjacency list', adjacencyListString(this.adjacencyList))
	}

	// static fromEvidence = (
	// 	{ observations, interventions }: Evidence,
	// 	nodes: Node[]
	// ) => {}

	get minDegreeOrder() {
		const nodes = new Set(
			this.intervenedNodes
				.filter(node => !this.queryNodes.includes(node))
				.concat(this.nonQueryIntervenedNodes)
		)
		const pi = new Array<Node>(nodes.size)

		for (let i = 0; i < pi.length; i++) {
			// find node with smallest number of neighbors
			let minNeighborsNode
			let minNeighborsNodeNeighbors
			for (const node of nodes) {
				const neighbors = this.adjacencyList.get(node)!
				if (
					minNeighborsNode === undefined ||
					minNeighborsNodeNeighbors!.size > neighbors.size
				) {
					minNeighborsNode = node
					minNeighborsNodeNeighbors = neighbors
				}
			}

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
				const neighborNeighbors = this.adjacencyList.get(neighborsArray[i])!
				neighborNeighbors.delete(minNeighborsNode)
				for (let j = i + 1; j < neighborsArray.length; j++) {
					neighborNeighbors.add(neighborsArray[j])
					this.adjacencyList.get(neighborsArray[j])!.add(neighborsArray[i])
				}
			}
			this.adjacencyList.delete(minNeighborsNode)
			nodes.delete(minNeighborsNode)
		}

		return pi
	}
}
