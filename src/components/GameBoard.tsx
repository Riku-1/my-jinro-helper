import { useRef } from 'react';
import PlacedIcon from './PlacedIcon';
import PlacedComment from './PlacedComment';
import type { IconDef } from '../constants/icons';
import type { PlacedIcon as PlacedIconType, PlacedComment as PlacedCommentType } from '../App';

type DragPayload =
  | { type: 'new'; iconDef: IconDef; resolvedColor?: string }
  | { type: 'new-comment'; text: string }
  | { type: 'move'; id: string; offsetX: number; offsetY: number }
  | { type: 'move-comment'; id: string; offsetX: number; offsetY: number };

type Props = {
  image: string | null;
  placedIcons: PlacedIconType[];
  placedComments: PlacedCommentType[];
  onDropIcon: (iconDef: IconDef, x: number, y: number, resolvedColor?: string) => void;
  onMoveIcon: (id: string, x: number, y: number) => void;
  onRemoveIcon: (id: string) => void;
  onDropComment: (text: string, x: number, y: number) => void;
  onMoveComment: (id: string, x: number, y: number) => void;
  onRemoveComment: (id: string) => void;
};

export default function GameBoard({
  image, placedIcons, placedComments,
  onDropIcon, onMoveIcon, onRemoveIcon,
  onDropComment, onMoveComment, onRemoveComment,
}: Props) {
  const boardRef = useRef<HTMLDivElement>(null);

  const getBoardRelativePos = (clientX: number, clientY: number) => {
    const rect = boardRef.current!.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    };
  };

  const clamp = (v: number) => Math.max(0, Math.min(100, v));

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/json');
    if (!raw) return;
    const parsed = JSON.parse(raw) as DragPayload;
    const { x, y } = getBoardRelativePos(e.clientX, e.clientY);

    if (parsed.type === 'new') {
      onDropIcon(parsed.iconDef, clamp(x), clamp(y), parsed.resolvedColor);
    } else if (parsed.type === 'new-comment') {
      onDropComment(parsed.text, clamp(x), clamp(y));
    } else if (parsed.type === 'move') {
      onMoveIcon(parsed.id, clamp(x - parsed.offsetX), clamp(y - parsed.offsetY));
    } else if (parsed.type === 'move-comment') {
      onMoveComment(parsed.id, clamp(x - parsed.offsetX), clamp(y - parsed.offsetY));
    }
  };

  const handleIconDragStart = (e: React.DragEvent, icon: PlacedIconType) => {
    e.stopPropagation();
    const { x: cursorX, y: cursorY } = getBoardRelativePos(e.clientX, e.clientY);
    const payload: DragPayload = {
      type: 'move',
      id: icon.id,
      offsetX: cursorX - icon.x,
      offsetY: cursorY - icon.y,
    };
    e.dataTransfer.setData('application/json', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  const handleCommentDragStart = (e: React.DragEvent, comment: PlacedCommentType) => {
    e.stopPropagation();
    const { x: cursorX, y: cursorY } = getBoardRelativePos(e.clientX, e.clientY);
    const payload: DragPayload = {
      type: 'move-comment',
      id: comment.id,
      offsetX: cursorX - comment.x,
      offsetY: cursorY - comment.y,
    };
    e.dataTransfer.setData('application/json', JSON.stringify(payload));
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
      {placedComments.map((comment) => (
        <PlacedComment
          key={comment.id}
          comment={comment}
          onDragStart={handleCommentDragStart}
          onRemove={() => onRemoveComment(comment.id)}
        />
      ))}
    </div>
  );
}
