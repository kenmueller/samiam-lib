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

// beforeAll(initializeNetwork)
initializeNetwork()

test('create invalid node', () => {
	// expect(() => Node.withUniformDistribution('', network, ['1', '2'])).toThrow(
	// 	'Name must not be empty'
	// )
	// expect(() =>
	// 	Node.withUniformDistribution('age', network, ['1', '2'])
	// ).toThrow('Another node already has name age')
	expect(() => Node.withUniformDistribution('race', network, [])).toThrow(
		'Must have at least 1 value'
	)
})

test('allow duplicate and empty names', () => {
	nodeMedicine.rename('age')
	expect(nodeMedicine.name).toBe('age')
	nodeMedicine.rename('')
	expect(nodeMedicine.name).toBe('')
})

test('rename node', () => {
	nodeMedicine.rename('medicine 3.0')
	expect(nodeMedicine.name).toBe('medicine 3.0')
	// expect(() => nodeMedicine.rename('age')).toThrow(
	// 	'Another node already has name age'
	// )
})

test('correct CPT size', () => {
	expect(nodeAge.cpt.length).toBe(1)
	expect(nodeAge.cpt[0].length).toBe(4)
	expect(nodeMedicine.cpt.length).toBe(20)
	expect(nodeMedicine.cpt[0].length).toBe(3)
	expect(nodeSeverity.cpt.length).toBe(4)
	expect(nodeSeverity.cpt[0].length).toBe(5)
	expect(nodeOutcome.cpt.length).toBe(60)
	expect(nodeOutcome.cpt[0].length).toBe(3)
})

test('randomize CPT', () => {
	expect(
		nodeOutcome.getConditionalProbability('death', [
			{ node: nodeMedicine, value: 'b' },
			{ node: nodeAge, value: 'adult' },
			{ node: nodeSeverity, value: 'lot' }
		])
	).toBe(nodeOutcome.cpt[42][0])
})
test('correct CPT index', () => {
	expect(nodeOutcome.getValueIndex('death')).toBe(0)
	expect(nodeOutcome.getValueIndex('survival')).toBe(1)
	expect(nodeOutcome.getValueIndex('thriving')).toBe(2)
	expect(
		nodeOutcome.getCptParentInstantiationIndex([
			{ node: nodeMedicine, value: 'a' },
			{ node: nodeAge, value: 'kid' },
			{ node: nodeSeverity, value: 'none' }
		])
	).toBe(0)
	expect(
		nodeOutcome.getCptParentInstantiationIndex([
			{ node: nodeMedicine, value: 'b' },
			{ node: nodeAge, value: 'adult' },
			{ node: nodeSeverity, value: 'lot' }
		])
	).toBe(42)
	expect(
		nodeOutcome.getCptParentInstantiationIndex([
			{ node: nodeMedicine, value: 'c' },
			{ node: nodeAge, value: 'old' },
			{ node: nodeSeverity, value: 'extreme' }
		])
	).toBe(59)
})

test('get and set CPT entry', () => {
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
	).toBe(nodeOutcome.cpt[42][2])
	expect(nodeOutcome.cpt[42][2]).toBe(0.27)
})

test('add value', () => {
	initializeNetwork()
	nodeSeverity.addValue('horrifying')
	expect(nodeAge.cpt.length).toBe(1)
	expect(nodeAge.cpt[0].length).toBe(4)
	expect(nodeMedicine.cpt.length).toBe(24)
	expect(nodeMedicine.cpt[0].length).toBe(3)
	expect(
		nodeMedicine.getConditionalProbabilityDistribution([
			{ node: nodeAge, value: 'adult' },
			{ node: nodeSeverity, value: 'lot' }
		])
	).toEqual([15 / 18, 2 / 18, 1 / 18])
	expect(nodeSeverity.cpt.length).toBe(4)
	expect(nodeSeverity.cpt[0].length).toBe(6)
	expect(
		nodeSeverity.getConditionalProbabilityDistribution([
			{ node: nodeAge, value: 'adolescent' }
		])
	).toEqual([0.2, 0.2, 0.2, 0.2, 0.2, 0])
	expect(nodeOutcome.cpt.length).toBe(72)
	expect(nodeOutcome.cpt[0].length).toBe(3)
	expect(
		nodeOutcome.getConditionalProbabilityDistribution([
			{ node: nodeMedicine, value: 'b' },
			{ node: nodeAge, value: 'adult' },
			{ node: nodeSeverity, value: 'lot' }
		])
	).toEqual([0.4, 0.35, 0.25])
})

