import { useState, useEffect, useCallback } from 'react';
import IconPalette from './components/IconPalette';
import GameBoard from './components/GameBoard';
import './App.css';

const STORAGE_KEY = 'jinro-helper-v1';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { boardImage: null, placedIcons: [] };
  } catch {
    return { boardImage: null, placedIcons: [] };
  }
}

export default function App() {
  const [boardImage, setBoardImage] = useState(() => loadState().boardImage);
  const [placedIcons, setPlacedIcons] = useState(() => loadState().placedIcons);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ boardImage, placedIcons }));
  }, [boardImage, placedIcons]);

  const readImageFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => setBoardImage(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e) => readImageFile(e.target.files[0]);

  const handlePaste = useCallback((e) => {
    const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith('image/'));
    if (item) readImageFile(item.getAsFile());
  }, []);

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  const handleDropIcon = (iconDef, x, y) =>
    setPlacedIcons((prev) => [...prev, { id: crypto.randomUUID(), iconDef, x, y }]);

  const handleMoveIcon = (id, x, y) =>
    setPlacedIcons((prev) => prev.map((icon) => (icon.id === id ? { ...icon, x, y } : icon)));

  const handleRemoveIcon = (id) =>
    setPlacedIcons((prev) => prev.filter((icon) => icon.id !== id));

  return (
    <div className="app">
      <aside className="sidebar">
        <h1 className="app-title">人狼ヘルパー</h1>
        <IconPalette />
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
