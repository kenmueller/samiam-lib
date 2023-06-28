import Instantiation from './instantiation'

export default interface MapResult {
	jointProbability: number
	condProbability: number
	instantiations: Instantiation[]
}
