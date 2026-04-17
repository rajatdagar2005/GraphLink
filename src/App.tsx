// /**
//  * @license
//  * SPDX-License-Identifier: Apache-2.0
//  */

// import React, { useState, useRef, useEffect, useCallback } from 'react';
// import { 
//   Plus, 
//   MousePointer2, 
//   GitCommitHorizontal, 
//   Play, 
//   RefreshCcw, 
//   Trash2, 
//   Settings2, 
//   HelpCircle, 
//   Download,
//   Terminal,
//   Info
// } from 'lucide-react';
// import { motion, AnimatePresence } from 'motion/react';
// import { Node, Edge, InputMode, LogEntry, TraversalState } from './types';

// export default function App() {
//   // Graph State
//   const [nodes, setNodes] = useState<Node[]>([]);
//   const [edges, setEdges] = useState<Edge[]>([]);
//   const [inputMode, setInputMode] = useState<InputMode>('node');
//   const [isDirected, setIsDirected] = useState(false);
//   const [nextEdgeWeight, setNextEdgeWeight] = useState(1);
  
//   // Interaction State
//   const [sourceNodeId, setSourceNodeId] = useState<string | null>(null);
//   const [targetNodeId, setTargetNodeId] = useState<string | null>(null);
//   const [pendingEdgeStartId, setPendingEdgeStartId] = useState<string | null>(null);
//   const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
//   const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  
//   // Traversal/Algorithm State
//   const [traversal, setTraversal] = useState<TraversalState>({
//     visitedNodes: new Set(),
//     visitedEdges: new Set(),
//     currentNode: null,
//     distances: {},
//     isRunning: false,
//     algorithmName: null,
//     path: []
//   });
  
//   // Logs
//   const [logs, setLogs] = useState<LogEntry[]>([]);
//   const logEndRef = useRef<HTMLDivElement>(null);

//   // Refs for tracking
//   const canvasRef = useRef<HTMLDivElement>(null);
//   const startTimeRef = useRef<number>(Date.now());

//   // --- Utilities ---
  
//   const addLog = useCallback((type: string, message: string) => {
//     setLogs(prev => [
//       {
//         timestamp: Date.now() - startTimeRef.current,
//         type,
//         message
//       },
//       ...prev
//     ].slice(0, 50));
//   }, []);

//   const resetTraversal = useCallback(() => {
//     setTraversal({
//       visitedNodes: new Set(),
//       visitedEdges: new Set(),
//       currentNode: null,
//       distances: {},
//       isRunning: false,
//       algorithmName: null,
//       path: []
//     });
//   }, []);

//   const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

//   // --- Graph Handlers ---

//   const handleCanvasClick = (e: React.MouseEvent) => {
//     if (traversal.isRunning) return;
//     if (inputMode !== 'node') return;
//     if (draggingNodeId) return;

//     const rect = canvasRef.current?.getBoundingClientRect();
//     if (!rect) return;

//     const x = e.clientX - rect.left;
//     const y = e.clientY - rect.top;

//     // Check for collisions
//     const collision = nodes.some(n => Math.hypot(n.x - x, n.y - y) < 60);
//     if (collision) return;

//     const newNodeId = String.fromCharCode(65 + nodes.length); // Use A, B, C...
//     const newNode: Node = { id: newNodeId, x, y };

//     setNodes(prev => [...prev, newNode]);
//     addLog('INIT', `Added node ${newNodeId}`);
//     if (!sourceNodeId) setSourceNodeId(newNodeId);
//   };

//   const handleNodeClick = (e: React.MouseEvent, nodeId: string) => {
//     e.stopPropagation();
//     if (traversal.isRunning) return;

//     if (inputMode === 'edge') {
//       if (!pendingEdgeStartId) {
//         setPendingEdgeStartId(nodeId);
//         addLog('SELECT', `Selected source ${nodeId} for edge`);
//       } else if (pendingEdgeStartId !== nodeId) {
//         // Create edge
//         const edgeId = `${pendingEdgeStartId}-${nodeId}`;
//         const exists = edges.some(e => 
//           (e.from === pendingEdgeStartId && e.to === nodeId) || 
//           (!isDirected && e.from === nodeId && e.to === pendingEdgeStartId)
//         );

//         if (!exists) {
//           const newEdge: Edge = { id: edgeId, from: pendingEdgeStartId, to: nodeId, weight: nextEdgeWeight };
//           setEdges(prev => [...prev, newEdge]);
//           addLog('EDGE', `Connected ${pendingEdgeStartId} to ${nodeId} (w: ${nextEdgeWeight})`);
//         }
//         setPendingEdgeStartId(null);
//       } else {
//         setPendingEdgeStartId(null);
//       }
//     } else {
//       if (!sourceNodeId || (sourceNodeId && targetNodeId)) {
//         setSourceNodeId(nodeId);
//         setTargetNodeId(null);
//         addLog('SOURCE', `Node ${nodeId} set as source`);
//       } else if (sourceNodeId === nodeId) {
//         setSourceNodeId(null);
//       } else {
//         setTargetNodeId(nodeId);
//         addLog('TARGET', `Node ${nodeId} set as target`);
//       }
//     }
//   };

//   const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
//     if (traversal.isRunning || inputMode !== 'select') return;
//     setDraggingNodeId(nodeId);
//   };

//   const handleMouseMove = (e: React.MouseEvent) => {
//     if (!draggingNodeId || !canvasRef.current) return;

//     const rect = canvasRef.current.getBoundingClientRect();
//     const x = e.clientX - rect.left;
//     const y = e.clientY - rect.top;

//     setNodes(prev => prev.map(n => n.id === draggingNodeId ? { ...n, x, y } : n));
//   };

//   const handleMouseUp = () => {
//     setDraggingNodeId(null);
//   };

//   const resetGraph = () => {
//     if (traversal.isRunning) return;
//     setNodes([]);
//     setEdges([]);
//     setSourceNodeId(null);
//     setTargetNodeId(null);
//     resetTraversal();
//     setLogs([]);
//     addLog('RESET', 'Graph cleared');
//   };

//   // --- Algorithms ---

//   const getNeighbors = (nodeId: string) => {
//     const neighbors: {id: string, edgeId: string, weight: number}[] = [];
//     edges.forEach(e => {
//       if (e.from === nodeId) neighbors.push({id: e.to, edgeId: e.id, weight: e.weight});
//       else if (!isDirected && e.to === nodeId) neighbors.push({id: e.from, edgeId: e.id, weight: e.weight});
//     });
//     return neighbors;
//   };

//   const runBFS = async (startId: string) => {
//     resetTraversal();
//     setTraversal(prev => ({ ...prev, isRunning: true, algorithmName: 'BFS' }));
//     addLog('BFS', `Starting BFS from ${startId}`);