test('remove value', () => {
	initializeNetwork()
	expect(() => nodeMedicine.removeValue('advil')).toThrow(
		"Value advil doesn't exist for node medicine"
	)
	nodeMedicine.removeValue('b')
	// would be nicer with a .toBeCloseTo function for arrays
	expect(nodeMedicine.cpt).toEqual([
		[0.5, 0.5],
		[0.6666666666666666, 0.3333333333333333],
		[0.75, 0.25],
		[0.8, 0.2],
		[0.8333333333333334, 0.16666666666666666],
		[0.8571428571428571, 0.14285714285714285],
		[0.875, 0.12500000000000003],
		[0.8888888888888888, 0.1111111111111111],
		[0.8999999999999999, 0.09999999999999999],
		[0.9090909090909091, 0.09090909090909091],
		[0.9166666666666667, 0.08333333333333333],
		[0.9230769230769231, 0.07692307692307693],
		[0.9285714285714286, 0.07142857142857142],
		[0.9333333333333333, 0.06666666666666667],
		[0.9375, 0.06249999999999999],
		[0.9411764705882353, 0.058823529411764705],
		[0.9444444444444444, 0.05555555555555556],
		[0.9473684210526315, 0.05263157894736842],
		[0.9500000000000001, 0.05],
		[0.9523809523809523, 0.047619047619047616]
	])
	nodeSeverity.removeValue('extreme')
	expect(nodeSeverity.cpt).toEqual([
		[0.4, 0.2, 0.1, 0.3],
		[0.25, 0.25, 0.25, 0.25],
		[0.27 / 0.77, 0.13 / 0.77, 0.15 / 0.77, 0.22 / 0.77],
		[0.25, 0.25, 0.25, 0.25]
	])
	nodeAge.removeValue('kid')
	expect(nodeAge.cpt).toEqual([[0.2 / 0.9, 0.3 / 0.9, 0.4 / 0.9]])
	nodeAge.removeValue('adult')
	expect(nodeAge.cpt).toEqual([[1 / 3, 2 / 3]])
	nodeSeverity.removeValue('little')
	nodeSeverity.removeValue('none')
	expect(nodeSeverity.cpt).toEqual([
		[0.5, 0.5],
		[0.5, 0.5]
	])
	nodeSeverity.removeValue('lot')
	expect(nodeSeverity.cpt).toEqual([[1], [1]])
	nodeOutcome.removeValue('death')
	expect(nodeOutcome.cpt).toEqual([
		[0.5, 0.5],
		[0.5, 0.5],
		[0.5, 0.5],
		[0.3 / 0.8, 0.5 / 0.8]
	])
})
test('Existing parent cannot be added', () => {
	initializeNetwork()
	expect(() => nodeOutcome.addParent(nodeAge)).toThrow(
		'Node outcome already has parent age'
	)
	expect(() => nodeOutcome.addParent(nodeMedicine)).toThrow(
		'Node outcome already has parent medicine'
	)
	expect(() => nodeOutcome.addParent(nodeSeverity)).toThrow(
		'Node outcome already has parent severity'
	)
})
test('remove parent', () => {
	initializeNetwork()
	nodeSeverity.removeParent(nodeAge)
	expect(nodeSeverity.cpt).toEqual([
		[
			0.21750000000000003,
			0.15750000000000003,
			0.15000000000000002,
			0.77 / 4,
			1.13 / 4
		]
	])
	nodeMedicine.removeParent(nodeSeverity)
})
test('maintain acyclicity', () => {
	initializeNetwork()
	expect(() => nodeAge.addParent(nodeAge)).toThrow(
		'Node age cannot be a parent of itself'
	)
	expect(nodeAge.parents).toEqual([])
	expect(() => nodeAge.addParent(nodeMedicine)).toThrow(
		'Adding parent node medicine to node age induces a cycle'
	)
	expect(() => nodeMedicine.addParent(nodeOutcome)).toThrow(
		'Adding parent node outcome to node medicine induces a cycle'
	)
	expect(() => nodeSeverity.addParent(nodeMedicine)).toThrow(
		'Adding parent node medicine to node severity induces a cycle'
	)
})
