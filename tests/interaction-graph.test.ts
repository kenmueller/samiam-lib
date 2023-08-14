import BeliefNetwork from '../src/belief-network'
import Node from '../src/node'
import InteractionGraph from '../src/interaction-graph'

test('min degree order 1 node', () => {
	const network = new BeliefNetwork()

	const a = Node.withUniformDistribution('a', network, ['yes', 'no'])

	expect(['a']).toEqual(
		new InteractionGraph(network.nodes).minDegreeOrder.map(n => n.name)
	)
	// console.log(new InteractionGraph(network.nodes).minDegreeOrder)
})

test('min degree order 2 nodes', () => {
	const network = new BeliefNetwork()

	const a = Node.withUniformDistribution('a', network, ['yes', 'no'])
	const b = Node.withUniformDistribution('b', network, ['yes', 'no'])

	b.addParent(a)

	expect(['a', 'b']).toEqual(
		new InteractionGraph(network.nodes).minDegreeOrder.map(n => n.name)
	)
})

test('min degree order 2 independent nodes', () => {
	const network = new BeliefNetwork()

	const a = Node.withUniformDistribution('a', network, ['yes', 'no'])
	const b = Node.withUniformDistribution('b', network, ['yes', 'no'])

	expect(['a', 'b']).toEqual(
		new InteractionGraph(network.nodes).minDegreeOrder.map(n => n.name)
	)
})

test('min degree order 3 nodes', () => {
	const network = new BeliefNetwork()

	const a = Node.withUniformDistribution('a', network, ['yes', 'no'])
	const b = Node.withUniformDistribution('b', network, ['yes', 'no'])
	const c = Node.withUniformDistribution('c', network, ['yes', 'no'])

	b.addParent(a)
	c.addParent(a)

	expect(['b', 'a', 'c']).toEqual(
		new InteractionGraph(network.nodes).minDegreeOrder.map(n => n.name)
	)
})

test('min degree order §6.6 example', () => {
	const network = new BeliefNetwork()

	const a = Node.withUniformDistribution('A', network, ['yes', 'no'])
	const b = Node.withUniformDistribution('B', network, ['yes', 'no'])
	const c = Node.withUniformDistribution('C', network, ['yes', 'no'])
	const d = Node.withUniformDistribution('D', network, ['yes', 'no'])
	const e = Node.withUniformDistribution('E', network, ['yes', 'no'])

	b.addParent(a)
	c.addParent(a)
	d.addParent(b)
	d.addParent(c)
	e.addParent(c)

	expect(['E', 'A', 'B', 'C', 'D']).toEqual(
		new InteractionGraph(network.nodes).minDegreeOrder.map(n => n.name)
	)
})
