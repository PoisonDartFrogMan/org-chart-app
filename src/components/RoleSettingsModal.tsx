import { useState } from 'react';
import { X, ArrowUp, ArrowDown, Trash2, Plus } from 'lucide-react';

interface RoleSettingsModalProps {
    roles: string[];
    onSave: (roles: string[]) => void;
    onClose: () => void;
}

export function RoleSettingsModal({ roles: initialRoles, onSave, onClose }: RoleSettingsModalProps) {
    const [roles, setRoles] = useState<string[]>(initialRoles);
    const [newRole, setNewRole] = useState('');

    const moveUp = (index: number) => {
        if (index === 0) return;
        const newRoles = [...roles];
        [newRoles[index - 1], newRoles[index]] = [newRoles[index], newRoles[index - 1]];
        setRoles(newRoles);
    };

    const moveDown = (index: number) => {
        if (index === roles.length - 1) return;
        const newRoles = [...roles];
        [newRoles[index + 1], newRoles[index]] = [newRoles[index], newRoles[index + 1]];
        setRoles(newRoles);
    };

    const removeRole = (index: number) => {
        setRoles(roles.filter((_, i) => i !== index));
    };

    const addRole = () => {
        if (newRole.trim() && !roles.includes(newRole.trim())) {
            setRoles([...roles, newRole.trim()]);
            setNewRole('');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-xl w-[400px] flex flex-col max-h-[80vh]">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-lg font-bold text-gray-800">役職の定義（階層ルール）</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto flex-1">
                    <p className="text-sm text-gray-600 mb-4">
                        自動整列時に、ここで定義された順位（上が上位）に従って階層が配置されます。
                    </p>

                    <ul className="space-y-2 mb-4">
                        {roles.map((role, index) => (
                            <li key={role} className="flex items-center justify-between bg-gray-50 border border-gray-200 p-2 rounded">
                                <span className="font-medium text-gray-800">{role}</span>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => moveUp(index)} disabled={index === 0} className="p-1 text-gray-500 hover:bg-gray-200 rounded disabled:opacity-30">
                                        <ArrowUp className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => moveDown(index)} disabled={index === roles.length - 1} className="p-1 text-gray-500 hover:bg-gray-200 rounded disabled:opacity-30">
                                        <ArrowDown className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => removeRole(index)} className="p-1 text-red-500 hover:bg-red-50 rounded ml-1">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addRole()}
                            placeholder="新しい役職を追加"
                            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                        />
                        <button onClick={addRole} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-4 border-t flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50">キャンセル</button>
                    <button onClick={() => { onSave(roles); onClose(); }} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">保存</button>
                </div>
            </div>
        </div>
    );
}
