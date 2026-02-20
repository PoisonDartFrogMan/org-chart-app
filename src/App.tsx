import { useState, useRef, useCallback } from 'react';
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
import { Download } from 'lucide-react';

import { Sidebar } from './components/Sidebar';
import { OrganizationNode } from './nodes/OrganizationNode';
import { PersonNode } from './nodes/PersonNode';

const nodeTypes = {
  organization: OrganizationNode,
  person: PersonNode,
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

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges],
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
            ? { label: '新規組織' }
            : { name: '新規メンバー', role: '役職' },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes],
  );

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
      .then((dataUrl) => {
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
      .then((dataUrl) => {
        const pdf = new jsPDF({
          orientation: width > height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [width, height],
        });
        pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
        pdf.save('org-chart.pdf');
      })
      .catch((err) => {
        console.error('oops, something went wrong!', err);
      });
  }, []);

  return (
    <div className="flex flex-col h-screen w-full">
      <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center shadow-sm z-10">
        <h1 className="text-xl font-bold text-gray-800">組織図作成ツール</h1>
        <div className="flex gap-2">
          <button
            onClick={() => exportAsImage('png')}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md shadow-sm text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            PNG
          </button>
          <button
            onClick={() => exportAsImage('jpeg')}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md shadow-sm text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            JPG
          </button>
          <button
            onClick={exportAsPDF}
            className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 border border-transparent px-4 py-2 rounded-md shadow-sm text-sm font-medium transition-colors"
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
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
            defaultEdgeOptions={{ animated: false }}
          >
            <Controls />
            <MiniMap />
            <Background gap={15} size={1} />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}
