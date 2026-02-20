import { useState, useRef, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
} from '@xyflow/react';
import type { Connection, Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng, toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';
import { Download, Cloud, CloudDownload, GitCommitVertical, Search, FileDown, Undo2, Redo2, Network, Settings } from 'lucide-react';
import Papa from 'papaparse';

import { Sidebar } from './components/Sidebar';
import { OrganizationNode } from './nodes/OrganizationNode';
import { PersonNode } from './nodes/PersonNode';
import { db } from './firebase'; // To be implemented later
import { CsvImporter } from './components/CsvImporter';
import { DetailsPanel } from './components/DetailsPanel';
import { getLayoutedElements } from './utils/layout';
import DeletableEdge from './edges/DeletableEdge';
import { HistoryContext } from './contexts/HistoryContext';
import { RoleSettingsModal } from './components/RoleSettingsModal';

const nodeTypes = {
  organization: OrganizationNode,
  person: PersonNode,
};

const edgeTypes = {
  deletable: DeletableEdge,
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'organization',
    data: { label: '株式会社サンプル' },
    position: { x: 250, y: 50 },
  },
];

let id = 0;
const getId = () => `dndnode_${id++}`;

function Flow() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [layoutDirection, setLayoutDirection] = useState<'TB' | 'LR'>('TB');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

  const [roles, setRoles] = useState<string[]>(['社長', '役員', '本部長', '部長', '課長', '主任', '一般']);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  const [past, setPast] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const [future, setFuture] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);

  const takeSnapshot = useCallback(() => {
    setPast((p) => {
      const clonedNodes = nodes.map(n => ({ ...n, data: { ...n.data } }));
      const clonedEdges = edges.map(e => ({ ...e, data: { ...e.data } }));
      return [...p.slice(-50), { nodes: clonedNodes, edges: clonedEdges }];
    });
    setFuture([]);
  }, [nodes, edges]);

  const undo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p;
      const previous = p[p.length - 1];
      const clonedNodes = nodes.map(n => ({ ...n, data: { ...n.data } }));
      const clonedEdges = edges.map(e => ({ ...e, data: { ...e.data } }));
      setFuture((f) => [{ nodes: clonedNodes, edges: clonedEdges }, ...f]);
      setNodes(previous.nodes);
      setEdges(previous.edges);
      return p.slice(0, p.length - 1);
    });
  }, [nodes, edges, setNodes, setEdges]);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[0];
      const clonedNodes = nodes.map(n => ({ ...n, data: { ...n.data } }));
      const clonedEdges = edges.map(e => ({ ...e, data: { ...e.data } }));
      setPast((p) => [...p, { nodes: clonedNodes, edges: clonedEdges }]);
      setNodes(next.nodes);
      setEdges(next.edges);
      return f.slice(1);
    });
  }, [nodes, edges, setNodes, setEdges]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const handleNodesChange = useCallback((changes: any[]) => {
    if (changes.some(c => c.type === 'remove')) takeSnapshot();
    onNodesChange(changes);
  }, [onNodesChange, takeSnapshot]);

  const handleEdgesChange = useCallback((changes: any[]) => {
    if (changes.some(c => c.type === 'remove')) takeSnapshot();
    onEdgesChange(changes);
  }, [onEdgesChange, takeSnapshot]);

  const edgesRef = useRef(edges);
  useEffect(() => { edgesRef.current = edges; }, [edges]);

  const layoutDirectionRef = useRef(layoutDirection);
  useEffect(() => { layoutDirectionRef.current = layoutDirection; }, [layoutDirection]);

  const toggleNodeCollapse = useCallback((nodeId: string) => {
    takeSnapshot();
    setCollapsedNodes((prev) => {
      const isCollapsed = !prev[nodeId];
      const newCollapsedNodes = { ...prev, [nodeId]: isCollapsed };

      const currentEdges = edgesRef.current;

      const childrenMap: Record<string, string[]> = {};
      currentEdges.forEach((e) => {
        if (!childrenMap[e.source]) childrenMap[e.source] = [];
        childrenMap[e.source].push(e.target);
      });

      const hiddenNodeIds = new Set<string>();
      const hideDescendants = (nId: string) => {
        const children = childrenMap[nId] || [];
        children.forEach((childId) => {
          hiddenNodeIds.add(childId);
          hideDescendants(childId);
        });
      };

      Object.entries(newCollapsedNodes).forEach(([nId, collapsed]) => {
        if (collapsed) hideDescendants(nId);
      });

      setNodes((nds) => {
        return nds.map((node) => ({
          ...node,
          hidden: hiddenNodeIds.has(node.id),
          data: { ...node.data, isCollapsed: !!newCollapsedNodes[node.id] }
        }));
      });

      setEdges((eds) =>
        eds.map((edge) => ({
          ...edge,
          hidden: hiddenNodeIds.has(edge.source) || hiddenNodeIds.has(edge.target) || !!newCollapsedNodes[edge.source]
        }))
      );

      return newCollapsedNodes;
    });

    setTimeout(() => {
      if (reactFlowInstance) reactFlowInstance.fitView({ padding: 0.2, duration: 800 });
    }, 50);

  }, [setNodes, setEdges, reactFlowInstance, takeSnapshot]);

  // Update nodes with hasChildren, onToggleCollapse, and parentNode logic
  useEffect(() => {
    const childrenMap: Record<string, boolean> = {};
    const parentMap: Record<string, string> = {}; // どの子がどの親に属するかを記録

    edges.forEach((e) => {
      childrenMap[e.source] = true;
      parentMap[e.target] = e.source;
    });

    setNodes((nds) => {
      let changed = false;

      // 現在のすべてのノードの絶対座標をマップ化（parentNode 計算用）
      // すでに parentNode がある場合は、親の絶対座標を足して絶対座標を復元する
      const absPosMap = new Map<string, { x: number; y: number }>();

      // まずは親（parentIdを持たないノード）の絶対座標を記録
      nds.forEach((n) => {
        if (!n.parentId) {
          absPosMap.set(n.id, { x: n.position.x, y: n.position.y });
        }
      });
      // 次に子（parentIdを持つノード）の絶対座標を計算して記録（再起的な階層は浅いと仮定）
      nds.forEach((n) => {
        if (n.parentId) {
          const pPos = absPosMap.get(n.parentId) || { x: 0, y: 0 };
          absPosMap.set(n.id, { x: pPos.x + n.position.x, y: pPos.y + n.position.y });
        }
      });

      const nextNodes = nds.map((node) => {
        const hasChildren = !!childrenMap[node.id];
        const isCollapsed = !!collapsedNodes[node.id];
        const newParentNode = parentMap[node.id];

        let newPosition = node.position;
        let parentChanged = false;

        if (node.parentId !== newParentNode) {
          parentChanged = true;
          changed = true;
          // 親が変わる、あるいは新しく親が設定される/外れる場合の座標補正
          const myAbs = absPosMap.get(node.id) || node.position;

          if (newParentNode) {
            // 親が設定された場合、自身の相対座標 = 自身の絶対座標 - 新しい親の絶対座標
            const newParentAbs = absPosMap.get(newParentNode) || { x: 0, y: 0 };
            newPosition = {
              x: myAbs.x - newParentAbs.x,
              y: myAbs.y - newParentAbs.y,
            };
          } else {
            // 親が外れた場合、現在の絶対座標をそのまま position として使用
            newPosition = { ...myAbs };
          }
        }

        if (
          parentChanged ||
          node.data.hasChildren !== hasChildren ||
          node.data.isCollapsed !== isCollapsed ||
          typeof node.data.onToggleCollapse !== 'function'
        ) {
          changed = true;
          return {
            ...node,
            parentId: newParentNode,
            position: newPosition, // parentChanged時のみ相対/絶対補正された座標になる
            data: {
              ...node.data,
              hasChildren,
              isCollapsed,
              onToggleCollapse: () => toggleNodeCollapse(node.id)
            }
          };
        }
        return node;
      });
      return changed ? nextNodes : nds;
    });
  }, [edges, collapsedNodes, setNodes, toggleNodeCollapse]);

  // 検索クエリが変更されたらすべてのノードのdataに反映する
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          searchQuery
        }
      }))
    );
  }, [searchQuery, setNodes]);

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      takeSnapshot();
      setEdges((eds) => addEdge({ ...params, type: 'deletable', animated: true }, eds));
    },
    [setEdges, takeSnapshot],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowInstance || !reactFlowWrapper.current) return;

      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: getId(),
        type,
        position,
        data:
          type === 'organization'
            ? { label: '新規組織', searchQuery }
            : { name: '新規メンバー', role: '役職', department: '', gender: '', age: '', searchQuery },
      };

      takeSnapshot();
      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes, searchQuery, takeSnapshot],
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Auto load from Cloud on mount
  useEffect(() => {
    const autoLoad = async () => {
      if (!db) return;
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const docSnap = await getDoc(doc(db, 'org_charts', 'master'));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.nodes) setNodes(data.nodes);
          if (data.edges) setEdges(data.edges);
          if (data.layoutDirection) setLayoutDirection(data.layoutDirection);
          if (data.roles) setRoles(data.roles);
        }
      } catch (err) {
        console.error("Auto load failed:", err);
      }
    };
    autoLoad();
  }, [setNodes, setEdges]);

  const handleCsvImport = useCallback(
    (importedNodes: Node[], importedEdges: Edge[]) => {
      takeSnapshot();

      // Merge Nodes
      const existingNodesMap = new Map(nodes.map(n => [n.id, n]));
      importedNodes.forEach(newN => {
        // overwrite existing by ID or add new
        existingNodesMap.set(newN.id, newN);
      });
      const mergedNodes = Array.from(existingNodesMap.values());

      // Merge Edges
      const existingEdgesMap = new Map(edges.map(e => [e.id, e]));
      importedEdges.forEach(newE => {
        existingEdgesMap.set(newE.id, newE);
      });
      const mergedEdges = Array.from(existingEdgesMap.values());

      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        mergedNodes,
        mergedEdges,
        layoutDirection,
        roles
      );

      // 追加するノードにも現在の検索クエリ状態を付与する
      const nodesWithSearch = layoutedNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          searchQuery
        }
      }));

      setNodes(nodesWithSearch);
      setEdges(layoutedEdges);

      // フィットビューを少し遅延させて実行する
      setTimeout(() => {
        if (reactFlowInstance) reactFlowInstance.fitView({ padding: 0.2, duration: 800 });
      }, 50);
    },
    [layoutDirection, reactFlowInstance, setNodes, setEdges, roles, nodes, edges, takeSnapshot]
  );

  const toggleLayout = useCallback(() => {
    takeSnapshot();
    const newDirection = layoutDirection === 'TB' ? 'LR' : 'TB';
    setLayoutDirection(newDirection);

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes,
      edges,
      newDirection,
      roles
    );

    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);

    setTimeout(() => {
      if (reactFlowInstance) reactFlowInstance.fitView({ padding: 0.2, duration: 800 });
    }, 50);
  }, [layoutDirection, nodes, edges, setNodes, setEdges, reactFlowInstance, takeSnapshot]);

  const runAutoLayout = useCallback(() => {
    takeSnapshot();
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges, layoutDirection, roles);
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
    setTimeout(() => {
      if (reactFlowInstance) reactFlowInstance.fitView({ padding: 0.2, duration: 800 });
    }, 50);
  }, [nodes, edges, layoutDirection, reactFlowInstance, setNodes, setEdges, takeSnapshot]);

  const exportAsImage = useCallback((format: 'png' | 'jpeg') => {
    if (reactFlowWrapper.current === null) {
      return;
    }

    const { width, height } = reactFlowWrapper.current.getBoundingClientRect();

    const options = {
      width,
      height,
      backgroundColor: '#f3f4f6',
      style: {
        transform: 'translate(0, 0)',
      },
    };

    const action = format === 'png' ? toPng : toJpeg;
    const extension = format === 'png' ? 'png' : 'jpg';

    action(reactFlowWrapper.current, options)
      .then(async (dataUrl) => {
        // use showSaveFilePicker if available
        if ('showSaveFilePicker' in window) {
          try {
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const fileHandle = await (window as any).showSaveFilePicker({
              suggestedName: `org-chart.${extension}`,
              types: [{
                description: `${format.toUpperCase()} Image`,
                accept: { [`image/${extension}`]: [`.${extension}`] },
              }],
            });
            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();
            return;
          } catch (err) {
            // User cancelled or error, fallback or do nothing
            // AbortError is thrown when user cancels the dialog
            if ((err as Error).name === 'AbortError') return;
            console.error('File picker error:', err);
          }
        }
        // Fallback
        const link = document.createElement('a');
        link.download = `org-chart.${extension}`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('oops, something went wrong!', err);
      });
  }, []);

  const exportAsPDF = useCallback(() => {
    if (reactFlowWrapper.current === null) {
      return;
    }

    const { width, height } = reactFlowWrapper.current.getBoundingClientRect();

    toPng(reactFlowWrapper.current, {
      width,
      height,
      backgroundColor: '#f3f4f6',
      style: { transform: 'translate(0, 0)' }
    })
      .then(async (dataUrl) => {
        const pdf = new jsPDF({
          orientation: width > height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [width, height],
        });
        pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);

        if ('showSaveFilePicker' in window) {
          try {
            const blob = pdf.output('blob');
            const fileHandle = await (window as any).showSaveFilePicker({
              suggestedName: 'org-chart.pdf',
              types: [{
                description: 'PDF Document',
                accept: { 'application/pdf': ['.pdf'] },
              }],
            });
            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();
            return;
          } catch (err) {
            if ((err as Error).name === 'AbortError') return;
            console.error('File picker error:', err);
          }
        }
        // Fallback
        pdf.save('org-chart.pdf');
      })
      .catch((err) => {
        console.error('oops, something went wrong!', err);
      });
  }, []);

  const exportToCsv = useCallback(() => {
    const managerMap: Record<string, string> = {};
    edges.forEach(edge => {
      managerMap[edge.target] = edge.source;
    });

    const csvData = nodes.map(node => {
      const isPerson = node.type === 'person';
      return {
        'ID': node.id,
        '氏名': isPerson ? node.data.name : (node.data.label || ''),
        '役職': isPerson ? node.data.role : '',
        '部門': isPerson ? (node.data.department || '') : '',
        '性別': isPerson ? (node.data.gender || '') : '',
        '年齢': isPerson ? (node.data.age || '') : '',
        '上司ID': managerMap[node.id] || ''
      };
    });

    const csvString = Papa.unparse(csvData);

    // Add BOM for Excel compatibility (UTF-8)
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    const saveCsv = async () => {
      if ('showSaveFilePicker' in window) {
        try {
          const fileHandle = await (window as any).showSaveFilePicker({
            suggestedName: `org-chart-${new Date().toISOString().slice(0, 10)}.csv`,
            types: [{
              description: 'CSV File',
              accept: { 'text/csv': ['.csv'] },
            }],
          });
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          return;
        } catch (err) {
          if ((err as Error).name === 'AbortError') return;
          console.error('File picker error:', err);
        }
      }

      // Fallback
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `org-chart-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    };

    saveCsv();
  }, [nodes, edges]);

  const saveToCloud = async () => {
    if (!db) {
      alert("Firebase is not configured yet. Please update src/firebase.ts");
      return;
    }
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'org_charts', 'master'), {
        nodes,
        edges,
        layoutDirection,
        roles,
        updatedAt: new Date().toISOString()
      });
      alert("クラウドに保存しました！");
    } catch (err) {
      console.error(err);
      alert("保存に失敗しました。");
    }
  };

  const loadFromCloud = async () => {
    if (!db) {
      alert("Firebase is not configured yet. Please update src/firebase.ts");
      return;
    }
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const docSnap = await getDoc(doc(db, 'org_charts', 'master'));
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.nodes) setNodes(data.nodes);
        if (data.edges) setEdges(data.edges);
        if (data.layoutDirection) setLayoutDirection(data.layoutDirection);
        if (data.roles) setRoles(data.roles);
        alert("クラウドから読み込みました！");
      } else {
        alert("保存されたデータがありません。");
      }
    } catch (err) {
      console.error(err);
      alert("読み込みに失敗しました。");
    }
  };

  return (
    <HistoryContext.Provider value={{ undo, redo, takeSnapshot, canUndo: past.length > 0, canRedo: future.length > 0 }}>
      <div className="flex flex-col h-screen w-full">
        <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center shadow-sm z-10 w-full overflow-x-auto">
          <h1 className="text-xl font-bold text-gray-800 whitespace-nowrap mr-4">組織図ツール</h1>

          <div className="flex gap-2 items-center flex-nowrap">
            {/* Undo/Redo */}
            <div className="flex items-center gap-1 border-r border-gray-300 pr-4 mr-2">
              <button
                onClick={undo}
                disabled={past.length === 0}
                className={`p-2 rounded-md transition-colors ${past.length > 0 ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'}`}
                title="元に戻す (Cmd+Z)"
              >
                <Undo2 className="w-5 h-5" />
              </button>
              <button
                onClick={redo}
                disabled={future.length === 0}
                className={`p-2 rounded-md transition-colors ${future.length > 0 ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'}`}
                title="やり直す (Cmd+Shift+Z)"
              >
                <Redo2 className="w-5 h-5" />
              </button>
            </div>

            {/* 検索窓 */}
            <div className="flex items-center gap-2 border-r border-gray-300 pr-4 mr-2 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3" />
              <input
                type="text"
                placeholder="氏名や役職で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 w-48 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-800"
              />
            </div>

            <div className="flex items-center gap-2 border-r border-gray-300 pr-4 mr-2">
              <button
                onClick={() => setIsRoleModalOpen(true)}
                className="flex items-center gap-2 bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 px-3 py-2 rounded-md shadow-sm text-sm font-medium transition-colors whitespace-nowrap"
                title="役職の定義（階層ルール）"
              >
                <Settings className="w-4 h-4" />
                設定
              </button>
            </div>

            <div className="flex items-center gap-2 border-r border-gray-300 pr-4 mr-2">
              <button
                onClick={runAutoLayout}
                className="flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-3 py-2 rounded-md shadow-sm text-sm font-medium transition-colors whitespace-nowrap"
                title="自動整列（階層ルールに基づいて並び替えます）"
              >
                <Network className="w-4 h-4" />
                自動整列
              </button>
              <button
                onClick={exportToCsv}
                className="flex items-center gap-2 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 px-3 py-2 rounded-md shadow-sm text-sm font-medium transition-colors whitespace-nowrap"
                title="CSV形式でエクスポート"
              >
                <FileDown className="w-4 h-4" />
                CSV出力
              </button>
              <CsvImporter onImport={handleCsvImport} />
              <button
                onClick={toggleLayout}
                className="flex items-center gap-2 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 px-3 py-2 rounded-md shadow-sm text-sm font-medium transition-colors whitespace-nowrap"
                title="縦横レイアウトの切り替え"
              >
                <GitCommitVertical className="w-4 h-4" />
                {layoutDirection === 'TB' ? '縦レイアウト' : '横レイアウト'}
              </button>
            </div>

            <div className="flex items-center gap-2 border-r border-gray-300 pr-4 mr-2">
              <button
                onClick={saveToCloud}
                className="flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 px-3 py-2 rounded-md shadow-sm text-sm font-medium transition-colors whitespace-nowrap"
              >
                <Cloud className="w-4 h-4" />
                保存
              </button>
              <button
                onClick={loadFromCloud}
                className="flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 px-3 py-2 rounded-md shadow-sm text-sm font-medium transition-colors whitespace-nowrap"
              >
                <CloudDownload className="w-4 h-4" />
                読込
              </button>
            </div>

            <button
              onClick={() => exportAsImage('png')}
              className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md shadow-sm text-sm font-medium transition-colors whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              PNG
            </button>
            <button
              onClick={() => exportAsImage('jpeg')}
              className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md shadow-sm text-sm font-medium transition-colors whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              JPG
            </button>
            <button
              onClick={exportAsPDF}
              className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 border border-transparent px-4 py-2 rounded-md shadow-sm text-sm font-medium transition-colors whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
          </div>
        </header>
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onNodeDragStart={() => takeSnapshot()}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              snapToGrid
              snapGrid={[15, 15]}
              defaultEdgeOptions={{ type: 'deletable', animated: false }}
            >
              <Controls />
              <MiniMap />
              <Background gap={15} size={1} />
            </ReactFlow>
          </div>
          <DetailsPanel node={selectedNode} />
        </div>
        {isRoleModalOpen && (
          <RoleSettingsModal
            roles={roles}
            onSave={setRoles}
            onClose={() => setIsRoleModalOpen(false)}
          />
        )}
      </div>
    </HistoryContext.Provider>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}
