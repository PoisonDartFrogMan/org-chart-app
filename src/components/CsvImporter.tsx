import { useRef } from 'react';
import Papa from 'papaparse';
import type { Node, Edge } from '@xyflow/react';
import { Upload } from 'lucide-react';

interface CsvRow {
    ID: string;
    氏名: string;
    役職: string;
    部門: string;
    性別: string;
    年齢: string;
    上司ID: string;
}

interface CsvImporterProps {
    onImport: (nodes: Node[], edges: Edge[]) => void;
}

export function CsvImporter({ onImport }: CsvImporterProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        Papa.parse<CsvRow>(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const nodes: Node[] = [];
                const edges: Edge[] = [];

                results.data.forEach((row) => {
                    if (!row.ID || !row.氏名) return; // IDと氏名は必須とする

                    // ノードの作成
                    nodes.push({
                        id: row.ID,
                        type: 'person',
                        position: { x: 0, y: 0 }, // 座表は後のdagreレイアウトで計算される
                        data: {
                            name: row.氏名,
                            role: row.役職 || '',
                            department: row.部門 || '',
                            gender: row.性別 || '',
                            age: row.年齢 || '',
                        },
                    });

                    // エッジの作成 (上司IDがある場合)
                    if (row.上司ID && row.上司ID.trim() !== '') {
                        edges.push({
                            id: `edge_${row.上司ID}_${row.ID}`,
                            source: row.上司ID,
                            target: row.ID,
                            animated: true,
                        });
                    }
                });

                onImport(nodes, edges);

                // inputをリセット
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            },
            error: (error) => {
                console.error('CSV Parsing Error:', error);
                alert('CSVファイルの読み込みに失敗しました。ヘッダー形式をご確認ください。');
            }
        });
    };

    return (
        <div>
            <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
            />
            <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-3 py-2 rounded-md shadow-sm text-sm font-medium transition-colors"
            >
                <Upload className="w-4 h-4" />
                CSV読込
            </button>
        </div>
    );
}
