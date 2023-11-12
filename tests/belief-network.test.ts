import BeliefNetwork from '../src/belief-network'
import { NO_EVIDENCE } from '../src/evidence'
import Instantiation from '../src/instantiation'
import MapResult from '../src/map-result'
import Node from '../src/node'

let network: BeliefNetwork<Node>
let nodeAge: Node, nodeMedicine: Node, nodeSeverity: Node, nodeOutcome: Node

let networkSimpleDichotomous: BeliefNetwork<Node>
let networkSimple: BeliefNetwork<Node>
let nodeX: Node, nodeY: Node, nodeZ: Node
let nodeA: Node, nodeB: Node

const initializeNetwork = () => {
	network = new BeliefNetwork()

	nodeMedicine = Node.withUniformDistribution('medicine', network, [
		'a',
		'b',
		'c'
	])
	nodeAge = Node.withUniformDistribution('age', network, [
		'kid',
		'adolescent',
		'adult',
		'old'
	])
	nodeSeverity = Node.withUniformDistribution('severity', network, [
		'none',
		'little',
		'medium',
		'lot',
		'extreme'
	])
	nodeOutcome = Node.withUniformDistribution('outcome', network, [
		'death',
		'survival',
		'thriving'
	])
	nodeSeverity.addParent(nodeAge)
	nodeMedicine.addParent(nodeAge)
	nodeMedicine.addParent(nodeSeverity)
	nodeOutcome.addParent(nodeAge)
	nodeOutcome.addParent(nodeMedicine)
	nodeOutcome.addParent(nodeSeverity)
	// PyTorch: nodeAge = torch.tensor([.1,.2,.3,.4])
	nodeAge.setConditionalProbabilityDistribution([], [0.1, 0.2, 0.3, 0.4])
	nodeMedicine.setCpt([
		[1, 2, 1],
		[2, 0, 1],
		[3, 2, 1],
		[4, 0, 1],
		[5, 2, 1],
		[6, 0, 1],
		[7, 2, 1],
		[8, 0, 1],
		[9, 2, 1],
		[10, 0, 1],
		[11, 2, 1],
		[12, 0, 1],
		[13, 2, 1],
		[14, 0, 1],
		[15, 2, 1],
		[16, 0, 1],
		[17, 2, 1],
		[18, 0, 1],
		[19, 2, 1],
		[20, 0, 1]
	])
	nodeMedicine.normalizeCpt()
	// PyTorch: nodeSeverity = torch.tensor([[.2,.2,.2,.2,.2],[0.2, 0.1, 0.05, 0.15, 0.5],[.2,.2,.2,.2,.2],[0.27, 0.13, 0.15, 0.22, 0.23]])
	nodeSeverity.setConditionalProbabilityDistribution(
		[{ node: nodeAge, value: 'kid' }],
		[0.2, 0.1, 0.05, 0.15, 0.5]
	)
	nodeSeverity.setConditionalProbabilityDistribution(
		[{ node: nodeAge, value: 'adult' }],
		[0.27, 0.13, 0.15, 0.22, 0.23]
	)
	nodeOutcome.setConditionalProbabilityDistribution(
		[
			{ node: nodeMedicine, value: 'b' },
			{ node: nodeAge, value: 'adult' },
			{ node: nodeSeverity, value: 'lot' }
		],
		[0.4, 0.35, 0.25]
	)
	nodeOutcome.setConditionalProbabilityDistribution(
		[
			{ node: nodeMedicine, value: 'c' },
			{ node: nodeAge, value: 'old' },
			{ node: nodeSeverity, value: 'medium' }
		],
		[0.2, 0.3, 0.5]
	)
}
initializeNetwork()

const initializeNetworkSimpleDichotomous = () => {
	networkSimpleDichotomous = new BeliefNetwork()

	nodeX = Node.withUniformDistribution('X', networkSimpleDichotomous, [
		'yes',
		'no'
	])
	nodeY = Node.withUniformDistribution('Y', networkSimpleDichotomous, [
		'yes',
		'no'
	])
	nodeZ = Node.withUniformDistribution('Z', networkSimpleDichotomous, [
		'yes',
		'no'
	])

	nodeX.addParent(nodeZ)
	nodeY.addParent(nodeX)
	nodeY.addParent(nodeZ)

	nodeX.setCpt([
		[0.2, 0.8],
		[0.3, 0.7]
	])
	nodeZ.setCpt([[0.6, 0.4]])
	nodeY.setCpt([
		[0.1, 0.9],
		[0.2, 0.8],
		[0.4, 0.6],
		[0.7, 0.3]
	])
}
initializeNetworkSimpleDichotomous()

