export interface Node {
  id: string;
  x: number;
  y: number;
}

export interface Edge {
  id: string;
  from: string;
  to: string;
  weight: number;
}

export type InputMode = 'node' | 'edge' | 'select';

export interface LogEntry {
  timestamp: number;
  type: string;
  message: string;
}

export interface TraversalState {
  visitedNodes: Set<string>;
  visitedEdges: Set<string>;
  currentNode: string | null;
  distances: Record<string, number>;
  isRunning: boolean;
  algorithmName: string | null;
  path: string[];
}
