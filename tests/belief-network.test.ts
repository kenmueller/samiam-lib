import BeliefNetwork from '../src/belief-network'
import { NO_EVIDENCE } from '../src/evidence'
import Node from '../src/node'

let network: BeliefNetwork<Node>
let nodeAge: Node, nodeMedicine: Node, nodeSeverity: Node, nodeOutcome: Node

let networkSimple: BeliefNetwork<Node>
let nodeX: Node, nodeY: Node, nodeZ: Node

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

const initializeNetworkSimple = () => {
	networkSimple = new BeliefNetwork()

	nodeX = Node.withUniformDistribution('X', networkSimple, ['yes', 'no'])
	nodeY = Node.withUniformDistribution('Y', networkSimple, ['yes', 'no'])
	nodeZ = Node.withUniformDistribution('Z', networkSimple, ['yes', 'no'])

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
initializeNetworkSimple()

test('observational probability of evidence', () => {
	expect(
		networkSimple.probability({ observations: [], interventions: [] })
	).toBe(1)
	expect(
		networkSimple.probability({
			observations: [{ node: nodeZ, value: 0 }],
			interventions: []
		})
	).toBeCloseTo(0.6)
	expect(
		networkSimple.probability({
			observations: [{ node: nodeX, value: 0 }],
			interventions: []
		})
	).toBe(0.24)
	expect(
		networkSimple.probability({
			observations: [{ node: nodeX, value: 1 }],
			interventions: []
		})
	).toBe(0.76)
	expect(
		networkSimple.probability({
			observations: [{ node: nodeY, value: 1 }],
			interventions: []
		})
	).toBeCloseTo(0.648)
	expect(
		networkSimple.probability({
			observations: [
				{ node: nodeZ, value: 0 },
				{ node: nodeX, value: 0 }
			],
			interventions: []
		})
	).toBe(0.12)
	expect(
		networkSimple.probability({
			observations: [
				{ node: nodeX, value: 0 },
				{ node: nodeY, value: 1 }
			],
			interventions: []
		})
	).toBeCloseTo(0.18)
	expect(
		networkSimple.probability({
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
		networkSimple.probability({
			observations: [{ node: nodeY, value: 0 }],
			interventions: [{ node: nodeX, value: 0 }]
		})
	).toBeCloseTo(0.22)
	expect(
		networkSimple.probability({
			observations: [{ node: nodeY, value: 0 }],
			interventions: [{ node: nodeX, value: 1 }]
		})
	).toBeCloseTo(0.4)
	expect(
		networkSimple.probability({
			observations: [
				{ node: nodeY, value: 1 },
				{ node: nodeZ, value: 1 }
			],
			interventions: [{ node: nodeX, value: 0 }]
		})
	).toBeCloseTo(0.24)
	expect(
		networkSimple.probability({
			observations: [
				{ node: nodeX, value: 0 },
				{ node: nodeY, value: 1 }
			],
			interventions: [{ node: nodeZ, value: 0 }]
		})
	).toBeCloseTo(0.18)
	expect(
		networkSimple.probability({
			observations: [{ node: nodeY, value: 1 }],
			interventions: [
				{ node: nodeX, value: 0 },
				{ node: nodeZ, value: 0 }
			]
		})
	).toBe(0.9)
})

test('prior marginals', () => {
	expect(network.priorMarginal(nodeAge).tensor.cells).toEqual([
		0.1, 0.2, 0.3, 0.3999999999999999
	])
	expect(network.priorMarginal(nodeMedicine).tensor.cells).toEqual([
		0.8204214982343079, 0.07504296536796537, 0.10453553639772681
	])
	expect(networkSimple.priorMarginal(nodeX).tensor.cells).toEqual([0.24, 0.76])
	expect(networkSimple.priorMarginal(nodeY).tensor.cells).toEqual([
		0.352, 0.6480000000000001
	])
	expect(networkSimple.priorMarginal(nodeZ).tensor.cells).toEqual([
		0.6000000000000001, 0.39999999999999997
	])
})

test('posterior marginals', () => {
	expect(
		networkSimple.posteriorMarginal(NO_EVIDENCE, nodeX).tensor.cells
	).toEqual([0.24, 0.76])
	expect(
		networkSimple.posteriorMarginal(
			{
				observations: [{ node: nodeX, value: 0 }],
				interventions: []
			},
			nodeY
		).tensor.cells
	).toEqual([0.25000000000000006, 0.75])
})