const initializeNetworkSimple = () => {
	networkSimple = new BeliefNetwork()

	nodeA = Node.withUniformDistribution('A', networkSimple, [
		'yes',
		'no'
		// 'maybe'
	])
	nodeA.addValue('maybe')
	nodeB = Node.withUniformDistribution('B', networkSimple, ['yes', 'no'])

	nodeB.addParent(nodeA)

	nodeA.setCpt([[0.2, 0.3, 0.5]])
	nodeB.setCpt([
		[0.1, 0.9],
		[0.4, 0.6],
		[0.7, 0.3]
	])
}
initializeNetworkSimple()

test('trivial probability of evidence', () => {
	expect(networkSimple.probability(NO_EVIDENCE)).toBe(1)
	expect(networkSimpleDichotomous.probability(NO_EVIDENCE)).toBe(1)
})

test('observational probability of evidence', () => {
	expect(
		networkSimpleDichotomous.probability({
			observations: [{ node: nodeZ, value: 0 }],
			interventions: []
		})
	).toBeCloseTo(0.6)
	expect(
		networkSimpleDichotomous.probability({
			observations: [{ node: nodeX, value: 0 }],
			interventions: []
		})
	).toBe(0.24)
	expect(
		networkSimpleDichotomous.probability({
			observations: [{ node: nodeX, value: 1 }],
			interventions: []
		})
	).toBe(0.76)
	expect(
		networkSimpleDichotomous.probability({
			observations: [{ node: nodeY, value: 1 }],
			interventions: []
		})
	).toBeCloseTo(0.648)
	expect(
		networkSimpleDichotomous.probability({
			observations: [
				{ node: nodeZ, value: 0 },
				{ node: nodeX, value: 0 }
			],
			interventions: []
		})
	).toBe(0.12)
	expect(
		networkSimpleDichotomous.probability({
			observations: [
				{ node: nodeX, value: 0 },
				{ node: nodeY, value: 1 }
			],
			interventions: []
		})
	).toBeCloseTo(0.18)
	expect(
		networkSimpleDichotomous.probability({
			observations: [
				{ node: nodeX, value: 0 },
				{ node: nodeY, value: 1 },
				{ node: nodeZ, value: 1 }
			],
			interventions: []
		})
	).toBe(0.072)
})

test('interventional probability of evidence', () => {
	expect(
		networkSimpleDichotomous.probability({
			observations: [{ node: nodeY, value: 0 }],
			interventions: [{ node: nodeX, value: 0 }]
		})
	).toBeCloseTo(0.22)
	expect(
		networkSimpleDichotomous.probability({
			observations: [{ node: nodeY, value: 0 }],
			interventions: [{ node: nodeX, value: 1 }]
		})
	).toBeCloseTo(0.4)
	expect(
		networkSimpleDichotomous.probability({
			observations: [
				{ node: nodeY, value: 1 },
				{ node: nodeZ, value: 1 }
			],
			interventions: [{ node: nodeX, value: 0 }]
		})
	).toBeCloseTo(0.24)
	expect(
		networkSimpleDichotomous.probability({
			observations: [
				{ node: nodeX, value: 0 },
				{ node: nodeY, value: 1 }
			],
			interventions: [{ node: nodeZ, value: 0 }]
		})
	).toBeCloseTo(0.18)
	expect(
		networkSimpleDichotomous.probability({
			observations: [{ node: nodeY, value: 1 }],
			interventions: [
				{ node: nodeX, value: 0 },
				{ node: nodeZ, value: 0 }
			]
		})
	).toBe(0.9)
})

test('prior marginals', () => {
	expect(network.priorMarginal([nodeAge]).tensor.cells).toEqual([
		0.1, 0.2, 0.3, 0.3999999999999999
	])
	expect(network.priorMarginal([nodeMedicine]).tensor.cells).toEqual([
		0.8204214982343079, 0.07504296536796537, 0.10453553639772681
	])
	expect(networkSimpleDichotomous.priorMarginal([nodeX]).tensor.cells).toEqual([
		0.24, 0.76
	])
	expect(networkSimpleDichotomous.priorMarginal([nodeY]).tensor.cells).toEqual([
		0.352, 0.6480000000000001
	])
	expect(networkSimpleDichotomous.priorMarginal([nodeZ]).tensor.cells).toEqual([
		0.6000000000000001, 0.39999999999999997
	])
})

test('posterior marginals', () => {
	expect(
		networkSimpleDichotomous.posteriorMarginal(NO_EVIDENCE, [nodeX]).tensor
			.cells
	).toEqual([0.24, 0.76])
	expect(
		networkSimpleDichotomous.posteriorMarginal(
			{
				observations: [{ node: nodeX, value: 0 }],
				interventions: []
			},
			[nodeY]
		).tensor.cells
	).toEqual([0.25000000000000006, 0.75])
})

