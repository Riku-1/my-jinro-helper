import { useState, useEffect, useCallback } from 'react';
import IconPalette from './components/IconPalette';
import GameBoard from './components/GameBoard';
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

type SavedState = {
  boardImage: string | null;
  placedIcons: PlacedIcon[];
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
    return raw ? (JSON.parse(raw) as SavedState) : { boardImage: null, placedIcons: [] };
  } catch {
    return { boardImage: null, placedIcons: [] };
  }
}

export default function App() {
  const [boardImage, setBoardImage] = useState<string | null>(() => loadState().boardImage);
  const [placedIcons, setPlacedIcons] = useState<PlacedIcon[]>(() => loadState().placedIcons);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ boardImage, placedIcons }));
  }, [boardImage, placedIcons]);

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
          {placedIcons.length > 0 && (
            <button className="btn btn-secondary" onClick={() => setPlacedIcons([])}>
              アイコンをクリア
            </button>
          )}
          {boardImage && (
            <button
              className="btn btn-danger"
              onClick={() => { setBoardImage(null); setPlacedIcons([]); }}
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
          onDropIcon={handleDropIcon}
          onMoveIcon={handleMoveIcon}
          onRemoveIcon={handleRemoveIcon}
        />
      </main>
    </div>
  );
}
