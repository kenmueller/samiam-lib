import Tensor from '../src/tensor'
import Factor from '../src/factor'
import BeliefNetwork from '../src/belief-network'
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

test('multiply', () => {
	const ageSeverityFactor = nodeAge.factor.multiply(nodeSeverity.factor)
	expect(ageSeverityFactor.tensor.shape).toEqual([4, 5])
	expect(ageSeverityFactor.tensor.stride).toEqual([5, 1])
	expect(ageSeverityFactor.tensor.cells).toEqual([
		0.020000000000000004, 0.010000000000000002, 0.005000000000000001, 0.015,
		0.05, 0.04000000000000001, 0.04000000000000001, 0.04000000000000001,
		0.04000000000000001, 0.04000000000000001, 0.081, 0.039, 0.045, 0.066, 0.069,
		0.08000000000000002, 0.08000000000000002, 0.08000000000000002,
		0.08000000000000002, 0.08000000000000002
	])
	expect(ageSeverityFactor.tensor.string).toBe(
		'[[0.020000000000000004,0.010000000000000002,0.005000000000000001,0.015,0.05],[0.04000000000000001,0.04000000000000001,0.04000000000000001,0.04000000000000001,0.04000000000000001],[0.081,0.039,0.045,0.066,0.069],[0.08000000000000002,0.08000000000000002,0.08000000000000002,0.08000000000000002,0.08000000000000002]]'
	)
	expect(ageSeverityFactor.tensor.permute([1, 0]).string).toBe(
		'[[0.020000000000000004,0.04000000000000001,0.081,0.08000000000000002],[0.010000000000000002,0.04000000000000001,0.039,0.08000000000000002],[0.005000000000000001,0.04000000000000001,0.045,0.08000000000000002],[0.015,0.04000000000000001,0.066,0.08000000000000002],[0.05,0.04000000000000001,0.069,0.08000000000000002]]'
	)

	const nodesXYFactor = nodeX.factor.multiply(nodeY.factor)
	expect(nodeX.factor.nodes.map(node => node.name)).toStrictEqual(['X', 'Z'])
	expect(nodeX.factor.tensor.valueAt([0, 0])).toBeCloseTo(0.2)
	expect(nodeX.factor.tensor.valueAt([0, 1])).toBeCloseTo(0.3)
	expect(nodeX.factor.tensor.valueAt([1, 0])).toBeCloseTo(0.8)
	expect(nodeX.factor.tensor.valueAt([1, 1])).toBeCloseTo(0.7)
	expect(nodeY.factor.nodes.map(node => node.name)).toStrictEqual([
		'X',
		'Y',
		'Z'
	])
	expect(nodesXYFactor.nodes.map(node => node.name)).toStrictEqual([
		'X',
		'Y',
		'Z'
	])
	expect(nodesXYFactor.tensor.string).toBe(
		'[[[0.020000000000000004,0.12],[0.18000000000000002,0.18]],[[0.16000000000000003,0.48999999999999994],[0.6400000000000001,0.21]]]'
	)
})

test('sum out', () => {
	const nodesXYSumOutXFactor = nodeX.factor.multiply(nodeY.factor).sumOut(nodeX)
	expect(nodesXYSumOutXFactor.tensor.valueAt([0, 0])).toBeCloseTo(0.18)
	expect(nodesXYSumOutXFactor.tensor.valueAt([0, 1])).toBeCloseTo(0.61)
	expect(nodesXYSumOutXFactor.tensor.valueAt([1, 0])).toBeCloseTo(0.82)
	expect(nodesXYSumOutXFactor.tensor.valueAt([1, 1])).toBeCloseTo(0.39)
})

test('reduction', () => {
	initializeNetwork()

	const nodeZObservation = { node: nodeZ, value: 0 }
	const nodeXReducedFactor = nodeX.factor.reduction([nodeZObservation])
	expect(nodeXReducedFactor.nodes.map(node => node.name)).toStrictEqual([
		'X',
		'Z'
	])
	expect(nodeXReducedFactor.tensor.valueAt([0, 0])).toBeCloseTo(0.2)
	expect(nodeXReducedFactor.tensor.valueAt([0, 1])).toBeCloseTo(0)
	expect(nodeXReducedFactor.tensor.valueAt([1, 0])).toBeCloseTo(0.8)
	expect(nodeXReducedFactor.tensor.valueAt([1, 1])).toBeCloseTo(0)
	const nodeYReducedFactor = nodeY.factor.reduction([nodeZObservation])
	expect(nodeYReducedFactor.nodes.map(node => node.name)).toStrictEqual([
		'X',
		'Y',
		'Z'
	])
	expect(nodeYReducedFactor.tensor.valueAt([0, 0, 0])).toBeCloseTo(0.1)
	expect(nodeYReducedFactor.tensor.valueAt([0, 0, 1])).toBeCloseTo(0)
	expect(nodeYReducedFactor.tensor.valueAt([0, 1, 0])).toBeCloseTo(0.9)
	expect(nodeYReducedFactor.tensor.valueAt([0, 1, 1])).toBeCloseTo(0)
	expect(nodeYReducedFactor.tensor.valueAt([1, 0, 0])).toBeCloseTo(0.2)
	expect(nodeYReducedFactor.tensor.valueAt([1, 0, 1])).toBeCloseTo(0)
	expect(nodeYReducedFactor.tensor.valueAt([1, 1, 0])).toBeCloseTo(0.8)
	expect(nodeYReducedFactor.tensor.valueAt([1, 1, 1])).toBeCloseTo(0)
	// const nodesXYReducedFactor = nodeXReducedFactor.multiply(nodeYReducedFactor)
})
