import Vertex from './node'

export default interface DirectedGraph {
	topologicalOrder: Vertex[]

	replaceVertex: (oldVertex: Vertex, newVertex: Vertex) => void

	replaceVertices: (verticesOldToNew: Map<Vertex, Vertex>) => void

	/** Check whether adding the proposed edge would keep the graph acyclic. */
	maintainsAcyclicity: (vertex1: Vertex, vertex2: Vertex) => boolean

	vertices: Set<Vertex>

	inComing: (vertex: Vertex) => Set<Vertex>

	outGoing: (vertex: Vertex) => Set<Vertex>

	degree: (vertex: Vertex) => number

	/**
	 * Returns the number of edges entering the vertex.
	 * @precondition vertex is in the graph(tested by "equals").
	 * @param vertex- An Object which is in the graph.
	 * @return the number of edges entering the vertex.
	 */
	inDegree: (vertex: Vertex) => number

	/**
	 * Returns the number of edges leaving the vertex.
	 * @precondition vertex is in the graph(tested by "equals").
	 * @param vertex- An Object which is in the graph.
	 * @return the number of edges leaving the vertex.
	 */
	outDegree: (vertex: Vertex) => number

	/**
	 * Returns whether or not a particular edge is in the graph.
	 * The edge leaves vertex1 and enters vertex2.
	 * @precondition vertex1 and vertex2 are in the graph(tested by "equals").
	 * @param vertex1- An Object which is in the graph.
	 * @param vertex2- An Object which is in the graph.
	 * @return true if edge (vertex1,vertex2) is in the graph, false otherwise.
	 */
	containsEdge: (vertex1: Vertex, vertex2: Vertex) => boolean

	/**
	 * Returns whether or not a particular Object is a vertex in the graph.
	 * @param vertex- Any Object.
	 * @return true if vertex is in the graph(tested by "equals"), false otherwise.
	 */
	contains: (vertex: Vertex) => boolean

	/**
	 * Returns the number of vertices in the graph.
	 * @return the number of vertices in the graph.
	 */
	size: number

	numEdges: number

	/**
	 * Determines whether or not the graph is acyclic.
	 * Cycles are considered in the dirrected sense.
	 * Ex A->B,A->C,B->C is acyclic while A->B,B->C,C->A is not.
	 * It is equivalent to asking if it is a DAG.
	 * By convention the empty graph is connected.
	 * @return false if the graph contains a cycle, true otherwise.
	 */
	isAcyclic: boolean

	/**
	 * Determines whether or not the graph is weakly connected.
	 * This is the same as asking if the undirected graph produced by eliminating
	 * the directionality of the edges is connected.
	 * By convention the empty graph is connected.
	 * @return true if the graph is connected, false otherwise.
	 */
	isWeaklyConnected: boolean

	/**
	 * Determines if there is an undirected path from vertex1 to vertex2.
	 * @precondition vertex1 and vertex2 are in the graph(tested by "equals").
	 * @param vertex1- An Object which is in the graph.
	 * @param vertex2- An Object which is in the graph.
	 * @return true if there is an undirected path from vertex1 to vertex2.
	 */
	isWeaklyConnectedBetween: (vertex1: Vertex, vertex2: Vertex) => boolean

	/**
	 * Determines if there is a directed path from vertex1 to vertex2.
	 * @precondition vertex1 and vertex2 are in the graph(tested by "equals").
	 * @param vertex1- An Object which is in the graph.
	 * @param vertex2- An Object which is in the graph.
	 * @return true if there is a directed path from vertex1 to vertex2.
	 */
	hasPath: (vertex1: Vertex, vertex2: Vertex) => boolean

	/**
	 * Determines whether or not the graph is a singly connected.
	 * A singly connected digraph is a directed graph in which there is exactly one
	 * undirected path between any two vertices.
	 * By convention the empty graph is singly connected.
	 * @return true if the graph is a singly connected, false otherwise.
	 */
	isSinglyConnected: boolean

	/**
	 * Adds vertex to the graph(Optional operation). If the vertex is already a member
	 * of the graph, the graph is unchanged and the method returns false, following the
	 * Collection convention.
	 * @postcondition vertex is in the graph(as tested by "equals").
	 * @param vertex- An Object to be added as a vertex.
	 * @return true if the graph was modified(i.e. vertex was not
	 * a vertex already) false otherwise.
	 */
	addVertex: (vertex: Vertex) => boolean

	/**
	 * Removes vertex from the graph(Optional operation). If the vertex is not a member
	 * of the graph, the method returns false and leaves the graph unchanged. If the
	 * parameter is a vertex of the graph, it is removed and the method returns true.
	 * @postcondition vertex is not in the graph(as tested by "equals").
	 * @param vertex- An Object which is currently in the graph.
	 */
	removeVertex: (vertex: Vertex) => boolean

	/**
	 * Adds the directed edge to the graph(Optional operation). If either of the vertices
	 * are not in the graph, they are added, and the edge is added. If the edge was
	 * already in the graph, it returns false, otherwise it returns true.
	 * @postcondition the edge (vertex1,vertex2) is in the graph.
	 */
	addEdge: (vertex1: Vertex, vertex2: Vertex) => boolean

	/**
	 * Removes the directed edge from the graph(Optional operation). If the edge is
	 * not in the graph when the call is made, it returns false, otherwise it returns true.
	 * @postcondition the edge (vertex1,vertex2) is in the graph.
	 */
	removeEdge: (vertex1: Vertex, vertex2: Vertex) => boolean
}
