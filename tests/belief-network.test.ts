import { sayHello } from '../src/belief-network'

test('says hello', () => {
	expect(sayHello()).toBe('Hello')
})
