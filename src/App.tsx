import { useState, useEffect, useCallback, useRef } from 'react';
import IconPalette from './components/IconPalette';
import GameBoard from './components/GameBoard';
import CommentSidebar from './components/CommentSidebar';
import GameTabs from './components/GameTabs';
import type { IconDef } from './constants/icons';
import './App.css';

const STORAGE_KEY_V1 = 'jinro-helper-v1';
const STORAGE_KEY_V2 = 'jinro-helper-v2';
const MAX_HISTORY = 50;

export type PlacedIcon = {
  id: string;
  iconDef: IconDef;
  instanceColor: string;
  x: number;
  y: number;
};

export type PlacedComment = {
  id: string;
  text: string;
  x: number;
  y: number;
};

export type Game = {
  id: string;
  name: string;
  boardImage: string | null;
  placedIcons: PlacedIcon[];
  placedComments: PlacedComment[];
};

type AppState = {
  games: Game[];
  activeGameId: string;
};

type HistoryEntry = {
  gameId: string;
  placedIcons: PlacedIcon[];
  placedComments: PlacedComment[];
};

function newGame(name: string): Game {
  return { id: crypto.randomUUID(), name, boardImage: null, placedIcons: [], placedComments: [] };
}

function resolveInstanceColor(iconDef: IconDef, prev: PlacedIcon[]): string {
  if (!iconDef.colors) return iconDef.color;
  const count = prev.filter((p) => p.iconDef.id === iconDef.id).length;
  if (count < iconDef.colors.length) return iconDef.colors[count];
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 40%)`;
}

function loadState(): AppState {
  try {
    const raw2 = localStorage.getItem(STORAGE_KEY_V2);
    if (raw2) return JSON.parse(raw2) as AppState;

    const raw1 = localStorage.getItem(STORAGE_KEY_V1);
    const g = newGame('ゲーム 1');
    if (raw1) {
      const v1 = JSON.parse(raw1) as Partial<Game>;
      g.boardImage     = v1.boardImage     ?? null;
      g.placedIcons    = v1.placedIcons    ?? [];
      g.placedComments = v1.placedComments ?? [];
    }
    return { games: [g], activeGameId: g.id };
  } catch {
    const g = newGame('ゲーム 1');
    return { games: [g], activeGameId: g.id };
  }
}

export default function App() {
  const initial = loadState();
  const [games, setGames]               = useState<Game[]>(initial.games);
  const [activeGameId, setActiveGameId] = useState<string>(initial.activeGameId);
  const [undoStack, setUndoStack]       = useState<HistoryEntry[]>([]);
  const [redoStack, setRedoStack]       = useState<HistoryEntry[]>([]);

  const activeGameIdRef = useRef(activeGameId);
  useEffect(() => { activeGameIdRef.current = activeGameId; }, [activeGameId]);

  const gamesRef = useRef(games);
  useEffect(() => { gamesRef.current = games; }, [games]);

  const undoStackRef = useRef(undoStack);
  useEffect(() => { undoStackRef.current = undoStack; }, [undoStack]);

  const redoStackRef = useRef(redoStack);
  useEffect(() => { redoStackRef.current = redoStack; }, [redoStack]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify({ games, activeGameId }));
  }, [games, activeGameId]);

  const activeGame = games.find((g) => g.id === activeGameId) ?? games[0];

  const updateActive = useCallback((updater: (g: Game) => Game) => {
    setGames((prev) => prev.map((g) => g.id === activeGameIdRef.current ? updater(g) : g));
  }, []);

  const snapshotActive = useCallback((): HistoryEntry | null => {
    const current = gamesRef.current.find((g) => g.id === activeGameIdRef.current);
    if (!current) return null;
    return { gameId: current.id, placedIcons: current.placedIcons, placedComments: current.placedComments };
  }, []);

  // Push current state to undo stack and clear redo stack
  const pushHistory = useCallback(() => {
    const snap = snapshotActive();
    if (!snap) return;
    setUndoStack((h) => [...h.slice(-(MAX_HISTORY - 1)), snap]);
    setRedoStack([]);
  }, [snapshotActive]);

  // Undo: restore last undo entry, push current state to redo stack
  const undo = useCallback(() => {
    const stack = undoStackRef.current;
    if (stack.length === 0) return;
    const target = stack[stack.length - 1];

    const snap = gamesRef.current.find((g) => g.id === target.gameId);
    if (snap) {
      setRedoStack((r) => [
        ...r.slice(-(MAX_HISTORY - 1)),
        { gameId: snap.id, placedIcons: snap.placedIcons, placedComments: snap.placedComments },
      ]);
    }
    setGames((prev) => prev.map((g) =>
      g.id === target.gameId
        ? { ...g, placedIcons: target.placedIcons, placedComments: target.placedComments }
        : g,
    ));
    setUndoStack((h) => h.slice(0, -1));
  }, []);

  // Redo: restore last redo entry, push current state to undo stack
  const redo = useCallback(() => {
    const stack = redoStackRef.current;
    if (stack.length === 0) return;
    const target = stack[stack.length - 1];

    const snap = gamesRef.current.find((g) => g.id === target.gameId);
    if (snap) {
      setUndoStack((h) => [
        ...h.slice(-(MAX_HISTORY - 1)),
        { gameId: snap.id, placedIcons: snap.placedIcons, placedComments: snap.placedComments },
      ]);
    }
    setGames((prev) => prev.map((g) =>
      g.id === target.gameId
        ? { ...g, placedIcons: target.placedIcons, placedComments: target.placedComments }
        : g,
    ));
    setRedoStack((r) => r.slice(0, -1));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [undo, redo]);

  // Image
  const readImageFile = useCallback((file: File | null | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => updateActive((g) => ({ ...g, boardImage: ev.target?.result as string }));
    reader.readAsDataURL(file);
  }, [updateActive]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) =>
    readImageFile(e.target.files?.[0]);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const item = Array.from(e.clipboardData?.items ?? []).find((i) => i.type.startsWith('image/'));
    if (item) readImageFile(item.getAsFile());
  }, [readImageFile]);

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  // Icon handlers
  const handleDropIcon = (iconDef: IconDef, x: number, y: number, resolvedColor?: string) => {
    pushHistory();
    updateActive((g) => ({
      ...g,
      placedIcons: [
        ...g.placedIcons,
        { id: crypto.randomUUID(), iconDef, instanceColor: resolvedColor ?? resolveInstanceColor(iconDef, g.placedIcons), x, y },
      ],
    }));
  };

  const handleMoveIcon = (id: string, x: number, y: number) => {
    pushHistory();
    updateActive((g) => ({ ...g, placedIcons: g.placedIcons.map((icon) => (icon.id === id ? { ...icon, x, y } : icon)) }));
  };

  const handleRemoveIcon = (id: string) => {
    pushHistory();
    updateActive((g) => ({ ...g, placedIcons: g.placedIcons.filter((icon) => icon.id !== id) }));
  };

  // Comment handlers
  const handleDropComment = (text: string, x: number, y: number) => {
    pushHistory();
    updateActive((g) => ({ ...g, placedComments: [...g.placedComments, { id: crypto.randomUUID(), text, x, y }] }));
  };

  const handleMoveComment = (id: string, x: number, y: number) => {
    pushHistory();
    updateActive((g) => ({ ...g, placedComments: g.placedComments.map((c) => (c.id === id ? { ...c, x, y } : c)) }));
  };

  const handleRemoveComment = (id: string) => {
    pushHistory();
    updateActive((g) => ({ ...g, placedComments: g.placedComments.filter((c) => c.id !== id) }));
  };

  const handleClearAll = () => {
    pushHistory();
    updateActive((g) => ({ ...g, placedIcons: [], placedComments: [] }));
  };

  // Game management
  const handleCreateGame = () => {
    const g = newGame(`ゲーム ${games.length + 1}`);
    setGames((prev) => [...prev, g]);
    setActiveGameId(g.id);
  };

  const handleRenameGame = (id: string, name: string) =>
    setGames((prev) => prev.map((g) => g.id === id ? { ...g, name } : g));

  const handleDeleteGame = (id: string) => {
    setGames((prev) => {
      const remaining = prev.filter((g) => g.id !== id);
      if (activeGameIdRef.current === id) setActiveGameId(remaining[remaining.length - 1].id);
      return remaining;
    });
  };

  const hasAnyPlacement = activeGame.placedIcons.length > 0 || activeGame.placedComments.length > 0;

  return (
    <div className="app">
      <aside className="sidebar">
        <h1 className="app-title">人狼ヘルパー</h1>
        <IconPalette placedIcons={activeGame.placedIcons} />
        <div className="controls">
          <label className="btn btn-primary">
            画像を選択
            <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
          </label>
          {hasAnyPlacement && (
            <button className="btn btn-secondary" onClick={handleClearAll}>
              配置をクリア
            </button>
          )}
          {activeGame.boardImage && (
            <button
              className="btn btn-danger"
              onClick={() => updateActive((g) => ({ ...g, boardImage: null, placedIcons: [], placedComments: [] }))}
            >
              全リセット
            </button>
          )}
          {undoStack.length > 0 && (
            <button className="btn btn-secondary" onClick={undo}>
              元に戻す (Ctrl+Z)
            </button>
          )}
          {redoStack.length > 0 && (
            <button className="btn btn-secondary" onClick={redo}>
              やり直す (Ctrl+Y)
            </button>
          )}
        </div>
      </aside>

      <div className="board-area">
        <GameTabs
          games={games}
          activeGameId={activeGameId}
          onSwitch={setActiveGameId}
          onCreate={handleCreateGame}
          onRename={handleRenameGame}
          onDelete={handleDeleteGame}
        />
        <GameBoard
          image={activeGame.boardImage}
          placedIcons={activeGame.placedIcons}
          placedComments={activeGame.placedComments}
          onDropIcon={handleDropIcon}
          onMoveIcon={handleMoveIcon}
          onRemoveIcon={handleRemoveIcon}
          onDropComment={handleDropComment}
          onMoveComment={handleMoveComment}
          onRemoveComment={handleRemoveComment}
        />
      </div>

      <CommentSidebar />
    </div>
  );
}
