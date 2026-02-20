import { Handle, Position } from '@xyflow/react';

export function PersonNode({ data }: { data: { name: string; role: string } }) {
    return (
        <div className="bg-white shadow-md rounded-md border border-gray-200 overflow-hidden min-w-[180px]">
            <Handle type="target" position={Position.Top} className="w-2 h-2 bg-green-500" />
            <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">{data.role}</div>
            </div>
            <div className="px-4 py-3">
                <div className="font-bold text-gray-800">{data.name}</div>
            </div>
            <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-green-500" />
        </div>
    );
}
