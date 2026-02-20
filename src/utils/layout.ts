import dagre from 'dagre';
import { Position } from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';

export const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB', roles: string[] = []) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // 横方向か縦方向かを設定。TB = Top to Bottom, LR = Left to Right
    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({ rankdir: direction });

    const visibleNodes = nodes.filter(n => !n.hidden);
    const visibleEdges = edges.filter(e => !e.hidden);

    visibleNodes.forEach((node) => {
        // ノードの予想される幅・高さを設定
        const width = node.type === 'organization' ? 150 : 200;
        const height = node.type === 'organization' ? 80 : 100;
        dagreGraph.setNode(node.id, { width, height });
    });

    const parentMap: Record<string, string> = {};
    edges.forEach((edge) => {
        parentMap[edge.target] = edge.source;
    });

    const childrenByParent: Record<string, Node[]> = {};
    visibleNodes.forEach((node) => {
        const parentId = parentMap[node.id];
        if (parentId) {
            if (!childrenByParent[parentId]) childrenByParent[parentId] = [];
            childrenByParent[parentId].push(node);
        }
    });

    const getRank = (n: Node) => {
        if (n.type !== 'person' || !n.data.role) return 999;
        const idx = roles.indexOf(String(n.data.role));
        return idx === -1 ? 999 : idx;
    };

    const edgeMinLens = new Map<string, number>();

    Object.values(childrenByParent).forEach((children) => {
        const ranks = Array.from(new Set(children.map(getRank))).sort((a, b) => a - b);
        children.forEach((child) => {
            const childRank = getRank(child);
            const rankIndex = ranks.indexOf(childRank);
            edgeMinLens.set(child.id, rankIndex + 1);
        });
    });

    visibleEdges.forEach((edge) => {
        const minlen = edgeMinLens.get(edge.target) || 1;
        dagreGraph.setEdge(edge.source, edge.target, { minlen });
    });

    dagre.layout(dagreGraph);

    const newNodes = nodes.map((node) => {
        if (node.hidden) return node;

        const nodeWithPosition = dagreGraph.node(node.id);
        if (!nodeWithPosition) return node;

        const width = node.type === 'organization' ? 150 : 200;
        const height = node.type === 'organization' ? 80 : 100;

        // dagreは中心座標を返すため、左上基準に補正
        const newNode = {
            ...node,
            targetPosition: isHorizontal ? Position.Left : Position.Top,
            sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
            position: {
                x: nodeWithPosition.x - width / 2,
                y: nodeWithPosition.y - height / 2,
            },
        };

        return newNode;
    });

    return { nodes: newNodes as Node[], edges };
};
