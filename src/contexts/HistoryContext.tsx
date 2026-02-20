import { createContext, useContext } from 'react';

export interface HistoryContextType {
    undo: () => void;
    redo: () => void;
    takeSnapshot: () => void;
    canUndo: boolean;
    canRedo: boolean;
}

export const HistoryContext = createContext<HistoryContextType | null>(null);

export const useHistory = () => {
    const context = useContext(HistoryContext);
    if (!context) {
        throw new Error('useHistory must be used within a HistoryProvider');
    }
    return context;
};
