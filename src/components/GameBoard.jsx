import { useRef } from 'react';
import PlacedIcon from './PlacedIcon';

export default function GameBoard({ image, placedIcons, onDropIcon, onMoveIcon, onRemoveIcon }) {
  const boardRef = useRef(null);

  const getBoardRelativePos = (clientX, clientY) => {
    const rect = boardRef.current.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    };
  };

  const clamp = (v) => Math.max(0, Math.min(100, v));

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/json');
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const { x, y } = getBoardRelativePos(e.clientX, e.clientY);

    if (parsed.type === 'new') {
      onDropIcon(parsed.iconDef, clamp(x), clamp(y));
    } else if (parsed.type === 'move') {
      onMoveIcon(parsed.id, clamp(x - parsed.offsetX), clamp(y - parsed.offsetY));
    }
  };

  const handleIconDragStart = (e, icon) => {
    e.stopPropagation();
    const { x: cursorX, y: cursorY } = getBoardRelativePos(e.clientX, e.clientY);
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'move',
      id: icon.id,
      offsetX: cursorX - icon.x,
      offsetY: cursorY - icon.y,
    }));
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  if (!image) {
    return (
      <div className="board-placeholder">
        <div>
          <p>左パネルから画像をアップロード</p>
          <p className="placeholder-sub">または Ctrl+V でスクリーンショットを貼り付け</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={boardRef}
      className="game-board"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <img src={image} alt="board" className="board-image" draggable={false} />
      {placedIcons.map((icon) => (
        <PlacedIcon
          key={icon.id}
          icon={icon}
          onDragStart={handleIconDragStart}
          onRemove={() => onRemoveIcon(icon.id)}
        />
      ))}
    </div>
  );
}
