import Intervention from './intervention'
import Node from './node'
import Observation from './observation'

export default class Evidence {
	observations = new Set<Observation>()
	interventions = new Set<Intervention>()
}
