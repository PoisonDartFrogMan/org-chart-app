import { Handle, Position } from '@xyflow/react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export function OrganizationNode({ data }: { data: { label: string; searchQuery?: string; hasChildren?: boolean; isCollapsed?: boolean; onToggleCollapse?: () => void } }) {
    const isMatch = !!data.searchQuery && data.label.toLowerCase().includes(data.searchQuery.toLowerCase());

    return (
        <div className={`bg-white shadow-md rounded-md px-6 py-4 min-w-[150px] text-center transition-all relative ${isMatch ? 'border-4 border-blue-500 ring-4 ring-blue-200' : 'border border-gray-200 hover:border-blue-400'
            }`}>
            <Handle type="target" position={Position.Top} className="w-2 h-2 bg-blue-500" />
            <div className="font-bold text-gray-800 text-lg">{data.label}</div>
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
    );
}