//     const queue: string[] = [startId];
//     const visited = new Set<string>();
//     const visitedEdges = new Set<string>();

//     while (queue.length > 0) {
//       const current = queue.shift()!;
//       if (visited.has(current)) continue;

//       visited.add(current);
//       setTraversal(prev => ({ 
//         ...prev, 
//         currentNode: current, 
//         visitedNodes: new Set(visited),
//         visitedEdges: new Set(visitedEdges)
//       }));
//       addLog('VISITING', `Node ${current}`);
//       await sleep(800);

//       const neighbors = getNeighbors(current);
//       for (const neighbor of neighbors) {
//         if (!visited.has(neighbor.id)) {
//           visitedEdges.add(neighbor.edgeId);
//           queue.push(neighbor.id);
//         }
//       }
//     }

//     setTraversal(prev => ({ ...prev, isRunning: false, currentNode: null }));
//     addLog('COMPLETE', 'BFS Traversal finished');
//   };

//   const runDFS = async (startId: string) => {
//     resetTraversal();
//     setTraversal(prev => ({ ...prev, isRunning: true, algorithmName: 'DFS' }));
//     addLog('DFS', `Starting DFS from ${startId}`);

//     const visited = new Set<string>();
//     const visitedEdges = new Set<string>();

//     const dfs = async (nodeId: string) => {
//       if (visited.has(nodeId)) return;
      
//       visited.add(nodeId);
//       setTraversal(prev => ({ 
//         ...prev, 
//         currentNode: nodeId, 
//         visitedNodes: new Set(visited),
//         visitedEdges: new Set(visitedEdges)
//       }));
//       addLog('VISITING', `Node ${nodeId}`);
//       await sleep(800);

//       const neighbors = getNeighbors(nodeId);
//       for (const neighbor of neighbors) {
//         if (!visited.has(neighbor.id)) {
//           visitedEdges.add(neighbor.edgeId);
//           await dfs(neighbor.id);
//         }
//       }
//     };

//     await dfs(startId);
//     setTraversal(prev => ({ ...prev, isRunning: false, currentNode: null }));
//     addLog('COMPLETE', 'DFS Traversal finished');
//   };

//   const runDijkstra = async (startId: string, endId: string) => {
//     resetTraversal();
//     setTraversal(prev => ({ ...prev, isRunning: true, algorithmName: 'Dijkstra' }));
//     addLog('DIJKSTRA', `Finding path from ${startId} to ${endId}`);

//     const dist: Record<string, number> = {};
//     const prevNode: Record<string, string | null> = {};
//     const unvisited = new Set<string>();

//     nodes.forEach(n => {
//       dist[n.id] = Infinity;
//       prevNode[n.id] = null;
//       unvisited.add(n.id);
//     });

//     dist[startId] = 0;

//     while (unvisited.size > 0) {
//       // Find unvisited node with smallest distance
//       let current: string | null = null;
//       let minDist = Infinity;
//       unvisited.forEach(nodeId => {
//         if (dist[nodeId] < minDist) {
//           minDist = dist[nodeId];
//           current = nodeId;
//         }
//       });

//       if (current === null || current === endId) break;

//       unvisited.delete(current);
//       setTraversal(prev => ({ ...prev, currentNode: current, distances: { ...dist }, visitedNodes: new Set(nodes.filter(n => !unvisited.has(n.id)).map(n => n.id)) }));
//       addLog('CURRENT', `Analyzing ${current} (dist: ${dist[current]})`);
//       await sleep(600);

//       const neighbors = getNeighbors(current);
//       for (const neighbor of neighbors) {
//         if (!unvisited.has(neighbor.id)) continue;

//         const newDist = dist[current] + neighbor.weight;
//         if (newDist < dist[neighbor.id]) {
//           dist[neighbor.id] = newDist;
//           prevNode[neighbor.id] = current;
//           addLog('RELAX', `New path to ${neighbor.id} via ${current} (w: ${newDist})`);
//           setTraversal(prev => ({ ...prev, distances: { ...dist } }));
//           await sleep(300);
//         }
//       }
//     }

//     // Reconstruction
//     const path: string[] = [];
//     if (dist[endId] !== Infinity) {
//       let temp: string | null = endId;
//       while (temp !== null) {
//         path.unshift(temp);
//         temp = prevNode[temp];
//       }
//     }

//     if (dist[endId] === Infinity) {
//       addLog('ERROR', `No path found from ${startId} to ${endId}`);
//     } else {
//       setTraversal(prev => ({ ...prev, path }));
//       addLog('COMPLETE', 'Path found!');
//       addLog('PATH', `Shortest path: ${path.join(' -> ')} (Cost: ${dist[endId]})`);
//     }

//     setTraversal(prev => ({ ...prev, isRunning: false, currentNode: null }));
//   };

//   const stopSimulation = () => {
//     resetTraversal();
//     addLog('STOP', 'Simulation stopped by user');
//   };

//   // --- Render Helpers ---

//   const getNodeStyle = (node: Node) => {
//     const isCurrent = traversal.currentNode === node.id;
//     const isVisited = traversal.visitedNodes.has(node.id);
//     const isInPath = traversal.path.includes(node.id);
//     const isSource = sourceNodeId === node.id;
//     const isTarget = targetNodeId === node.id;
//     const isPendingEdge = pendingEdgeStartId === node.id;
    
//     return {
//       left: node.x,
//       top: node.y,
//       borderColor: isCurrent ? 'var(--accent-purple)' : isPendingEdge ? 'white' : isSource ? 'var(--accent-blue)' : isTarget ? 'var(--accent-purple)' : isVisited ? 'var(--accent-green)' : 'var(--accent-blue)',
//       backgroundColor: isCurrent ? 'var(--accent-purple)' : isVisited ? 'var(--accent-green)' : 'var(--node-bg)',
//       boxShadow: isCurrent ? '0 0 15px var(--accent-purple)' : (isSource || isTarget || isPendingEdge) ? '0 0 10px var(--accent-blue)' : '0 4px 12px rgba(0,0,0,0.3)',
//       transform: 'translate(-50%, -50%)',
//       zIndex: isCurrent ? 50 : 10
//     };
//   };

//   const getEdgeStyle = (edge: Edge) => {
//     const fromNode = nodes.find(n => n.id === edge.from);
//     const toNode = nodes.find(n => n.id === edge.to);
//     if (!fromNode || !toNode) return {};

//     const dx = toNode.x - fromNode.x;
//     const dy = toNode.y - fromNode.y;
//     const length = Math.sqrt(dx * dx + dy * dy);
//     const angle = Math.atan2(dy, dx) * (180 / Math.PI);

//     const isVisited = traversal.visitedEdges.has(edge.id);
//     const isInPath = traversal.path.length > 1 &&
//       traversal.path.some((nodeId, idx) => {
//         if (idx === 0) return false;
//         const prev = traversal.path[idx - 1];
//         return (prev === edge.from && nodeId === edge.to) || 
//                (!isDirected && prev === edge.to && nodeId === edge.from);
//       });

