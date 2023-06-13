import BeliefNetwork from '../src/belief-network'
import Node from '../src/node'

const network = new BeliefNetwork()
const nodeMedicine = Node.withUniformDistribution('medicine', network, [
	'a',
	'b',
	'c'
])
const nodeAge = Node.withUniformDistribution('age', network, [
	'kid',
	'adolescent',
	'adult',
	'old'
])
const nodeSeverity = Node.withUniformDistribution('severity', network, [
	'none',
	'little',
	'medium',
	'lot',
	'extreme'
])
const nodeOutcome = Node.withUniformDistribution('outcome', network, [
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

test('remove values', () => {})
test('remove parents', () => {})
