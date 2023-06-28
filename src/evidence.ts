import Intervention from './intervention'
import Observation from './observation'

export default interface Evidence {
	observations: Observation[]
	interventions: Intervention[]
}

export const NO_EVIDENCE: Evidence = { observations: [], interventions: [] }
