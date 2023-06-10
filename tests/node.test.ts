import Node from '../src/node'
import NodeInstantiation from '../src/node-instantiation'

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
	// expect(sayHello()).toBe('Hello')
})
