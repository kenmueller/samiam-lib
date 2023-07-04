import Evidence, { NO_EVIDENCE } from './evidence'
import MapResult from './map-result'
import Node from './node'
import { pluck } from './util'

export default class BeliefNetwork<NodeLike extends Node = Node> {
	nodes = new Set<NodeLike>()
	// nodeNames = new Set<string>()

	addNode = (node: NodeLike) => {
		this.nodes.add(node)
		// this.nodeNames.add(node.name)
	}

	probability = (evidence: Evidence) => {
		return Math.random()
	}

	priorMarginal = (node: Node) => this.posteriorMarginal(NO_EVIDENCE, node)

	posteriorMarginal = (evidence: Evidence, node: Node) => {
		return node.values.map(value => Math.random())
	}

	/** returns P(mpe, e_obs | e_int), P(mpe | e_obs, e_int), list of nodes and value indices */
	mpe = (evidence: Evidence): MapResult => {
		const evidenceNodes = new Set([
			...pluck(evidence.observations, 'node'),
			...pluck(evidence.interventions, 'node')
		])
		const nonEvidenceNodes = Array.from(this.nodes).filter(
			node => !evidenceNodes.has(node)
		)
		return {
			jointProbability: Math.random(),
			condProbability: Math.random(),
			instantiations: nonEvidenceNodes.map(node => ({ node, value: 0 }))
		}
	}

	/** returns P(map, e_obs | e_int), P(map | e_obs, e_int), list of nodes and value indices */
	map = (evidence: Evidence, nodes: Node[]): MapResult => {
		return {
			jointProbability: Math.random(),
			condProbability: Math.random(),
			instantiations: nodes.map(node => ({ node, value: 0 }))
		}
	}

	get invalidNodes() {
		return Array.from(this.nodes).filter(
			node => node.invalidDistributions.length > 0
		)
	}
}