//     const height = isInPath ? 3 : 2;

//     return {
//       left: fromNode.x,
//       top: fromNode.y - height / 2,
//       width: length,
//       transform: `rotate(${angle}deg)`,
//       transformOrigin: '0 50%',
//       backgroundColor: isInPath ? 'var(--accent-blue)' : isVisited ? 'var(--accent-green)' : 'var(--border-color)',
//       height: `${height}px`,
//       boxShadow: isInPath ? '0 0 8px var(--accent-blue)' : 'none',
//       zIndex: isInPath ? 5 : 1,
//       borderRadius: '2px'
//     };
//   };

//   return (
//     <div className="flex flex-col h-screen select-none">
//       {/* Header */}
//       <header className="h-[56px] bg-[var(--panel-bg)] border-b border-[var(--border-color)] flex items-center justify-between px-5 z-20">
//         <div className="flex items-center gap-2 text-lg font-bold tracking-tight">
//           <GitCommitHorizontal className="text-[var(--accent-blue)]" />
//           Graph<span className="text-[var(--accent-blue)]">Link</span> Pro
//         </div>
//         <div className="flex gap-3">
//           <button className="btn !bg-transparent flex items-center gap-2">
//             <HelpCircle size={16} /> Help
//           </button>
//           <button className="btn btn-primary flex items-center gap-2">
//             <Download size={16} /> Export Image
//           </button>
//         </div>
//       </header>

//       {/* Main Layout */}
//       <div className="flex-1 grid grid-cols-[280px_1fr_260px] min-h-0 overflow-hidden bg-[var(--bg-dark)]">
        
//         {/* Left Sidebar: Controls */}
//         <aside className="sidebar border-r h-full overflow-hidden flex flex-col">
//           <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-6 scrollbar-hide min-h-0">
//             <div className="panel-section">
//               <div className="panel-title">Interaction Mode</div>
//               <div className="grid grid-cols-3 gap-2">
//                 <button 
//                   className={`btn flex flex-col items-center gap-1 ${inputMode === 'node' ? 'btn-active' : ''}`}
//                   onClick={() => { setInputMode('node'); setPendingEdgeStartId(null); }}
//                 >
//                   <Plus size={16} />
//                   <span className="text-[10px]">Node</span>
//                 </button>
//                 <button 
//                   className={`btn flex flex-col items-center gap-1 ${inputMode === 'edge' ? 'btn-active' : ''}`}
//                   onClick={() => { setInputMode('edge'); setPendingEdgeStartId(null); }}
//                 >
//                   <GitCommitHorizontal size={16} />
//                   <span className="text-[10px]">Edge</span>
//                 </button>
//                 <button 
//                   className={`btn flex flex-col items-center gap-1 ${inputMode === 'select' ? 'btn-active' : ''}`}
//                   onClick={() => { setInputMode('select'); setPendingEdgeStartId(null); }}
//                 >
//                   <MousePointer2 size={16} />
//                   <span className="text-[10px]">Drag</span>
//                 </button>
//               </div>
//             </div>

//             <div className="panel-section">
//               <div className="panel-title">Edge Properties</div>
//               <div className="bg-black/20 p-3 rounded-lg border border-[var(--border-color)]">
//                 <div className="flex flex-col gap-2">
//                   <div className="flex items-center justify-between">
//                     <span className="text-xs text-[var(--text-muted)]">Next Weight</span>
//                     <input 
//                       type="number" 
//                       min="1" 
//                       max="99"
//                       value={nextEdgeWeight}
//                       onChange={(e) => setNextEdgeWeight(parseInt(e.target.value) || 1)}
//                       className="w-12 bg-[var(--node-bg)] border border-[var(--border-color)] text-xs text-center rounded outline-none focus:border-[var(--accent-blue)]"
//                     />
//                   </div>
//                   <div className="flex items-center justify-between">
//                     <span className="text-xs text-[var(--text-muted)]">Directed</span>
//                     <button 
//                       className={`text-xs font-semibold ${isDirected ? 'text-[var(--accent-blue)]' : 'text-[var(--text-muted)]'}`}
//                       onClick={() => setIsDirected(!isDirected)}
//                     >
//                       {isDirected ? 'YES' : 'NO'}
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="panel-section">
//               <div className="panel-title">Selection</div>
//               <div className="bg-black/20 p-3 rounded-lg border border-[var(--border-color)]">
//                 <div className="grid grid-cols-2 gap-3">
//                   <div className="flex flex-col gap-1">
//                     <span className="text-[10px] uppercase text-[var(--text-muted)]">Source</span>
//                     <div className="text-xs font-mono font-bold text-[var(--accent-blue)]">
//                       {sourceNodeId || 'None'}
//                     </div>
//                   </div>
//                   <div className="flex flex-col gap-1">
//                     <span className="text-[10px] uppercase text-[var(--text-muted)]">Target</span>
//                     <div className="text-xs font-mono font-bold text-[var(--accent-purple)]">
//                       {targetNodeId || 'None'}
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="panel-section">
//               <div className="panel-title">Execution</div>
//               <div className="flex flex-col gap-2">
//                 <div className="grid grid-cols-2 gap-2">
//                   <button 
//                     className="btn flex items-center justify-center gap-2"
//                     onClick={() => sourceNodeId && runBFS(sourceNodeId)}
//                     disabled={!sourceNodeId || traversal.isRunning}
//                   >
//                     <Play size={14} /> BFS
//                   </button>
//                   <button 
//                     className="btn flex items-center justify-center gap-2"
//                     onClick={() => sourceNodeId && runDFS(sourceNodeId)}
//                     disabled={!sourceNodeId || traversal.isRunning}
//                   >
//                     <Play size={14} /> DFS
//                   </button>
//                 </div>
//                 <button 
//                   className="btn btn-primary w-full flex items-center justify-center gap-2 py-3"
//                   onClick={() => {
//                     if (nodes.length < 2 || !sourceNodeId || !targetNodeId) return;
//                     runDijkstra(sourceNodeId, targetNodeId);
//                   }}
//                   disabled={!sourceNodeId || !targetNodeId || traversal.isRunning}
//                 >
//                   <Settings2 size={16} /> Dijkstra's Path
//                 </button>
//               </div>
//             </div>
//           </div>

//           <div className="flex flex-col gap-4 mt-4 pt-4 border-t border-[var(--border-color)]">
//             <button 
//               className="btn w-full flex items-center justify-center gap-2 text-red-400 hover:border-red-400"
//               onClick={resetGraph}
//               disabled={traversal.isRunning}
//             >
//               <Trash2 size={14} /> Reset Graph
//             </button>

