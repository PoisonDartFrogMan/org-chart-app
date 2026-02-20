import { useState, useRef, useEffect } from 'react';
import { Handle, Position, useReactFlow, useNodeId, NodeResizer } from '@xyflow/react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface PersonData {
    name: string;
    role: string;
    department?: string;
    gender?: string;
    age?: string;
    searchQuery?: string;
    hasChildren?: boolean;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

export function PersonNode({ data, selected }: { data: PersonData, selected?: boolean }) {
    const isMatch = !!data.searchQuery && (
        data.name.toLowerCase().includes(data.searchQuery.toLowerCase()) ||
        data.role.toLowerCase().includes(data.searchQuery.toLowerCase()) ||
        (data.department || '').toLowerCase().includes(data.searchQuery.toLowerCase())
    );

    const [editingField, setEditingField] = useState<'none' | 'name' | 'role'>('none');
    const [editValue, setEditValue] = useState('');
    const { setNodes } = useReactFlow();
    const nodeId = useNodeId();
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editingField !== 'none' && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editingField]);

    const startEditing = (field: 'name' | 'role', initialValue: string) => {
        setEditingField(field);
        setEditValue(initialValue);
    };

    const saveEdit = () => {
        if (editingField === 'none') return;

        const fieldToUpdate = editingField;
        const newValue = editValue.trim() !== '' ? editValue : data[editingField];
        setEditingField('none');

        if (newValue !== data[fieldToUpdate] && nodeId) {
            setNodes((nds) =>
                nds.map((n) => {
                    if (n.id === nodeId) {
                        return { ...n, data: { ...n.data, [fieldToUpdate]: newValue } };
                    }
                    return n;
                })
            );
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') saveEdit();
        if (e.key === 'Escape') {
            setEditingField('none');
        }
    };

    return (
        <>
            <NodeResizer color="#22c55e" isVisible={selected} minWidth={180} minHeight={80} />
            <div className={`bg-white shadow-md rounded-md min-w-[180px] w-full h-full transition-all relative flex flex-col ${isMatch ? 'border-4 border-blue-500 ring-4 ring-blue-200' : 'border border-gray-200'
                }`}>
                <Handle type="target" position={Position.Top} className="w-2 h-2 bg-green-500" />

                <div className={`px-4 py-2 border-b border-gray-200 rounded-t-md ${isMatch ? 'bg-blue-50' : 'bg-gray-100'}`}>
                    {editingField === 'role' ? (
                        <input
                            ref={inputRef}
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={saveEdit}
                            onKeyDown={handleKeyDown}
                            className="text-xs font-medium tracking-wider w-full bg-transparent border-b-2 border-blue-500 focus:outline-none nodrag"
                        />
                    ) : (
                        <div
                            className="text-xs text-gray-500 font-medium uppercase tracking-wider cursor-text hover:bg-gray-200 rounded px-1 -mx-1"
                            onDoubleClick={() => startEditing('role', data.role)}
                            title="ダブルクリックして編集"
                        >
                            {data.role || '役職'}
                        </div>
                    )}
                </div>

                <div className="px-4 py-3 pb-4 rounded-b-md bg-white flex-1 flex flex-col justify-center">
                    {editingField === 'name' ? (
                        <input
                            ref={inputRef}
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={saveEdit}
                            onKeyDown={handleKeyDown}
                            className="font-bold text-gray-800 w-full bg-transparent border-b-2 border-blue-500 focus:outline-none nodrag"
                        />
                    ) : (
                        <div
                            className="font-bold text-gray-800 cursor-text hover:bg-gray-50 rounded px-1 -mx-1"
                            onDoubleClick={() => startEditing('name', data.name)}
                            title="ダブルクリックして編集"
                        >
                            {data.name || '氏名'}
                        </div>
                    )}
                </div>

                <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-green-500" />

                {data.hasChildren && (
                    <button
                        className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white border border-gray-300 rounded-full p-0.5 shadow-sm hover:bg-gray-50 text-gray-600 z-10 cursor-pointer nodrag"
                        onClick={(e) => { e.stopPropagation(); data.onToggleCollapse?.(); }}
                    >
                        {data.isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                )}
            </div>
        </>
    );
}
