import { ICON_CATEGORIES, WHITE_ICON_DEF, BLACK_ICON_DEF, type IconDef } from '../constants/icons';
import type { PlacedIcon } from '../App';

type Props = { placedIcons: PlacedIcon[] };

const RESULT_BASES = [WHITE_ICON_DEF, BLACK_ICON_DEF];

export default function IconPalette({ placedIcons }: Props) {
  const seers   = placedIcons.filter((p) => p.iconDef.id === 'seer');
  const mediums = placedIcons.filter((p) => p.iconDef.id === 'medium');

  const handleDragStart = (e: React.DragEvent, iconDef: IconDef, resolvedColor?: string) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ type: 'new', iconDef, resolvedColor }),
    );
    e.dataTransfer.effectAllowed = 'copy';
  };

  const renderResultRow = (roleIcon: PlacedIcon, index: number) => (
    <div key={roleIcon.id} className="result-row">
      <span className="result-row-label" style={{ color: roleIcon.instanceColor }}>
        CO{index + 1}
      </span>
      {RESULT_BASES.map((base) => (
        <div
          key={base.id}
          className="palette-icon"
          draggable
          onDragStart={(e) => handleDragStart(e, base, roleIcon.instanceColor)}
          style={{
            backgroundColor: roleIcon.instanceColor,
            color: base.textColor,
            border: '2px solid transparent',
          }}
          title={`${roleIcon.iconDef.title} CO${index + 1}: ${base.title}`}
        >
          {base.label}
        </div>
      ))}
    </div>
  );

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

      <div className="palette-category">
        <h3 className="category-label">占い結果</h3>
        {seers.length === 0 ? (
          <p className="result-placeholder">占い師を配置すると表示</p>
        ) : (
          seers.map((seer, i) => renderResultRow(seer, i))
        )}
      </div>

      <div className="palette-category">
        <h3 className="category-label">霊能結果</h3>
        {mediums.length === 0 ? (
          <p className="result-placeholder">霊媒師を配置すると表示</p>
        ) : (
          mediums.map((medium, i) => renderResultRow(medium, i))
        )}
      </div>

      <p className="palette-hint">
        ドラッグして配置<br />
        右クリック・ダブルクリックで削除
      </p>
    </div>
  );
}