//             <div className="bg-black/30 p-4 rounded-xl border border-[var(--border-color)] text-[11px] leading-relaxed">
//               <div className="flex items-center gap-2 mb-2 font-bold text-[var(--text-main)] uppercase tracking-wider">
//                 <Info size={12} className="text-[var(--accent-blue)]" />
//                 Quick Instructions
//               </div>
//               <ul className="space-y-1.5 text-[var(--text-muted)]">
//                 <li>• <b>Node Mode</b>: Click canvas to add node</li>
//                 <li>• <b>Edge Mode</b>: Click 2 nodes to connect</li>
//                 <li>• <b>Selection</b>: Click nodes to set Source/Target</li>
//                 <li>• <b>Execution</b>: Set source/target, then Run</li>
//               </ul>
//             </div>
//           </div>
//         </aside>

//         {/* Center: Canvas Area */}
//         <main 
//           ref={canvasRef}
//           className="relative bg-[radial-gradient(circle,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px] overflow-hidden cursor-crosshair"
//           onClick={handleCanvasClick}
//           onMouseMove={handleMouseMove}
//           onMouseUp={handleMouseUp}
//           onMouseLeave={handleMouseUp}
//         >
//       {/* Edges */}
//       {edges.map(edge => {
//         const style = getEdgeStyle(edge);
//         return (
//           <div 
//             key={edge.id}
//             className="absolute transition-all duration-300 edge-line"
//             style={style}
//           >
//             {/* Arrow Head for Directed Graphs */}
//             {isDirected && (
//               <div 
//                 className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-0 h-0 border-l-[6px] border-y-[4px] border-y-transparent"
//                 style={{ borderLeftColor: style.backgroundColor }}
//               />
//             )}
//             {/* Weight Label */}
//             <div className="absolute top-[-15px] left-1/2 -translate-x-1/2 text-[9px] font-mono text-[var(--text-muted)] bg-[var(--bg-dark)] px-1 rounded border border-[var(--border-color)]">
//               {edge.weight}
//             </div>
//           </div>
//         );
//       })}

//           {/* Nodes */}
//           {nodes.map(node => (
//             <motion.div
//               layoutId={node.id}
//               key={node.id}
//               className={`absolute w-11 h-11 rounded-full border-2 flex flex-col items-center justify-center font-bold text-sm cursor-pointer select-none transition-all duration-300 z-10`}
//               style={getNodeStyle(node)}
//               onClick={(e) => handleNodeClick(e, node.id)}
//               onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
//               onMouseEnter={() => setHoveredNodeId(node.id)}
//               onMouseLeave={() => setHoveredNodeId(null)}
//               whileHover={{ scale: 1.1 }}
//               whileTap={{ scale: 0.95 }}
//             >
//               {node.id}
              
//               {/* Node Role Indicator */}
//               {(sourceNodeId === node.id || targetNodeId === node.id) && (
//                 <div className={`absolute -top-1 px-1 rounded text-[8px] font-bold uppercase ${sourceNodeId === node.id ? 'bg-[var(--accent-blue)]' : 'bg-[var(--accent-purple)]'} text-white`}>
//                   {sourceNodeId === node.id ? 'SRC' : 'TRG'}
//                 </div>
//               )}
              
//               {/* Dijkstra Distance Label */}
//               {traversal.algorithmName === 'Dijkstra' && traversal.distances[node.id] !== undefined && (
//                 <div className="absolute top-10 text-[9px] font-mono whitespace-nowrap text-[var(--accent-green)]">
//                   d: {traversal.distances[node.id] === Infinity ? '∞' : traversal.distances[node.id]}
//                 </div>
//               )}
//             </motion.div>
//           ))}

//           {/* Algorithm HUD Overlay */}
//           <AnimatePresence>
//             {traversal.isRunning && (
//               <motion.div 
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, y: 20 }}
//                 className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[var(--panel-bg)] border border-[var(--border-color)] px-6 py-2.5 rounded-full flex items-center gap-4 shadow-2xl z-[100]"
//               >
//                 <div className="w-2 h-2 bg-[var(--accent-green)] rounded-full animate-pulse" />
//                 <div className="text-sm font-medium tracking-tight">
//                   Running: <span className="text-[var(--accent-blue)]">{traversal.algorithmName}</span> Simulation
//                 </div>
//                 <div className="w-px h-4 bg-[var(--border-color)] mx-1" />
//                 <button 
//                   onClick={stopSimulation}
//                   className="bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-colors"
//                 >
//                   Stop
//                 </button>
//                 <div className="w-px h-4 bg-[var(--border-color)] mx-1" />
//                 <div className="flex gap-2.5 text-lg">
//                    <button className="hover:text-[var(--accent-blue)] transition-colors opacity-50 cursor-not-allowed">⏮</button>
//                    <button className="hover:text-[var(--accent-blue)] transition-colors">⏸</button>
//                    <button className="hover:text-[var(--accent-blue)] transition-colors opacity-50 cursor-not-allowed">⏭</button>
//                 </div>
//               </motion.div>
//             )}
//           </AnimatePresence>

//           {/* Empty State Instructions */}
//           {nodes.length === 0 && (
//             <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-muted)] pointer-events-none opacity-40">
//               <GitCommitHorizontal size={48} className="mb-4" />
//               <p>Click anywhere to create your first node</p>
//             </div>
//           )}
//         </main>

//         {/* Right Sidebar: Logs & Legend */}
//         <aside className="sidebar border-l h-full overflow-hidden flex flex-col">
//           <div className="flex-1 overflow-hidden flex flex-col min-h-0">
//             <div className="panel-title flex items-center justify-between">
//               <div className="flex items-center gap-2">
//                 <Terminal size={14} /> Traversal Log
//               </div>
//               {logs.length > 0 && (
//                 <button 
//                   onClick={() => setLogs([])}
//                   className="text-[9px] hover:text-red-400 transition-colors"
//                 >
//                   CLEAR
//                 </button>
//               )}
//             </div>
//             <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
//               {logs.map((log, i) => (
//                 <div key={i} className="log-entry">
//                   <span className="text-[var(--text-muted)] mr-1">[{log.timestamp}ms]</span>
//                   <span className="log-entry-type font-bold mr-2">{log.type}</span>
//                   <span className="text-[var(--text-main)]">{log.message}</span>
//                 </div>
//               ))}
//               {logs.length === 0 && (
//                 <div className="text-[var(--text-muted)] text-[11px] italic mt-2">
//                   System idle. Logs will appear here...
//                 </div>
//               )}
//             </div>
//           </div>
          