const withNodeNames = (instantiations: Instantiation[]) =>
	instantiations.map(inst => ({
		node: inst.node.name,
		value: inst.value
	}))

test('mpe', () => {
	let result = networkSimpleDichotomous.mpe(NO_EVIDENCE)
	expect(result.jointProbability).toBeCloseTo(0.384)
	expect(result.condProbability).toBeCloseTo(0.384)
	expect(withNodeNames(result.instantiations)).toEqual([
		{ node: 'X', value: 1 },
		{ node: 'Y', value: 1 },
		{ node: 'Z', value: 0 }
	])

	result = networkSimpleDichotomous.mpe({
		observations: [
			{ node: nodeX, value: 0 },
			{ node: nodeY, value: 1 },
			{ node: nodeZ, value: 0 }
		],
		interventions: []
	})
	expect(result.jointProbability).toBeCloseTo(0.108)
	expect(result.condProbability).toBeCloseTo(1)
	expect(result.instantiations).toEqual([])

	result = networkSimpleDichotomous.mpe({
		observations: [
			{ node: nodeX, value: 1 },
			{ node: nodeZ, value: 0 }
		],
		interventions: []
	})
	expect(result.jointProbability).toBeCloseTo(0.384)
	expect(result.condProbability).toBeCloseTo(0.8)
	expect(withNodeNames(result.instantiations)).toEqual([
		{ node: 'Y', value: 1 }
	])

	result = networkSimpleDichotomous.mpe({
		observations: [{ node: nodeX, value: 0 }],
		interventions: []
	})
	expect(result.jointProbability).toBeCloseTo(0.108)
	expect(result.condProbability).toBeCloseTo(0.45)
	expect(withNodeNames(result.instantiations)).toEqual([
		{ node: 'Y', value: 1 },
		{ node: 'Z', value: 0 }
	])

	result = networkSimpleDichotomous.mpe({
		observations: [],
		interventions: [{ node: nodeX, value: 0 }]
	})
	expect(result.jointProbability).toBeCloseTo(0.54)
	expect(result.condProbability).toBeCloseTo(0.54)
	expect(withNodeNames(result.instantiations)).toEqual([
		{ node: 'Y', value: 1 },
		{ node: 'Z', value: 0 }
	])
})

test('map', () => {
	let result: MapResult

	result = networkSimpleDichotomous.map(
		{
			observations: [{ node: nodeX, value: 0 }],
			interventions: []
		},
		[nodeZ]
	)

	expect(result.jointProbability).toBeCloseTo(0.12)
	expect(result.condProbability).toBeCloseTo(0.5)
	expect(withNodeNames(result.instantiations)).toEqual([
		{ node: 'Z', value: 0 }
	])

	result = network.map(
		{
			observations: [{ node: nodeMedicine, value: 0 }],
			interventions: []
		},
		[nodeAge]
	)

	expect(result.jointProbability).toBeCloseTo(0.36)
	expect(result.condProbability).toBeCloseTo(0.44)
	expect(withNodeNames(result.instantiations)).toEqual([
		{ node: 'age', value: 3 }
	])

	result = network.map(
		{
			observations: [{ node: nodeMedicine, value: 0 }],
			interventions: [{ node: nodeAge, value: 1 }]
		},
		[nodeOutcome]
	)

	expect(result.jointProbability).toBeCloseTo(0.29)
	expect(result.condProbability).toBeCloseTo(0.33)
	expect(withNodeNames(result.instantiations)).toEqual([
		{ node: 'outcome', value: 0 }
	])

	result = network.map(
		{
			observations: [],
			interventions: []
		},
		[nodeAge, nodeMedicine, nodeOutcome]
	)

	expect(result.jointProbability).toBeCloseTo(0.12)
	expect(result.condProbability).toBeCloseTo(0.12)
	expect(withNodeNames(result.instantiations)).toEqual([
		{ node: 'age', value: 3 },
		{ node: 'medicine', value: 0 },
		{ node: 'outcome', value: 0 }
	])

	result = network.map(
		{
			observations: [],
			interventions: [{ node: nodeMedicine, value: 0 }]
		},
		[nodeOutcome]
	)

	expect(result.jointProbability).toBeCloseTo(0.33)
	expect(result.condProbability).toBeCloseTo(0.33)
	expect(withNodeNames(result.instantiations)).toEqual([
		{ node: 'outcome', value: 0 }
	])
})
