import { useState, useEffect, useCallback } from 'react';
import IconPalette from './components/IconPalette';
import GameBoard from './components/GameBoard';
import CommentSidebar from './components/CommentSidebar';
import type { IconDef } from './constants/icons';
import './App.css';

const STORAGE_KEY = 'jinro-helper-v1';

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

type SavedState = {
  boardImage: string | null;
  placedIcons: PlacedIcon[];
  placedComments: PlacedComment[];
};

function resolveInstanceColor(iconDef: IconDef, prev: PlacedIcon[]): string {
  if (!iconDef.colors) return iconDef.color;
  const count = prev.filter((p) => p.iconDef.id === iconDef.id).length;
  if (count < iconDef.colors.length) return iconDef.colors[count];
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 40%)`;
}

function loadState(): SavedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw
      ? (JSON.parse(raw) as SavedState)
      : { boardImage: null, placedIcons: [], placedComments: [] };
  } catch {
    return { boardImage: null, placedIcons: [], placedComments: [] };
  }
}

export default function App() {
  const saved = loadState();
  const [boardImage, setBoardImage] = useState<string | null>(() => saved.boardImage);
  const [placedIcons, setPlacedIcons] = useState<PlacedIcon[]>(() => saved.placedIcons);
  const [placedComments, setPlacedComments] = useState<PlacedComment[]>(() => saved.placedComments);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ boardImage, placedIcons, placedComments }));
  }, [boardImage, placedIcons, placedComments]);

  const readImageFile = (file: File | null | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => setBoardImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) =>
    readImageFile(e.target.files?.[0]);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const item = Array.from(e.clipboardData?.items ?? []).find((i) =>
      i.type.startsWith('image/'),
    );
    if (item) readImageFile(item.getAsFile());
  }, []);

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  const handleDropIcon = (iconDef: IconDef, x: number, y: number, resolvedColor?: string) =>
    setPlacedIcons((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        iconDef,
        instanceColor: resolvedColor ?? resolveInstanceColor(iconDef, prev),
        x,
        y,
      },
    ]);

  const handleMoveIcon = (id: string, x: number, y: number) =>
    setPlacedIcons((prev) => prev.map((icon) => (icon.id === id ? { ...icon, x, y } : icon)));

  const handleRemoveIcon = (id: string) =>
    setPlacedIcons((prev) => prev.filter((icon) => icon.id !== id));

  const handleDropComment = (text: string, x: number, y: number) =>
    setPlacedComments((prev) => [...prev, { id: crypto.randomUUID(), text, x, y }]);

  const handleMoveComment = (id: string, x: number, y: number) =>
    setPlacedComments((prev) => prev.map((c) => (c.id === id ? { ...c, x, y } : c)));

  const handleRemoveComment = (id: string) =>
    setPlacedComments((prev) => prev.filter((c) => c.id !== id));

  const hasAnyPlacement = placedIcons.length > 0 || placedComments.length > 0;

  return (
    <div className="app">
      <aside className="sidebar">
        <h1 className="app-title">人狼ヘルパー</h1>
        <IconPalette placedIcons={placedIcons} />
        <div className="controls">
          <label className="btn btn-primary">
            画像を選択
            <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
          </label>
          {hasAnyPlacement && (
            <button
              className="btn btn-secondary"
              onClick={() => { setPlacedIcons([]); setPlacedComments([]); }}
            >
              配置をクリア
            </button>
          )}
          {boardImage && (
            <button
              className="btn btn-danger"
              onClick={() => { setBoardImage(null); setPlacedIcons([]); setPlacedComments([]); }}
            >
              全リセット
            </button>
          )}
        </div>
      </aside>
      <main className="board-area">
        <GameBoard
          image={boardImage}
          placedIcons={placedIcons}
          placedComments={placedComments}
          onDropIcon={handleDropIcon}
          onMoveIcon={handleMoveIcon}
          onRemoveIcon={handleRemoveIcon}
          onDropComment={handleDropComment}
          onMoveComment={handleMoveComment}
          onRemoveComment={handleRemoveComment}
        />
      </main>
      <CommentSidebar />
    </div>
  );
}
