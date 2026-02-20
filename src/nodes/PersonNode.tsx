import { Handle, Position } from '@xyflow/react';
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

export function PersonNode({ data }: { data: PersonData }) {
    const isMatch = !!data.searchQuery && (
        data.name.toLowerCase().includes(data.searchQuery.toLowerCase()) ||
        data.role.toLowerCase().includes(data.searchQuery.toLowerCase()) ||
        (data.department || '').toLowerCase().includes(data.searchQuery.toLowerCase())
    );

    return (
        <div className={`bg-white shadow-md rounded-md min-w-[180px] transition-all relative ${isMatch ? 'border-4 border-blue-500 ring-4 ring-blue-200' : 'border border-gray-200'
            }`}>
            <Handle type="target" position={Position.Top} className="w-2 h-2 bg-green-500" />
            <div className={`px-4 py-2 border-b border-gray-200 rounded-t-md ${isMatch ? 'bg-blue-50' : 'bg-gray-100'}`}>
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">{data.role}</div>
            </div>
            <div className="px-4 py-3 pb-4 rounded-b-md bg-white">
                <div className="font-bold text-gray-800">{data.name}</div>
            </div>
            <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-green-500" />

            {data.hasChildren && (
                <button
                    className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white border border-gray-300 rounded-full p-0.5 shadow-sm hover:bg-gray-50 text-gray-600 z-10 cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); data.onToggleCollapse?.(); }}
                >
                    {data.isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
            )}
        </div>
    );
}
