import type { Node } from '@xyflow/react';

interface DetailsPanelProps {
    node: Node | null;
}

export function DetailsPanel({ node }: DetailsPanelProps) {
    if (!node || node.type !== 'person') {
        return (
            <aside className="w-64 bg-white border-l border-gray-200 p-4 flex flex-col gap-4">
                <div className="font-semibold text-gray-700 text-lg border-b pb-2">
                    詳細情報
                </div>
                <div className="text-sm text-gray-500 mt-4">
                    キャンバス上の「人」ノードをクリックすると、ここに詳細が表示されます。
                </div>
            </aside>
        );
    }

    const { name, role, department, gender, age } = node.data;

    return (
        <aside className="w-64 bg-white border-l border-gray-200 p-4 flex flex-col gap-4 overflow-y-auto">
            <div className="font-semibold text-gray-700 text-lg border-b pb-2">
                詳細情報
            </div>
            <div className="flex flex-col gap-3 mt-2">
                <div>
                    <label className="text-xs text-gray-500 font-medium">氏名</label>
                    <div className="text-gray-900 font-medium">{String(name || '未設定')}</div>
                </div>
                <div>
                    <label className="text-xs text-gray-500 font-medium">役職</label>
                    <div className="text-gray-900">{String(role || '未設定')}</div>
                </div>
                <div>
                    <label className="text-xs text-gray-500 font-medium">部門</label>
                    <div className="text-gray-900">{String(department || '未設定')}</div>
                </div>
                <div>
                    <label className="text-xs text-gray-500 font-medium">性別</label>
                    <div className="text-gray-900">{String(gender || '未設定')}</div>
                </div>
                <div>
                    <label className="text-xs text-gray-500 font-medium">年齢</label>
                    <div className="text-gray-900">{String(age || '未設定')}</div>
                </div>
            </div>
        </aside>
    );
}
