import { useState } from 'react';
import type { PlacedIcon as PlacedIconType } from '../App';

type Props = {
  icon: PlacedIconType;
  seqNum?: number;
  onDragStart: (e: React.DragEvent, icon: PlacedIconType) => void;
  onRemove: () => void;
};

export default function PlacedIcon({ icon, seqNum, onDragStart, onRemove }: Props) {
  const { iconDef, x, y } = icon;
  const [dragging, setDragging] = useState(false);

  return (
    <div
      className={`placed-icon${iconDef.shape === 'badge' ? ' placed-icon--badge' : ''}`}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        backgroundColor: icon.instanceColor,
        color: iconDef.textColor,
        border: '2px solid transparent',
        opacity: dragging ? 0.4 : 1,
      }}
      draggable
      onDragStart={(e) => { setDragging(true); onDragStart(e, icon); }}
      onDragEnd={() => setDragging(false)}
      onContextMenu={(e) => { e.preventDefault(); onRemove(); }}
      onDoubleClick={onRemove}
      title={`${iconDef.title}${seqNum != null ? ` 結果${seqNum}` : ''}（右クリック or ダブルクリックで削除）`}
    >
      {iconDef.label}
      {seqNum != null && <span className="placed-icon-seq">{seqNum}</span>}
    </div>
  );
}
