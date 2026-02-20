import { useState, useRef, useEffect } from 'react';
import { Handle, Position, useReactFlow, useNodeId, NodeResizer } from '@xyflow/react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useHistory } from '../contexts/HistoryContext';

export function OrganizationNode({ data, selected }: { data: { label: string; searchQuery?: string; hasChildren?: boolean; isCollapsed?: boolean; onToggleCollapse?: () => void }, selected?: boolean }) {
    const isMatch = !!data.searchQuery && data.label.toLowerCase().includes(data.searchQuery.toLowerCase());
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(data.label);
    const { setNodes } = useReactFlow();
    const nodeId = useNodeId();
    const inputRef = useRef<HTMLInputElement>(null);
    const { takeSnapshot } = useHistory();

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const onSave = () => {
        setIsEditing(false);
        if (editValue.trim() !== '' && editValue !== data.label && nodeId) {
            takeSnapshot();
            setNodes((nds) =>
                nds.map((n) => {
                    if (n.id === nodeId) {
                        return { ...n, data: { ...n.data, label: editValue } };
                    }
                    return n;
                })
            );
        } else {
            setEditValue(data.label);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') onSave();
        if (e.key === 'Escape') {
            setEditValue(data.label);
            setIsEditing(false);
        }
    };

    return (
        <>
            <NodeResizer color="#3b82f6" isVisible={selected} minWidth={150} minHeight={50} />
            <div className={`bg-white shadow-md rounded-md px-6 py-4 min-w-[150px] w-full h-full text-center transition-all relative ${isMatch ? 'border-4 border-blue-500 ring-4 ring-blue-200' : 'border border-gray-200 hover:border-blue-400'
                }`}>
                <Handle type="target" position={Position.Top} className="w-2 h-2 bg-blue-500" />

                {isEditing ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={onSave}
                        onKeyDown={handleKeyDown}
                        className="font-bold text-gray-800 text-lg w-full text-center border-b-2 border-blue-500 focus:outline-none bg-transparent nodrag"
                    />
                ) : (
                    <div
                        className="font-bold text-gray-800 text-lg cursor-text hover:bg-gray-50 rounded px-1 -mx-1"
                        onDoubleClick={() => { setIsEditing(true); setEditValue(data.label); }}
                        title="ダブルクリックして編集"
                    >
                        {data.label}
                    </div>
                )}

                <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-blue-500" />

                {data.hasChildren && (
                    <button
                        className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white border border-gray-300 rounded-full p-0.5 shadow-sm hover:bg-gray-50 text-gray-600 z-10 cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); data.onToggleCollapse?.(); }}
                    >
                        {data.isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                )}
            </div>
        </>
    );
}
