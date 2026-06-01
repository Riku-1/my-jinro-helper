import { useState } from 'react';
import type { PlacedComment as PlacedCommentType } from '../App';

type Props = {
  comment: PlacedCommentType;
  onDragStart: (e: React.DragEvent, comment: PlacedCommentType) => void;
  onRemove: () => void;
};

export default function PlacedComment({ comment, onDragStart, onRemove }: Props) {
  const [dragging, setDragging] = useState(false);

  return (
    <div
      className="placed-comment"
      style={{ left: `${comment.x}%`, top: `${comment.y}%`, opacity: dragging ? 0.4 : 1 }}
      draggable
      onDragStart={(e) => { setDragging(true); onDragStart(e, comment); }}
      onDragEnd={() => setDragging(false)}
      onContextMenu={(e) => { e.preventDefault(); onRemove(); }}
      onDoubleClick={onRemove}
      title={`${comment.text}（右クリック or ダブルクリックで削除）`}
    >
      {comment.text}
    </div>
  );
}
