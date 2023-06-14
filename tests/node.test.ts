import BeliefNetwork from '../src/belief-network'
import Node from '../src/node'

let network: BeliefNetwork
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
	nodeAge.setConditionalProbabilityDistribution([], [0.1, 0.2, 0.3, 0.4])
	nodeMedicine.setCpt([
		[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
		[2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0],
		[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
	])
	nodeMedicine.normalizeCpt()
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

beforeAll(initializeNetwork)

test('correct CPT sizes', () => {
	expect(nodeAge.cpt.length).toBe(4)
	expect(nodeAge.cpt[0].length).toBe(1)
	expect(nodeMedicine.cpt.length).toBe(3)
	expect(nodeMedicine.cpt[0].length).toBe(20)
	expect(nodeSeverity.cpt.length).toBe(5)
	expect(nodeSeverity.cpt[0].length).toBe(4)
	expect(nodeOutcome.cpt.length).toBe(3)
	expect(nodeOutcome.cpt[0].length).toBe(60)
})

test('randomizing CPT produces valid distributions', () => {
	expect(
		nodeOutcome.getConditionalProbability('death', [
			{ node: nodeMedicine, value: 'b' },
			{ node: nodeAge, value: 'adult' },
			{ node: nodeSeverity, value: 'lot' }
		])
	).toBe(nodeOutcome.cpt[0][42])
})
test('correct CPT index', () => {
	expect(nodeOutcome.getValueIndex('death')).toBe(0)
	expect(nodeOutcome.getValueIndex('survival')).toBe(1)
	expect(nodeOutcome.getValueIndex('thriving')).toBe(2)
	expect(
		nodeOutcome.getCptColumnIndex([
			{ node: nodeMedicine, value: 'a' },
			{ node: nodeAge, value: 'kid' },
			{ node: nodeSeverity, value: 'none' }
		])
	).toBe(0)
	expect(
		nodeOutcome.getCptColumnIndex([
			{ node: nodeMedicine, value: 'b' },
			{ node: nodeAge, value: 'adult' },
			{ node: nodeSeverity, value: 'lot' }
		])
	).toBe(42)
	expect(
		nodeOutcome.getCptColumnIndex([
			{ node: nodeMedicine, value: 'c' },
			{ node: nodeAge, value: 'old' },
			{ node: nodeSeverity, value: 'extreme' }
		])
	).toBe(59)
})
test('get and set CPT entries', () => {
	nodeOutcome.setConditionalProbability(
		'thriving',
		[
			{ node: nodeMedicine, value: 'b' },
			{ node: nodeAge, value: 'adult' },
			{ node: nodeSeverity, value: 'lot' }
		],
		0.27
	)
	expect(
		nodeOutcome.getConditionalProbability('thriving', [
			{ node: nodeMedicine, value: 'b' },
			{ node: nodeAge, value: 'adult' },
			{ node: nodeSeverity, value: 'lot' }
		])
	).toBe(nodeOutcome.cpt[2][42])
	expect(nodeOutcome.cpt[2][42]).toBe(0.27)
})

test('remove values', () => {
	initializeNetwork()
	expect(() => nodeMedicine.removeValue('advil')).toThrow(
		"Value advil doesn't exist for node medicine"
	)
	nodeMedicine.removeValue('b')
	// would be nicer with a .toBeCloseTo function for arrays
	expect(nodeMedicine.cpt).toEqual([
		[
			1 / 2,
			2 / 3,
			3 / 4,
			4 / 5,
			5 / 6,
			6 / 7,
			7 / 8,
			8 / 9,
			0.8999999999999999,
			10 / 11,
			0.9166666666666667,
			12 / 13,
			13 / 14,
			14 / 15,
			15 / 16,
			16 / 17,
			17 / 18,
			18 / 19,
			0.9500000000000001,
			20 / 21
		],
		[
			1 / 2,
			1 / 3,
			1 / 4,
			1 / 5,
			1 / 6,
			1 / 7,
			0.12500000000000003,
			1 / 9,
			0.09999999999999999,
			1 / 11,
			1 / 12,
			1 / 13,
			1 / 14,
			1 / 15,
			0.06249999999999999,
			1 / 17,
			0.05555555555555556,
			1 / 19,
			1 / 20,
			1 / 21
		]
	])
	nodeSeverity.removeValue('extreme')
	expect(nodeSeverity.cpt).toEqual([
		[0.4, 0.25, 0.27 / 0.77, 0.25],
		[0.2, 0.25, 0.13 / 0.77, 0.25],
		[0.1, 0.25, 0.15 / 0.77, 0.25],
		[0.3, 0.25, 0.22 / 0.77, 0.25]
	])
	nodeAge.removeValue('kid')
	expect(nodeAge.cpt).toEqual([[0.2 / 0.9], [0.3 / 0.9], [0.4 / 0.9]])
	nodeAge.removeValue('adult')
	expect(nodeAge.cpt).toEqual([[1 / 3], [2 / 3]])
	nodeSeverity.removeValue('little')
	nodeSeverity.removeValue('none')
	expect(nodeSeverity.cpt).toEqual([
		[0.5, 0.5],
		[0.5, 0.5]
	])
	nodeSeverity.removeValue('lot')
	expect(nodeSeverity.cpt).toEqual([[1, 1]])
	nodeOutcome.removeValue('death')
	expect(nodeOutcome.cpt).toEqual([
		[0.5, 0.5, 0.5, 0.3 / 0.8],
		[0.5, 0.5, 0.5, 0.5 / 0.8]
	])
})
test('remove parents', () => {
	initializeNetwork()
	nodeSeverity.removeParent(nodeAge)
	expect(nodeSeverity.cpt).toEqual([
		[0.21750000000000003],
		[0.15750000000000003],
		[0.15000000000000002],
		[0.77 / 4],
		[1.13 / 4]
	])
	nodeMedicine.removeParent(nodeSeverity)
	expect(nodeMedicine.cpt).toEqual([
		[
			(0.25 + 0.625 + 0.75 + 0.8125 + 0.85) / 5,
			0.8627204374572794,
			(0.5 +
				0.7 +
				0.7857142857142857 +
				0.8333333333333334 +
				0.8636363636363636) /
				5,
			(0.8 +
				0.8888888888888888 +
				0.9230769230769231 +
				0.9411764705882353 +
				0.9523809523809523) /
				5
		],
		[
			(0.5 + 0.25 + 0.16666666666666666 + 0.125 + 0.1) / 5,
			0,
			0.1756421356421356,
			0
		],
		[
			(0.25 + 0.125 + 0.08333333333333333 + 0.0625 + 0.05) / 5,
			(0.3333333333333333 +
				0.14285714285714285 +
				0.09090909090909091 +
				0.06666666666666667 +
				0.05263157894736842) /
				5,
			0.0878210678210678,
			(0.2 +
				0.1111111111111111 +
				0.07692307692307693 +
				0.058823529411764705 +
				0.047619047619047616) /
				5
		]
	])
})
