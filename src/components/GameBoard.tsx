import { useRef, useState, useEffect } from 'react';
import PlacedIcon from './PlacedIcon';
import PlacedComment from './PlacedComment';
import type { IconDef } from '../constants/icons';
import type { PlacedIcon as PlacedIconType, PlacedComment as PlacedCommentType } from '../App';

type DragPayload =
  | { type: 'new'; iconDef: IconDef; resolvedColor?: string }
  | { type: 'new-comment'; text: string }
  | { type: 'move'; id: string; offsetX: number; offsetY: number }
  | { type: 'move-comment'; id: string; offsetX: number; offsetY: number };

type Transform = { x: number; y: number; scale: number };

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
  const boardRef    = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const [tf, setTf]           = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const [isPanning, setPanning] = useState(false);
  const panOrigin = useRef({ x: 0, y: 0 });

  // Reset transform when image is cleared
  useEffect(() => {
    if (!image) setTf({ x: 0, y: 0, scale: 1 });
  }, [image]);

  // Non-passive wheel listener for zoom
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      const vp = el.getBoundingClientRect();
      const cx = e.clientX - vp.left;
      const cy = e.clientY - vp.top;
      setTf((prev) => {
        const newScale = Math.max(0.1, Math.min(20, prev.scale * factor));
        const ratio = newScale / prev.scale;
        return { x: cx - (cx - prev.x) * ratio, y: cy - (cy - prev.y) * ratio, scale: newScale };
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Center board after image renders
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const vp = viewportRef.current;
    if (!vp) return;
    const vpRect = vp.getBoundingClientRect();
    const img = e.currentTarget;
    setTf({ x: (vpRect.width - img.offsetWidth) / 2, y: (vpRect.height - img.offsetHeight) / 2, scale: 1 });
  };

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const el = e.target as HTMLElement;
    if (!el.classList.contains('game-board') && !el.classList.contains('board-image')) return;
    e.preventDefault();
    setPanning(true);
    panOrigin.current = { x: e.clientX - tf.x, y: e.clientY - tf.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setTf((prev) => ({ ...prev, x: e.clientX - panOrigin.current.x, y: e.clientY - panOrigin.current.y }));
  };

  const handleMouseUp = () => setPanning(false);

  // getBoundingClientRect already accounts for CSS transform, so % math is correct as-is
  const getBoardRelativePos = (clientX: number, clientY: number) => {
    const rect = boardRef.current!.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    };
  };

  const clamp = (v: number) => Math.max(0, Math.min(100, v));

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

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
    const { x: cx, y: cy } = getBoardRelativePos(e.clientX, e.clientY);
    const payload: DragPayload = { type: 'move', id: icon.id, offsetX: cx - icon.x, offsetY: cy - icon.y };
    e.dataTransfer.setData('application/json', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  const handleCommentDragStart = (e: React.DragEvent, comment: PlacedCommentType) => {
    e.stopPropagation();
    const { x: cx, y: cy } = getBoardRelativePos(e.clientX, e.clientY);
    const payload: DragPayload = { type: 'move-comment', id: comment.id, offsetX: cx - comment.x, offsetY: cy - comment.y };
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
      ref={viewportRef}
      className="board-viewport"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isPanning ? 'grabbing' : 'default' }}
    >
      <div
        ref={boardRef}
        className="game-board"
        style={{ transform: `translate(${tf.x}px, ${tf.y}px) scale(${tf.scale})`, transformOrigin: '0 0' }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <img
          src={image}
          alt="board"
          className="board-image"
          draggable={false}
          onLoad={handleImageLoad}
        />
        {placedIcons.map((icon) => (
          <PlacedIcon key={icon.id} icon={icon} onDragStart={handleIconDragStart} onRemove={() => onRemoveIcon(icon.id)} />
        ))}
        {placedComments.map((comment) => (
          <PlacedComment key={comment.id} comment={comment} onDragStart={handleCommentDragStart} onRemove={() => onRemoveComment(comment.id)} />
        ))}
      </div>
    </div>
  );
}