//           <div className="panel-section pt-5 border-t border-[var(--border-color)]">
//             <div className="panel-title">Visual Legend</div>
//             <div className="flex flex-col gap-2.5">
//               <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
//                 <div className="w-3 h-3 rounded-full bg-[var(--accent-purple)] shadow-[0_0_8px_var(--accent-purple)]" />
//                 <span>Current Processing Node</span>
//               </div>
//               <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
//                 <div className="w-3 h-3 rounded-full bg-[var(--accent-green)]" />
//                 <span>Visited / Processed</span>
//               </div>
//               <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
//                 <div className="w-3 h-3 rounded-full border-2 border-[var(--accent-blue)]" />
//                 <span>Unvisited / Available</span>
//               </div>
//               <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
//                 <div className="w-6 h-0.5 bg-[var(--accent-blue)] shadow-[0_0_5px_var(--accent-blue)]" />
//                 <span>Active Algorithm Path</span>
//               </div>
//             </div>
//           </div>

//           <div className="status-bar mt-auto bg-black/20 p-3 rounded-lg border border-[var(--border-color)]">
//             <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1">Status</div>
//             <div className="text-xs text-[var(--text-main)] italic">
//               {traversal.isRunning 
//                 ? `Executing ${traversal.algorithmName}...` 
//                 : inputMode === 'node' ? 'Place nodes on canvas' : inputMode === 'edge' ? 'Select two nodes to connect' : 'Ready to simulate'}
//             </div>
//           </div>
//         </aside>
//       </div>
//     </div>
//   );
// }


















/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Plus, 
  MousePointer2, 
  GitCommitHorizontal, 
  Play, 
  RefreshCcw, 
  Trash2, 
  Settings2, 
  HelpCircle, 
  X,
  Download,
  Terminal,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Node, Edge, InputMode, LogEntry, TraversalState } from './types';

