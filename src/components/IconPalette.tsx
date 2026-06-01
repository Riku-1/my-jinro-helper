import { ICON_CATEGORIES, type IconDef } from '../constants/icons';

export default function IconPalette() {
  const handleDragStart = (e: React.DragEvent, iconDef: IconDef) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'new', iconDef }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="palette">
      {ICON_CATEGORIES.map((cat) => (
        <div key={cat.label} className="palette-category">
          <h3 className="category-label">{cat.label}</h3>
          <div className="icon-grid">
            {cat.icons.map((iconDef) => (
              <div
                key={iconDef.id}
                className={`palette-icon${iconDef.shape === 'badge' ? ' palette-icon--badge' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, iconDef)}
                style={{
                  backgroundColor: iconDef.color,
                  color: iconDef.textColor,
                  border: iconDef.border ? `2px solid ${iconDef.border}` : '2px solid transparent',
                }}
                title={iconDef.title}
              >
                {iconDef.label}
              </div>
            ))}
          </div>
        </div>
      ))}
      <p className="palette-hint">
        ドラッグして配置<br />
        右クリック・ダブルクリックで削除
      </p>
    </div>
  );
}
