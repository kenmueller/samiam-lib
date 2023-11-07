import Evidence, { NO_EVIDENCE } from './evidence'
import Factor from './factor'
import InteractionGraph from './interaction-graph'
import MapResult from './map-result'
import Node from './node'
import { pluck } from './util'

export default class BeliefNetwork<NodeLike extends Node = Node> {
	nodes: NodeLike[] = []

	addNode = (node: NodeLike) => {
		this.nodes.push(node)
		// this.nodeNames.add(node.name)
	}

	/** returns joint marginal P(queryNodes, evidence) */
	variableElimination2 = (
		// queryNodes: Node[],
		{ observations, interventions }: Evidence,
		eliminationOrder: Node[]
	) => {
		// intervened factors have no parents and all probability mass on a single value
		let factors = this.nodes.map(node => {
			const intervention = interventions.find(int => int.node === node)
			return intervention === undefined
				? // zero out rows of factors incompatible with evidence
				  node.factor.reduction(observations)
				: node.intervenedFactor(intervention.value)
		})

		for (let i = 0; i < eliminationOrder.length; i++) {
			const node = eliminationOrder[i]

			const factorsWithNode = factors.filter(factor =>
				factor.nodes.includes(node)
			)

			const productFactor = Factor.multiplyAll(factorsWithNode)
			const sumOutFactor = productFactor.sumOut(node)

			factors = [
				...factors.filter(factor => !factorsWithNode.includes(factor)),
				sumOutFactor
			]
		}

		return Factor.multiplyAll(factors)
	}

	probability = (evidence: Evidence) => {
		// const observedNodes = observations.map(obs => obs.node)
		const intervenedNodes = evidence.interventions.map(int => int.node)
		const nonIntervenedNodes = this.nodes.filter(
			node => !intervenedNodes.includes(node)
		)

		// const { minDegreeOrder } = new InteractionGraph(
		// 	observedNodes,
		// 	intervenedNodes,
		// 	nonEvidenceNodes
		// )

		const iGraph = new InteractionGraph([], intervenedNodes, nonIntervenedNodes)
		return this.variableElimination2(evidence, iGraph.minDegreeOrder).value

		// let factors = this.nodes.map(node => {
		// 	const intervention = interventions.find(int => int.node === node)
		// 	return intervention === undefined
		// 		? node.factor
		// 		: node.intervenedFactor(intervention.value)
		// })

		// for (let i = 0; i < minDegreeOrder.length; i++) {
		// 	const node = minDegreeOrder[i]
		// 	const factorsWithNode = factors.filter(factor =>
		// 		factor.nodes.includes(node)
		// 	)

		// 	const productFactor = Factor.multiplyAll(factorsWithNode)
		// 	const sumOutFactor = productFactor.sumOut(node)

		// 	factors = [
		// 		...factors.filter(factor => !factorsWithNode.includes(factor)),
		// 		sumOutFactor
		// 	]
		// }

		// const productFactor = Factor.multiplyAll(factors)

		// const sortedEvidence = observations.toSorted((a, b) =>
		// 	Node.comparator(a.node, b.node)
		// )

		// return productFactor.tensor.valueAt(
		// 	sortedEvidence.map(({ value }) => value)
		// )
	}

	priorMarginal = (nodes: Node[]) => this.jointMarginal(NO_EVIDENCE, nodes)

	jointMarginal = (evidence: Evidence, posteriorNodes: Node[]) => {
		const intervenedNodes = evidence.interventions.map(int => int.node)
		const nonQueryIntervenedNodes = this.nodes.filter(
			node => !posteriorNodes.includes(node) && !intervenedNodes.includes(node)
		)

		const iGraph = new InteractionGraph(
			posteriorNodes,
			intervenedNodes,
			nonQueryIntervenedNodes
		)
		return this.variableElimination2(evidence, iGraph.minDegreeOrder)
	}

	posteriorMarginal = (evidence: Evidence, posteriorNodes: Node[]) =>
		this.jointMarginal(evidence, posteriorNodes).normalized

	/** returns P(mpe, e_obs | e_int), P(mpe | e_obs, e_int), list of nodes and value indices */
	mpe = (evidence: Evidence): MapResult => {
		const evidenceNodes = new Set([
			...pluck(evidence.observations, 'node'),
			...pluck(evidence.interventions, 'node')
		])

		const nonEvidenceNodes = this.nodes.filter(node => !evidenceNodes.has(node))

		const conditionalProbabilities = this.posteriorMarginal(
			evidence,
			nonEvidenceNodes
		)

		const condProbability = Math.max(...conditionalProbabilities.tensor.cells)
		const mpeIndex =
			conditionalProbabilities.tensor.cells.indexOf(condProbability)

		return {
			jointProbability: condProbability * this.probability(evidence),
			condProbability: condProbability,
			instantiations: conditionalProbabilities.nodeInstantiations(mpeIndex)
		}
	}

	/** returns P(map, e_obs | e_int), P(map | e_obs, e_int), list of nodes and value indices */
	map = (evidence: Evidence, nodes: Node[]): MapResult => {
		const conditionalProbabilities = this.posteriorMarginal(evidence, nodes)

		const condProbability = Math.max(...conditionalProbabilities.tensor.cells)
		const mpeIndex =
			conditionalProbabilities.tensor.cells.indexOf(condProbability)

		return {
			jointProbability: condProbability * this.probability(evidence),
			condProbability: condProbability,
			instantiations: conditionalProbabilities.nodeInstantiations(mpeIndex)
		}
	}

	get invalidNodes() {
		return Array.from(this.nodes).filter(
			node => node.invalidDistributions.length > 0
		)
	}
}
