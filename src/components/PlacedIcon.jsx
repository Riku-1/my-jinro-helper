import { useState } from 'react';

export default function PlacedIcon({ icon, onDragStart, onRemove }) {
  const { iconDef, x, y } = icon;
  const [dragging, setDragging] = useState(false);

  return (
    <div
      className="placed-icon"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        backgroundColor: iconDef.color,
        color: iconDef.textColor,
        border: iconDef.border ? `2px solid ${iconDef.border}` : '2px solid transparent',
        opacity: dragging ? 0.4 : 1,
      }}
      draggable
      onDragStart={(e) => { setDragging(true); onDragStart(e, icon); }}
      onDragEnd={() => setDragging(false)}
      onContextMenu={(e) => { e.preventDefault(); onRemove(); }}
      onDoubleClick={onRemove}
      title={`${iconDef.title}（右クリック or ダブルクリックで削除）`}
    >
      {iconDef.label}
    </div>
  );
}
