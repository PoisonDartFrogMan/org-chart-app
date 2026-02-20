import { Handle, Position } from '@xyflow/react';

export function OrganizationNode({ data }: { data: { label: string } }) {
    return (
        <div className="bg-white shadow-md rounded-md border border-gray-200 px-6 py-4 min-w-[150px] text-center">
            <Handle type="target" position={Position.Top} className="w-2 h-2 bg-blue-500" />
            <div className="font-bold text-gray-800 text-lg">{data.label}</div>
            <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-blue-500" />
        </div>
    );
}
