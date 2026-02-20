import { Building2, User } from 'lucide-react';

const nodeTypes = [
    { type: 'organization', label: '組織を追加', icon: Building2 },
    { type: 'person', label: '人を追加', icon: User },
];

export function Sidebar() {
    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <aside className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col gap-4">
            <div className="font-semibold text-gray-700 text-lg border-b pb-2">
                アイテム
            </div>
            <div className="flex flex-col gap-3">
                {nodeTypes.map((node) => (
                    <div
                        key={node.type}
                        className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50 cursor-grab hover:bg-blue-50 hover:border-blue-200 transition-colors"
                        onDragStart={(event) => onDragStart(event, node.type)}
                        draggable
                    >
                        <node.icon className="w-5 h-5 text-gray-500" />
                        <span className="text-gray-700 font-medium">{node.label}</span>
                    </div>
                ))}
            </div>
            <div className="mt-auto pt-4 border-t text-sm text-gray-500">
                アイテムをドラッグ＆ドロップしてキャンバスに追加します
            </div>
        </aside>
    );
}
