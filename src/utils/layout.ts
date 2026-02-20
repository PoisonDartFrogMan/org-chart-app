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

    const getRank = (n: Node) => {
        if (n.type !== 'person' || !n.data.role) return 999;
        const idx = roles.indexOf(String(n.data.role));
        return idx === -1 ? 999 : idx;
    };

    // nodes をDagreに登録（ここでソートした順に登録することで、ある程度Dagreの初期配置順に影響を与えられる）
    const sortedVisibleNodes = [...visibleNodes].sort((a, b) => getRank(a) - getRank(b));
    sortedVisibleNodes.forEach((node) => {
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

    const edgeMinLens = new Map<string, number>();

    // 親ごとに子ノードを処理
    Object.values(childrenByParent).forEach((children) => {
        // 縦の階層（minlen）をつける処理
        const ranks = Array.from(new Set(children.map(getRank))).sort((a, b) => a - b);
        children.forEach((child) => {
            const childRank = getRank(child);
            const rankIndex = ranks.indexOf(childRank);
            edgeMinLens.set(child.id, rankIndex + 1);
        });

        // 兄弟間での「横並び」を強制するための見えないエッジ（ダミーエッジ）を追加
        // 同じ親を持つ子たちをランク順 → 同じランクなら名前順等でソート
        const sortedChildren = [...children].sort((a, b) => {
            const rankA = getRank(a);
            const rankB = getRank(b);
            if (rankA !== rankB) return rankA - rankB;
            // ランクが同じならIDでソート（常に同じ並び順を担保するため）
            return a.id.localeCompare(b.id);
        });

        // 左から右（または上から下）へ順番に並べるために、兄弟間に weight の高いエッジをこっそり張る
        for (let i = 0; i < sortedChildren.length - 1; i++) {
            const current = sortedChildren[i];
            const next = sortedChildren[i + 1];
            // 実際の React Flow のエッジには表示されないが、Dagre には計算させる
            dagreGraph.setEdge(current.id, next.id, { weight: 10, minlen: 0 });
        }
    });

    visibleEdges.forEach((edge) => {
        const minlen = edgeMinLens.get(edge.target) || 1;
        // 既存の実際の親子エッジを設定（子の表示順を担保するため weight を少し下げる）
        dagreGraph.setEdge(edge.source, edge.target, { minlen, weight: 1 });
    });

    dagre.layout(dagreGraph);

    // Dagre returns absolute positions. Convert back to relative positions for child nodes.
    const newNodes = nodes.map((node) => {
        if (node.hidden) return node;

        const nodeWithPosition = dagreGraph.node(node.id);
        if (!nodeWithPosition) return node;

        const width = node.type === 'organization' ? 150 : 200;
        const height = node.type === 'organization' ? 80 : 100;

        let absolutePosition = {
            x: nodeWithPosition.x - width / 2,
            y: nodeWithPosition.y - height / 2,
        };

        let finalPosition = absolutePosition;

        // If the node has a parentId, it needs relative coordinates based on the parent's absolute coordinates calculated by Dagre.
        if (node.parentId) {
            const parentDagreNode = dagreGraph.node(node.parentId);
            if (parentDagreNode) {
                const parentWidth = nodes.find(n => n.id === node.parentId)?.type === 'organization' ? 150 : 200;
                const parentHeight = nodes.find(n => n.id === node.parentId)?.type === 'organization' ? 80 : 100;

                const parentAbsolutePosition = {
                    x: parentDagreNode.x - parentWidth / 2,
                    y: parentDagreNode.y - parentHeight / 2,
                };

                finalPosition = {
                    x: absolutePosition.x - parentAbsolutePosition.x,
                    y: absolutePosition.y - parentAbsolutePosition.y
                };
            }
        }

        const newNode: Node = {
            ...node,
            targetPosition: isHorizontal ? Position.Left : Position.Top,
            sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
            position: finalPosition,
        };

        return newNode;
    });

    return { nodes: newNodes, edges };
};
