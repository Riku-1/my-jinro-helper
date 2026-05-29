export default function PlacedIcon({ icon, onDragStart, onRemove }) {
  const { iconDef, x, y } = icon;

  return (
    <div
      className="placed-icon"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        backgroundColor: iconDef.color,
        color: iconDef.textColor,
        border: iconDef.border ? `2px solid ${iconDef.border}` : '2px solid transparent',
      }}
      draggable
      onDragStart={(e) => onDragStart(e, icon)}
      onContextMenu={(e) => { e.preventDefault(); onRemove(); }}
      onDoubleClick={onRemove}
      title={`${iconDef.title}（右クリック or ダブルクリックで削除）`}
    >
      {iconDef.label}
    </div>
  );
}
