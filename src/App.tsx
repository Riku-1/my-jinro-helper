import { useState, useEffect, useCallback, useRef } from 'react';
import IconPalette from './components/IconPalette';
import GameBoard from './components/GameBoard';
import CommentSidebar from './components/CommentSidebar';
import GameTabs from './components/GameTabs';
import VoteTable from './components/VoteTable';
import PlayerManager from './components/PlayerManager';
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

export type Player = {
  number: number;
  name: string;
};

export type VoteDayInfo = {
  day: number;
  round: number;
};

export type Game = {
  id: string;
  name: string;
  boardImage: string | null;
  boardMode: 'image' | 'tile';
  boardTileCols: number | null;
  placedIcons: PlacedIcon[];
  placedComments: PlacedComment[];
  players: Player[];
  voteTable: string[][];       // voteTable[entryIndex][playerIndex]
  dayMemos: Record<number, string>; // dayMemos[logicalDay]
  voteDayInfo: VoteDayInfo[];  // voteDayInfo[entryIndex]
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

type ViewMode = 'board' | 'vote';

function getTileCols(n: number): number {
  if (n <= 1) return 1;
  if (n <= 4) return 2;
  if (n <= 9) return 3;
  return 4;
}

function newGame(name: string): Game {
  return {
    id: crypto.randomUUID(), name,
    boardImage: null, boardMode: 'tile', boardTileCols: null, placedIcons: [], placedComments: [],
    players: [],
    voteTable: Array.from({ length: 5 }, () => []),
    dayMemos: { 1: '', 2: '', 3: '', 4: '', 5: '' },
    voteDayInfo: Array.from({ length: 5 }, (_, i) => ({ day: i + 1, round: 1 })),
  };
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
    if (raw2) {
      const parsed = JSON.parse(raw2) as AppState;
      // Ensure new fields exist on old saves
      parsed.games = parsed.games.map((g) => {
        const voteDayInfo: VoteDayInfo[] = (g as any).voteDayInfo
          ?? Array.from({ length: (g.voteTable ?? []).length || 5 }, (_, i) => ({ day: i + 1, round: 1 }));
        // Migrate dayMemos: old string[] → Record<number, string>
        const rawMemos = (g as any).dayMemos;
        let dayMemos: Record<number, string>;
        if (Array.isArray(rawMemos)) {
          dayMemos = {};
          rawMemos.forEach((memo: string, i: number) => {
            const day = voteDayInfo[i]?.day ?? i + 1;
            if (!(day in dayMemos)) dayMemos[day] = memo;
          });
        } else {
          dayMemos = rawMemos ?? {};
        }
        const merged = {
          players: [] as Player[],
          voteTable: Array.from({ length: 5 }, () => [] as string[]),
          ...g,
          boardMode: ((g as any).boardMode ?? (g.boardImage ? 'image' : 'tile')) as 'image' | 'tile',
          boardTileCols: (g as any).boardTileCols ?? null,
          voteDayInfo,
          dayMemos,
        };
        return merged;
      });
      return parsed;
    }
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
  const [viewMode, setViewMode]         = useState<ViewMode>('board');
  const [splitRatio, setSplitRatio]     = useState(0.6);
  const boardContentRef = useRef<HTMLDivElement>(null);

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

  const pushHistory = useCallback(() => {
    const snap = snapshotActive();
    if (!snap) return;
    setUndoStack((h) => [...h.slice(-(MAX_HISTORY - 1)), snap]);
    setRedoStack([]);
  }, [snapshotActive]);

  const undo = useCallback(() => {
    const stack = undoStackRef.current;
    if (stack.length === 0) return;
    const target = stack[stack.length - 1];
    const snap = gamesRef.current.find((g) => g.id === target.gameId);
    if (snap) {
      setRedoStack((r) => [...r.slice(-(MAX_HISTORY - 1)), { gameId: snap.id, placedIcons: snap.placedIcons, placedComments: snap.placedComments }]);
    }
    setGames((prev) => prev.map((g) => g.id === target.gameId ? { ...g, placedIcons: target.placedIcons, placedComments: target.placedComments } : g));
    setUndoStack((h) => h.slice(0, -1));
  }, []);

  const redo = useCallback(() => {
    const stack = redoStackRef.current;
    if (stack.length === 0) return;
    const target = stack[stack.length - 1];
    const snap = gamesRef.current.find((g) => g.id === target.gameId);
    if (snap) {
      setUndoStack((h) => [...h.slice(-(MAX_HISTORY - 1)), { gameId: snap.id, placedIcons: snap.placedIcons, placedComments: snap.placedComments }]);
    }
    setGames((prev) => prev.map((g) => g.id === target.gameId ? { ...g, placedIcons: target.placedIcons, placedComments: target.placedComments } : g));
    setRedoStack((r) => r.slice(0, -1));
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [undo, redo]);

  const handleSetBoardMode = (mode: 'image' | 'tile') =>
    updateActive((g) => ({ ...g, boardMode: mode }));

  const handleSetTileCols = (cols: number | null) =>
    updateActive((g) => ({ ...g, boardTileCols: cols }));

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
    updateActive((g) => ({ ...g, placedIcons: [...g.placedIcons, { id: crypto.randomUUID(), iconDef, instanceColor: resolvedColor ?? resolveInstanceColor(iconDef, g.placedIcons), x, y }] }));
  };
  const handleMoveIcon = (id: string, x: number, y: number) => { pushHistory(); updateActive((g) => ({ ...g, placedIcons: g.placedIcons.map((icon) => (icon.id === id ? { ...icon, x, y } : icon)) })); };
  const handleRemoveIcon = (id: string) => { pushHistory(); updateActive((g) => ({ ...g, placedIcons: g.placedIcons.filter((icon) => icon.id !== id) })); };

  // Comment handlers
  const handleDropComment = (text: string, x: number, y: number) => { pushHistory(); updateActive((g) => ({ ...g, placedComments: [...g.placedComments, { id: crypto.randomUUID(), text, x, y }] })); };
  const handleMoveComment = (id: string, x: number, y: number) => { pushHistory(); updateActive((g) => ({ ...g, placedComments: g.placedComments.map((c) => (c.id === id ? { ...c, x, y } : c)) })); };
  const handleRemoveComment = (id: string) => { pushHistory(); updateActive((g) => ({ ...g, placedComments: g.placedComments.filter((c) => c.id !== id) })); };
  const handleClearAll = () => { pushHistory(); updateActive((g) => ({ ...g, placedIcons: [], placedComments: [] })); };

  // Vote handlers
  const handleUpdateVote = (day: number, pi: number, value: string) =>
    updateActive((g) => {
      const table = g.voteTable.map((r) => [...r]);
      if (table[day]) table[day][pi] = value;
      return { ...g, voteTable: table };
    });

  const handleAddDay = () =>
    updateActive((g) => {
      const maxDay = g.voteDayInfo.length > 0 ? Math.max(...g.voteDayInfo.map((d) => d.day)) : 0;
      const newDay = maxDay + 1;
      return {
        ...g,
        voteTable: [...g.voteTable, Array(g.players.length).fill('')],
        dayMemos: { ...g.dayMemos, [newDay]: '' },
        voteDayInfo: [...g.voteDayInfo, { day: newDay, round: 1 }],
      };
    });

  const handleAddRound = (dayNum: number) =>
    updateActive((g) => {
      const sameDay = g.voteDayInfo.map((info, i) => ({ info, i })).filter(({ info }) => info.day === dayNum);
      const maxRound = Math.max(...sameDay.map(({ info }) => info.round));
      const insertAt = sameDay[sameDay.length - 1].i + 1;
      const newVoteDayInfo = [...g.voteDayInfo];
      newVoteDayInfo.splice(insertAt, 0, { day: dayNum, round: maxRound + 1 });
      const newVoteTable = [...g.voteTable];
      newVoteTable.splice(insertAt, 0, Array(g.players.length).fill(''));
      return { ...g, voteDayInfo: newVoteDayInfo, voteTable: newVoteTable };
    });

  const handleRemoveDay = (dayNum: number) =>
    updateActive((g) => {
      const keepIndices = g.voteDayInfo.map((_, i) => i).filter((i) => g.voteDayInfo[i].day !== dayNum);
      const { [dayNum]: _removed, ...restMemos } = g.dayMemos;
      return {
        ...g,
        voteTable: keepIndices.map((i) => g.voteTable[i]),
        voteDayInfo: keepIndices.map((i) => g.voteDayInfo[i]),
        dayMemos: restMemos,
      };
    });

  const handleUpdateMemo = (day: number, memo: string) =>
    updateActive((g) => ({ ...g, dayMemos: { ...g.dayMemos, [day]: memo } }));

  const handleAddPlayer = () =>
    updateActive((g) => {
      const nextNum = g.players.length > 0 ? Math.max(...g.players.map((p) => p.number)) + 1 : 1;
      return {
        ...g,
        players: [...g.players, { number: nextNum, name: '' }],
        voteTable: g.voteTable.map((day) => [...day, '']),
      };
    });

  const handleRemovePlayer = (pi: number) =>
    updateActive((g) => ({
      ...g,
      players: g.players.filter((_, i) => i !== pi),
      voteTable: g.voteTable.map((day) => day.filter((_, i) => i !== pi)),
    }));

  const handleUpdatePlayer = (pi: number, player: Player) =>
    updateActive((g) => ({ ...g, players: g.players.map((p, i) => (i === pi ? player : p)) }));

  const handleImportPlayers = (newPlayers: Player[]) => {
    const hasData =
      activeGame.players.some((p) => p.name.trim() !== '') ||
      activeGame.voteTable.some((day) => day.some((v) => v.trim() !== ''));
    if (hasData) {
      if (!window.confirm('既存のプレイヤー情報や投票結果が上書きされます。続けますか？')) return;
    }
    updateActive((g) => {
      const diff = newPlayers.length - g.players.length;
      const voteTable = g.voteTable.map((day) => {
        if (diff > 0) return [...day, ...Array(diff).fill('')];
        if (diff < 0) return day.slice(0, newPlayers.length);
        return [...day];
      });
      return { ...g, players: newPlayers, voteTable };
    });
  };

  const handleSetPlayerCount = (count: number) => {
    const current = activeGame.players.length;
    if (count === current) return;

    if (count < current) {
      const removedPlayers = activeGame.players.slice(count);
      const hasName  = removedPlayers.some((p) => p.name.trim() !== '');
      const hasVotes = activeGame.voteTable.some((day) =>
        day.slice(count).some((v) => v.trim() !== ''),
      );
      if (hasName || hasVotes) {
        const ok = window.confirm(
          `${current - count}人分のプレイヤー名や投票結果が削除されます。続けますか？`,
        );
        if (!ok) return;
      }
    }

    updateActive((g) => {
      if (count > g.players.length) {
        const players = [...g.players];
        const voteTable = g.voteTable.map((day) => [...day]);
        for (let i = g.players.length; i < count; i++) {
          const num = players.length > 0 ? Math.max(...players.map((p) => p.number)) + 1 : i + 1;
          players.push({ number: num, name: '' });
          voteTable.forEach((day) => day.push(''));
        }
        return { ...g, players, voteTable };
      } else {
        return {
          ...g,
          players: g.players.slice(0, count),
          voteTable: g.voteTable.map((day) => day.slice(0, count)),
        };
      }
    });
  };

  // Game management
  const handleCreateGame = () => {
    const g = newGame(`ゲーム ${games.length + 1}`);
    setGames((prev) => [...prev, g]);
    setActiveGameId(g.id);
  };
  const handleRenameGame = (id: string, name: string) => setGames((prev) => prev.map((g) => g.id === id ? { ...g, name } : g));
  const handleDeleteGame = (id: string) => {
    setGames((prev) => {
      const remaining = prev.filter((g) => g.id !== id);
      if (activeGameIdRef.current === id) setActiveGameId(remaining[remaining.length - 1].id);
      return remaining;
    });
  };

  const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    document.body.style.cursor      = 'row-resize';
    document.body.style.userSelect  = 'none';
    const onMouseMove = (ev: MouseEvent) => {
      if (!boardContentRef.current) return;
      const rect = boardContentRef.current.getBoundingClientRect();
      setSplitRatio(Math.max(0.15, Math.min(0.85, (ev.clientY - rect.top) / rect.height)));
    };
    const onMouseUp = () => {
      document.body.style.cursor     = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, []);

  const hasAnyPlacement = activeGame.placedIcons.length > 0 || activeGame.placedComments.length > 0;
  const effectiveTileCols = activeGame.boardTileCols ?? getTileCols(activeGame.players.length);

  return (
    <div className="app">
      <aside className="sidebar">
        <h1 className="app-title">人狼ヘルパー</h1>
        <IconPalette placedIcons={activeGame.placedIcons} />
        <div className="controls">
          <div className="board-mode-row">
            <span className="board-mode-label">ボード</span>
            <div className="btn-row" style={{ flex: 1 }}>
              <button
                className={`btn btn-half ${activeGame.boardMode === 'tile' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleSetBoardMode('tile')}
              >タイル</button>
              <button
                className={`btn btn-half ${activeGame.boardMode === 'image' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleSetBoardMode('image')}
              >画像</button>
            </div>
          </div>
          {activeGame.boardMode === 'tile' && activeGame.players.length > 0 && (
            <div className="tile-cols-row">
              <span className="board-mode-label">列数</span>
              <div className="tile-cols-ctrl">
                <button
                  className="tile-cols-btn"
                  onClick={() => handleSetTileCols(Math.max(1, effectiveTileCols - 1))}
                >−</button>
                <span className="tile-cols-val">{effectiveTileCols}</span>
                <button
                  className="tile-cols-btn"
                  onClick={() => handleSetTileCols(Math.min(activeGame.players.length, effectiveTileCols + 1))}
                >＋</button>
                {activeGame.boardTileCols !== null && (
                  <button className="tile-cols-reset" onClick={() => handleSetTileCols(null)}>自動</button>
                )}
              </div>
            </div>
          )}
          <label className="btn btn-primary">
            画像を選択
            <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
          </label>
          {hasAnyPlacement && (
            <button className="btn btn-secondary" onClick={handleClearAll}>配置をクリア</button>
          )}
          {activeGame.boardImage && (
            <button className="btn btn-danger" onClick={() => updateActive((g) => ({ ...g, boardImage: null, placedIcons: [], placedComments: [] }))}>
              全リセット
            </button>
          )}
          {undoStack.length > 0 && (
            <button className="btn btn-secondary" onClick={undo}>元に戻す (Ctrl+Z)</button>
          )}
          {redoStack.length > 0 && (
            <button className="btn btn-secondary" onClick={redo}>やり直す (Ctrl+Y)</button>
          )}
        </div>
      </aside>

      <div className="board-area">
        <GameTabs
          games={games}
          activeGameId={activeGameId}
          viewMode={viewMode}
          onSwitch={setActiveGameId}
          onCreate={handleCreateGame}
          onRename={handleRenameGame}
          onDelete={handleDeleteGame}
          onSetView={setViewMode}
        />
        {viewMode === 'board' ? (
          <div className="board-content" ref={boardContentRef}>
            <div className="board-top" style={{ flex: splitRatio }}>
              <GameBoard
                layoutVersion={splitRatio}
                image={activeGame.boardImage}
                boardMode={activeGame.boardMode}
                players={activeGame.players}
                tileCols={effectiveTileCols}
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
            <div className="board-divider" onMouseDown={handleDividerMouseDown} />
            <div className="board-bottom" style={{ flex: 1 - splitRatio }}>
              <VoteTable
                players={activeGame.players}
                voteTable={activeGame.voteTable}
                voteDayInfo={activeGame.voteDayInfo}
                dayMemos={activeGame.dayMemos}
                onUpdateVote={handleUpdateVote}
                onAddDay={handleAddDay}
                onAddRound={handleAddRound}
                onRemoveDay={handleRemoveDay}
                onUpdateMemo={handleUpdateMemo}
              />
            </div>
          </div>
        ) : (
          <PlayerManager
            players={activeGame.players}
            onAddPlayer={handleAddPlayer}
            onRemovePlayer={handleRemovePlayer}
            onUpdatePlayer={handleUpdatePlayer}
            onSetPlayerCount={handleSetPlayerCount}
            onImportPlayers={handleImportPlayers}
          />
        )}
      </div>

      <CommentSidebar />
    </div>
  );
}