export default function App() {
  // Graph State
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [inputMode, setInputMode] = useState<InputMode>('node');
  const [isDirected, setIsDirected] = useState(false);
  const [nextEdgeWeight, setNextEdgeWeight] = useState(1);
  const [showHelp, setShowHelp] = useState(false);
  
  // Interaction State
  const [sourceNodeId, setSourceNodeId] = useState<string | null>(null);
  const [targetNodeId, setTargetNodeId] = useState<string | null>(null);
  const [pendingEdgeStartId, setPendingEdgeStartId] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  
  // Traversal/Algorithm State
  const [traversal, setTraversal] = useState<TraversalState>({
    visitedNodes: new Set(),
    visitedEdges: new Set(),
    currentNode: null,
    distances: {},
    isRunning: false,
    algorithmName: null,
    path: []
  });
  
  // Logs
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Refs for tracking
  const canvasRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(Date.now());

  // --- Utilities ---
  
  const addLog = useCallback((type: string, message: string) => {
    setLogs(prev => [
      {
        timestamp: Date.now() - startTimeRef.current,
        type,
        message
      },
      ...prev
    ].slice(0, 50));
  }, []);

  const resetTraversal = useCallback(() => {
    setTraversal({
      visitedNodes: new Set(),
      visitedEdges: new Set(),
      currentNode: null,
      distances: {},
      isRunning: false,
      algorithmName: null,
      path: []
    });
  }, []);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // --- Graph Handlers ---

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (traversal.isRunning) return;
    if (inputMode !== 'node') return;
    if (draggingNodeId) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check for collisions
    const collision = nodes.some(n => Math.hypot(n.x - x, n.y - y) < 60);
    if (collision) return;

    const newNodeId = String.fromCharCode(65 + nodes.length); // Use A, B, C...
    const newNode: Node = { id: newNodeId, x, y };

    setNodes(prev => [...prev, newNode]);
    addLog('INIT', `Added node ${newNodeId}`);
    if (!sourceNodeId) setSourceNodeId(newNodeId);
  };

  const handleNodeClick = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (traversal.isRunning) return;

    if (inputMode === 'edge') {
      if (!pendingEdgeStartId) {
        setPendingEdgeStartId(nodeId);
        addLog('SELECT', `Selected source ${nodeId} for edge`);
      } else if (pendingEdgeStartId !== nodeId) {
        // Create edge
        const edgeId = `${pendingEdgeStartId}-${nodeId}`;
        const exists = edges.some(e => 
          (e.from === pendingEdgeStartId && e.to === nodeId) || 
          (!isDirected && e.from === nodeId && e.to === pendingEdgeStartId)
        );

        if (!exists) {
          const newEdge: Edge = { id: edgeId, from: pendingEdgeStartId, to: nodeId, weight: nextEdgeWeight };
          setEdges(prev => [...prev, newEdge]);
          addLog('EDGE', `Connected ${pendingEdgeStartId} to ${nodeId} (w: ${nextEdgeWeight})`);
        }
        setPendingEdgeStartId(null);
      } else {
        setPendingEdgeStartId(null);
      }
    } else {
      if (!sourceNodeId || (sourceNodeId && targetNodeId)) {
        setSourceNodeId(nodeId);
        setTargetNodeId(null);
        addLog('SOURCE', `Node ${nodeId} set as source`);
      } else if (sourceNodeId === nodeId) {
        setSourceNodeId(null);
      } else {
        setTargetNodeId(nodeId);
        addLog('TARGET', `Node ${nodeId} set as target`);
      }
    }
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (traversal.isRunning || inputMode !== 'select') return;
    setDraggingNodeId(nodeId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingNodeId || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setNodes(prev => prev.map(n => n.id === draggingNodeId ? { ...n, x, y } : n));
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
  };

  const resetGraph = () => {
    if (traversal.isRunning) return;
    setNodes([]);
    setEdges([]);
    setSourceNodeId(null);
    setTargetNodeId(null);
    resetTraversal();
    setLogs([]);
    addLog('RESET', 'Graph cleared');
  };

  // --- Algorithms ---

  const getNeighbors = (nodeId: string) => {
    const neighbors: {id: string, edgeId: string, weight: number}[] = [];
    edges.forEach(e => {
      if (e.from === nodeId) neighbors.push({id: e.to, edgeId: e.id, weight: e.weight});
      else if (!isDirected && e.to === nodeId) neighbors.push({id: e.from, edgeId: e.id, weight: e.weight});
    });
    return neighbors;
  };

  const runBFS = async (startId: string) => {
    resetTraversal();
    setTraversal(prev => ({ ...prev, isRunning: true, algorithmName: 'BFS' }));
    addLog('BFS', `Starting BFS from ${startId}`);

    const queue: string[] = [startId];
    const visited = new Set<string>();
    const visitedEdges = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;

      visited.add(current);
      setTraversal(prev => ({ 
        ...prev, 
        currentNode: current, 
        visitedNodes: new Set(visited),
        visitedEdges: new Set(visitedEdges)
      }));
      addLog('VISITING', `Node ${current}`);
      await sleep(800);

      const neighbors = getNeighbors(current);
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor.id)) {
          visitedEdges.add(neighbor.edgeId);
          queue.push(neighbor.id);
        }
      }
    }

    setTraversal(prev => ({ ...prev, isRunning: false, currentNode: null }));
    addLog('COMPLETE', 'BFS Traversal finished');
  };

  const runDFS = async (startId: string) => {
    resetTraversal();
    setTraversal(prev => ({ ...prev, isRunning: true, algorithmName: 'DFS' }));
    addLog('DFS', `Starting DFS from ${startId}`);

    const visited = new Set<string>();
    const visitedEdges = new Set<string>();

    const dfs = async (nodeId: string) => {
      if (visited.has(nodeId)) return;
      
      visited.add(nodeId);
      setTraversal(prev => ({ 
        ...prev, 
        currentNode: nodeId, 
        visitedNodes: new Set(visited),
        visitedEdges: new Set(visitedEdges)
      }));
      addLog('VISITING', `Node ${nodeId}`);
      await sleep(800);

      const neighbors = getNeighbors(nodeId);
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor.id)) {
          visitedEdges.add(neighbor.edgeId);
          await dfs(neighbor.id);
        }
      }
    };

    await dfs(startId);
    setTraversal(prev => ({ ...prev, isRunning: false, currentNode: null }));
    addLog('COMPLETE', 'DFS Traversal finished');
  };

  const runDijkstra = async (startId: string, endId: string) => {
    resetTraversal();
    setTraversal(prev => ({ ...prev, isRunning: true, algorithmName: 'Dijkstra' }));
    addLog('DIJKSTRA', `Finding path from ${startId} to ${endId}`);

    const dist: Record<string, number> = {};
    const prevNode: Record<string, string | null> = {};
    const unvisited = new Set<string>();

    nodes.forEach(n => {
      dist[n.id] = Infinity;
      prevNode[n.id] = null;
      unvisited.add(n.id);
    });

    dist[startId] = 0;

    while (unvisited.size > 0) {
      // Find unvisited node with smallest distance
      let current: string | null = null;
      let minDist = Infinity;
      unvisited.forEach(nodeId => {
        if (dist[nodeId] < minDist) {
          minDist = dist[nodeId];
          current = nodeId;
        }
      });

      if (current === null || current === endId) break;

      unvisited.delete(current);
      setTraversal(prev => ({ ...prev, currentNode: current, distances: { ...dist }, visitedNodes: new Set(nodes.filter(n => !unvisited.has(n.id)).map(n => n.id)) }));
      addLog('CURRENT', `Analyzing ${current} (dist: ${dist[current]})`);
      await sleep(600);

      const neighbors = getNeighbors(current);
      for (const neighbor of neighbors) {
        if (!unvisited.has(neighbor.id)) continue;

        const newDist = dist[current] + neighbor.weight;
        if (newDist < dist[neighbor.id]) {
          dist[neighbor.id] = newDist;
          prevNode[neighbor.id] = current;
          addLog('RELAX', `New path to ${neighbor.id} via ${current} (w: ${newDist})`);
          setTraversal(prev => ({ ...prev, distances: { ...dist } }));
          await sleep(300);
        }
      }
    }

    // Reconstruction
    const path: string[] = [];
    if (dist[endId] !== Infinity) {
      let temp: string | null = endId;
      while (temp !== null) {
        path.unshift(temp);
        temp = prevNode[temp];
      }
    }

    if (dist[endId] === Infinity) {
      addLog('ERROR', `No path found from ${startId} to ${endId}`);
    } else {
      setTraversal(prev => ({ ...prev, path }));
      addLog('COMPLETE', 'Path found!');
      addLog('PATH', `Shortest path: ${path.join(' -> ')} (Cost: ${dist[endId]})`);
    }

    setTraversal(prev => ({ ...prev, isRunning: false, currentNode: null }));
  };

  const stopSimulation = () => {
    resetTraversal();
    addLog('STOP', 'Simulation stopped by user');
  };

  // --- Render Helpers ---

  const getNodeStyle = (node: Node) => {
    const isCurrent = traversal.currentNode === node.id;
    const isVisited = traversal.visitedNodes.has(node.id);
    const isInPath = traversal.path.includes(node.id);
    const isSource = sourceNodeId === node.id;
    const isTarget = targetNodeId === node.id;
    const isPendingEdge = pendingEdgeStartId === node.id;
    
    return {
      left: node.x,
      top: node.y,
      borderColor: isCurrent ? 'var(--accent-purple)' : isPendingEdge ? 'white' : isSource ? 'var(--accent-blue)' : isTarget ? 'var(--accent-purple)' : isVisited ? 'var(--accent-green)' : 'var(--accent-blue)',
      backgroundColor: isCurrent ? 'var(--accent-purple)' : isVisited ? 'var(--accent-green)' : 'var(--node-bg)',
      boxShadow: isCurrent ? '0 0 15px var(--accent-purple)' : (isSource || isTarget || isPendingEdge) ? '0 0 10px var(--accent-blue)' : '0 4px 12px rgba(0,0,0,0.3)',
      transform: 'translate(-50%, -50%)',
      zIndex: isCurrent ? 50 : 10
    };
  };

  const getEdgeStyle = (edge: Edge) => {
    const fromNode = nodes.find(n => n.id === edge.from);
    const toNode = nodes.find(n => n.id === edge.to);
    if (!fromNode || !toNode) return {};

    const dx = toNode.x - fromNode.x;
    const dy = toNode.y - fromNode.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    const isVisited = traversal.visitedEdges.has(edge.id);
    const isInPath = traversal.path.length > 1 &&
      traversal.path.some((nodeId, idx) => {
        if (idx === 0) return false;
        const prev = traversal.path[idx - 1];
        return (prev === edge.from && nodeId === edge.to) || 
               (!isDirected && prev === edge.to && nodeId === edge.from);
      });

    const height = isInPath ? 3 : 2;

    return {
      left: fromNode.x,
      top: fromNode.y - height / 2,
      width: length,
      transform: `rotate(${angle}deg)`,
      transformOrigin: '0 50%',
      backgroundColor: isInPath ? 'var(--accent-blue)' : isVisited ? 'var(--accent-green)' : 'var(--border-color)',
      height: `${height}px`,
      boxShadow: isInPath ? '0 0 8px var(--accent-blue)' : 'none',
      zIndex: isInPath ? 5 : 1,
      borderRadius: '2px'
    };
  };

  return (
    <div className="flex flex-col h-screen select-none">
      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-6"
            onClick={() => setShowHelp(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative custom-scrollbar shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <button 
                className="absolute top-6 right-6 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors p-2 hover:bg-white/5 rounded-full"
                onClick={() => setShowHelp(false)}
              >
                <X size={24} />
              </button>

              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-[var(--accent-blue)]/20 rounded-xl flex items-center justify-center">
                  <HelpCircle className="text-[var(--accent-blue)]" size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">How to use GraphLink Pro</h2>
                  <p className="text-[var(--text-muted)] text-sm">Master your graph visualizations and algorithms</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-[var(--accent-blue)] font-bold text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Plus size={14} /> Building the Graph
                    </h3>
                    <ul className="space-y-3 text-sm text-[var(--text-muted)]">
                      <li className="flex gap-2">
                        <span className="text-[var(--text-main)]">•</span>
                        <span><b>Create Nodes:</b> Select <b>Node Mode</b> and click anywhere on the grid.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-[var(--text-main)]">•</span>
                        <span><b>Connect Nodes:</b> Select <b>Edge Mode</b>. Click the first node, then click the second node.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-[var(--text-main)]">•</span>
                        <span><b>Edge Weights:</b> Adjust the "Next Weight" in the sidebar before connecting nodes.</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-[var(--accent-purple)] font-bold text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Settings2 size={14} /> Algorithms
                    </h3>
                    <ul className="space-y-3 text-sm text-[var(--text-muted)]">
                      <li className="flex gap-2">
                        <span className="text-[var(--text-main)]">•</span>
                        <span><b>Set Source:</b> In Node/Select mode, click any node. It will be labeled as <b>SRC</b>.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-[var(--text-main)]">•</span>
                        <span><b>Set Target:</b> Click a different node to set it as <b>TRG</b> (required for Dijkstra).</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-[var(--text-main)]">•</span>
                        <span><b>Run:</b> Use the Execution panel to start simulations.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-[var(--accent-green)] font-bold text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                      <MousePointer2 size={14} /> Interaction
                    </h3>
                    <ul className="space-y-3 text-sm text-[var(--text-muted)]">
                      <li className="flex gap-2">
                        <span className="text-[var(--text-main)]">•</span>
                        <span><b>Drag Nodes:</b> Use <b>Drag Mode</b> to reposition nodes freely.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-[var(--text-main)]">•</span>
                        <span><b>Directed Toggle:</b> Switch between directed and undirected graphs in "Edge Properties".</span>
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 bg-[var(--accent-blue)]/5 border border-[var(--accent-blue)]/20 rounded-xl">
                    <h3 className="text-[var(--text-main)] font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Terminal size={14} /> Helpful Tip
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                      You can stop any running simulation using the control bar at the bottom center of the canvas. 
                      Shortest path nodes are highlighted in blue glow once found.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-[var(--border-color)] flex justify-end">
                <button 
                  className="btn btn-primary px-8 py-2.5"
                  onClick={() => setShowHelp(false)}
                >
                  Got it!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="h-[56px] bg-[var(--panel-bg)] border-b border-[var(--border-color)] flex items-center justify-between px-5 z-20">
        <div className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <GitCommitHorizontal className="text-[var(--accent-blue)]" />
          Graph<span className="text-[var(--accent-blue)]">Link</span> Pro
        </div>
        <div className="flex gap-3">
          <button 
            className="btn btn-primary flex items-center gap-2"
            onClick={() => setShowHelp(true)}
          >
            <HelpCircle size={16} /> Help
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 grid grid-cols-[280px_1fr_260px] min-h-0 overflow-hidden bg-[var(--bg-dark)]">
        
        {/* Left Sidebar: Controls */}
        <aside className="sidebar border-r h-full overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-6 scrollbar-hide min-h-0">
            <div className="panel-section">
              <div className="panel-title">Interaction Mode</div>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  className={`btn flex flex-col items-center gap-1 ${inputMode === 'node' ? 'btn-active' : ''}`}
                  onClick={() => { setInputMode('node'); setPendingEdgeStartId(null); }}
                >
                  <Plus size={16} />
                  <span className="text-[10px]">Node</span>
                </button>
                <button 
                  className={`btn flex flex-col items-center gap-1 ${inputMode === 'edge' ? 'btn-active' : ''}`}
                  onClick={() => { setInputMode('edge'); setPendingEdgeStartId(null); }}
                >
                  <GitCommitHorizontal size={16} />
                  <span className="text-[10px]">Edge</span>
                </button>
                <button 
                  className={`btn flex flex-col items-center gap-1 ${inputMode === 'select' ? 'btn-active' : ''}`}
                  onClick={() => { setInputMode('select'); setPendingEdgeStartId(null); }}
                >
                  <MousePointer2 size={16} />
                  <span className="text-[10px]">Drag</span>
                </button>
              </div>
            </div>

            <div className="panel-section">
              <div className="panel-title">Edge Properties</div>
              <div className="bg-black/20 p-3 rounded-lg border border-[var(--border-color)]">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-muted)]">Next Weight</span>
                    <input 
                      type="number" 
                      min="1" 
                      max="99"
                      value={nextEdgeWeight}
                      onChange={(e) => setNextEdgeWeight(parseInt(e.target.value) || 1)}
                      className="w-12 bg-[var(--node-bg)] border border-[var(--border-color)] text-xs text-center rounded outline-none focus:border-[var(--accent-blue)]"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-muted)]">Directed</span>
                    <button 
                      className={`text-xs font-semibold ${isDirected ? 'text-[var(--accent-blue)]' : 'text-[var(--text-muted)]'}`}
                      onClick={() => setIsDirected(!isDirected)}
                    >
                      {isDirected ? 'YES' : 'NO'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="panel-section">
              <div className="panel-title">Selection</div>
              <div className="bg-black/20 p-3 rounded-lg border border-[var(--border-color)]">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase text-[var(--text-muted)]">Source</span>
                    <div className="text-xs font-mono font-bold text-[var(--accent-blue)]">
                      {sourceNodeId || 'None'}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase text-[var(--text-muted)]">Target</span>
                    <div className="text-xs font-mono font-bold text-[var(--accent-purple)]">
                      {targetNodeId || 'None'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="panel-section">
              <div className="panel-title">Execution</div>
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    className="btn flex items-center justify-center gap-2"
                    onClick={() => sourceNodeId && runBFS(sourceNodeId)}
                    disabled={!sourceNodeId || traversal.isRunning}
                  >
                    <Play size={14} /> BFS
                  </button>
                  <button 
                    className="btn flex items-center justify-center gap-2"
                    onClick={() => sourceNodeId && runDFS(sourceNodeId)}
                    disabled={!sourceNodeId || traversal.isRunning}
                  >
                    <Play size={14} /> DFS
                  </button>
                </div>
                <button 
                  className="btn btn-primary w-full flex items-center justify-center gap-2 py-3"
                  onClick={() => {
                    if (nodes.length < 2 || !sourceNodeId || !targetNodeId) return;
                    runDijkstra(sourceNodeId, targetNodeId);
                  }}
                  disabled={!sourceNodeId || !targetNodeId || traversal.isRunning}
                >
                  <Settings2 size={16} /> Dijkstra's Path
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 mt-4 pt-4 border-t border-[var(--border-color)]">
            <button 
              className="btn w-full flex items-center justify-center gap-2 text-red-400 hover:border-red-400"
              onClick={resetGraph}
              disabled={traversal.isRunning}
            >
              <Trash2 size={14} /> Reset Graph
            </button>

            <div className="bg-black/30 p-4 rounded-xl border border-[var(--border-color)] text-[11px] leading-relaxed">
              <div className="flex items-center gap-2 mb-2 font-bold text-[var(--text-main)] uppercase tracking-wider">
                <Info size={12} className="text-[var(--accent-blue)]" />
                Quick Instructions
              </div>
              <ul className="space-y-1.5 text-[var(--text-muted)]">
                <li>• <b>Node Mode</b>: Click canvas to add node</li>
                <li>• <b>Edge Mode</b>: Click 2 nodes to connect</li>
                <li>• <b>Selection</b>: Click nodes to set Source/Target</li>
                <li>• <b>Execution</b>: Set source/target, then Run</li>
              </ul>
            </div>
          </div>
        </aside>

        {/* Center: Canvas Area */}
        <main 
          ref={canvasRef}
          className="relative bg-[radial-gradient(circle,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px] overflow-hidden cursor-crosshair"
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
      {/* Edges */}
      {edges.map(edge => {
        const style = getEdgeStyle(edge);
        return (
          <div 
            key={edge.id}
            className="absolute transition-all duration-300 edge-line"
            style={style}
          >
            {/* Arrow Head for Directed Graphs */}
            {isDirected && (
              <div 
                className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-0 h-0 border-l-[6px] border-y-[4px] border-y-transparent"
                style={{ borderLeftColor: style.backgroundColor }}
              />
            )}
            {/* Weight Label */}
            <div className="absolute top-[-15px] left-1/2 -translate-x-1/2 text-[9px] font-mono text-[var(--text-muted)] bg-[var(--bg-dark)] px-1 rounded border border-[var(--border-color)]">
              {edge.weight}
            </div>
          </div>
        );
      })}

          {/* Nodes */}
          {nodes.map(node => (
            <motion.div
              layoutId={node.id}
              key={node.id}
              className={`absolute w-11 h-11 rounded-full border-2 flex flex-col items-center justify-center font-bold text-sm cursor-pointer select-none transition-all duration-300 z-10`}
              style={getNodeStyle(node)}
              onClick={(e) => handleNodeClick(e, node.id)}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              onMouseEnter={() => setHoveredNodeId(node.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {node.id}
              
              {/* Node Role Indicator */}
              {(sourceNodeId === node.id || targetNodeId === node.id) && (
                <div className={`absolute -top-1 px-1 rounded text-[8px] font-bold uppercase ${sourceNodeId === node.id ? 'bg-[var(--accent-blue)]' : 'bg-[var(--accent-purple)]'} text-white`}>
                  {sourceNodeId === node.id ? 'SRC' : 'TRG'}
                </div>
              )}
              
              {/* Dijkstra Distance Label */}
              {traversal.algorithmName === 'Dijkstra' && traversal.distances[node.id] !== undefined && (
                <div className="absolute top-10 text-[9px] font-mono whitespace-nowrap text-[var(--accent-green)]">
                  d: {traversal.distances[node.id] === Infinity ? '∞' : traversal.distances[node.id]}
                </div>
              )}
            </motion.div>
          ))}

          {/* Algorithm HUD Overlay */}
          <AnimatePresence>
            {traversal.isRunning && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[var(--panel-bg)] border border-[var(--border-color)] px-6 py-2.5 rounded-full flex items-center gap-4 shadow-2xl z-[100]"
              >
                <div className="w-2 h-2 bg-[var(--accent-green)] rounded-full animate-pulse" />
                <div className="text-sm font-medium tracking-tight">
                  Running: <span className="text-[var(--accent-blue)]">{traversal.algorithmName}</span> Simulation
                </div>
                <div className="w-px h-4 bg-[var(--border-color)] mx-1" />
                <button 
                  onClick={stopSimulation}
                  className="bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-colors"
                >
                  Stop
                </button>
                <div className="w-px h-4 bg-[var(--border-color)] mx-1" />
                <div className="flex gap-2.5 text-lg">
                   <button className="hover:text-[var(--accent-blue)] transition-colors opacity-50 cursor-not-allowed">⏮</button>
                   <button className="hover:text-[var(--accent-blue)] transition-colors">⏸</button>
                   <button className="hover:text-[var(--accent-blue)] transition-colors opacity-50 cursor-not-allowed">⏭</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State Instructions */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-muted)] pointer-events-none opacity-40">
              <GitCommitHorizontal size={48} className="mb-4" />
              <p>Click anywhere to create your first node</p>
            </div>
          )}
        </main>

        {/* Right Sidebar: Logs & Legend */}
        <aside className="sidebar border-l h-full overflow-hidden flex flex-col">
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="panel-title flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal size={14} /> Traversal Log
              </div>
              {logs.length > 0 && (
                <button 
                  onClick={() => setLogs([])}
                  className="text-[9px] hover:text-red-400 transition-colors"
                >
                  CLEAR
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
              {logs.map((log, i) => (
                <div key={i} className="log-entry">
                  <span className="text-[var(--text-muted)] mr-1">[{log.timestamp}ms]</span>
                  <span className="log-entry-type font-bold mr-2">{log.type}</span>
                  <span className="text-[var(--text-main)]">{log.message}</span>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-[var(--text-muted)] text-[11px] italic mt-2">
                  System idle. Logs will appear here...
                </div>
              )}
            </div>
          </div>
          
          <div className="panel-section pt-5 border-t border-[var(--border-color)]">
            <div className="panel-title">Visual Legend</div>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                <div className="w-3 h-3 rounded-full bg-[var(--accent-purple)] shadow-[0_0_8px_var(--accent-purple)]" />
                <span>Current Processing Node</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                <div className="w-3 h-3 rounded-full bg-[var(--accent-green)]" />
                <span>Visited / Processed</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                <div className="w-3 h-3 rounded-full border-2 border-[var(--accent-blue)]" />
                <span>Unvisited / Available</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                <div className="w-6 h-0.5 bg-[var(--accent-blue)] shadow-[0_0_5px_var(--accent-blue)]" />
                <span>Active Algorithm Path</span>
              </div>
            </div>
          </div>

          <div className="status-bar mt-auto bg-black/20 p-3 rounded-lg border border-[var(--border-color)]">
            <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1">Status</div>
            <div className="text-xs text-[var(--text-main)] italic">
              {traversal.isRunning 
                ? `Executing ${traversal.algorithmName}...` 
                : inputMode === 'node' ? 'Place nodes on canvas' : inputMode === 'edge' ? 'Select two nodes to connect' : 'Ready to simulate'}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
