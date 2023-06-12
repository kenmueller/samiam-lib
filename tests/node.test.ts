import Node from '../src/node'

const nodeMedicine = Node.withUniformDistribution('medicine', ['a', 'b', 'c'])
const nodeAge = Node.withUniformDistribution('age', [
	'kid',
	'adolescent',
	'adult',
	'old'
])
const nodeSeverity = Node.withUniformDistribution('severity', [
	'none',
	'little',
	'medium',
	'lot',
	'extreme'
])
const nodeOutcome = Node.withUniformDistribution('outcome', [
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
