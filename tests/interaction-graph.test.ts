import BeliefNetwork from '../src/belief-network'
import Node from '../src/node'
import InteractionGraph from '../src/interaction-graph'

test('minDegreeOrder 1 node', () => {
	const network = new BeliefNetwork()

	const a = Node.withUniformDistribution('a', network, ['yes', 'no'])

	expect([[a]]).toContainEqual(
		new InteractionGraph(network.nodes).minDegreeOrder
	)
})

test('minDegreeOrder 2 nodes', () => {
	const network = new BeliefNetwork()

	const a = Node.withUniformDistribution('a', network, ['yes', 'no'])
	const b = Node.withUniformDistribution('b', network, ['yes', 'no'])

	b.addParent(a)

	expect([
		[a, b],
		[b, a]
	]).toContainEqual(new InteractionGraph(network.nodes).minDegreeOrder)
})

test('minDegreeOrder 3 nodes', () => {
	const network = new BeliefNetwork()

	const a = Node.withUniformDistribution('a', network, ['yes', 'no'])
	const b = Node.withUniformDistribution('b', network, ['yes', 'no'])
	const c = Node.withUniformDistribution('c', network, ['yes', 'no'])

	b.addParent(a)
	c.addParent(b)

	expect([
		[a, b, c],
		[a, c, b],
		[c, a, b],
		[c, b, a]
	]).toContainEqual(new InteractionGraph(network.nodes).minDegreeOrder)
})
