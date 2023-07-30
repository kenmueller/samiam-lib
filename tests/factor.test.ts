import Tensor from '../src/tensor'
import Factor from '../src/factor'
import BeliefNetwork from '../src/belief-network'
import Node from '../src/node'

let network: BeliefNetwork<Node>
let nodeAge: Node, nodeMedicine: Node, nodeSeverity: Node, nodeOutcome: Node

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
})
