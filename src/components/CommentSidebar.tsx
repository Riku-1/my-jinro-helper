const DEFAULT_COMMENTS = [
  '白い', '黒い', '微黒', '微白',
  '真狂', '真狼', '狼', '狂人',
  'おかしい', '気になる', 'わからん',
  '盤面黒', '盤面白', '役目', '素村',
];

export default function CommentSidebar() {
  const handleDragStart = (e: React.DragEvent, text: string) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'new-comment', text }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <aside className="right-sidebar">
      <h1 className="app-title">コメント</h1>
      <p className="sidebar-subtitle">主観</p>
      <div className="comment-list">
        {DEFAULT_COMMENTS.map((text) => (
          <div
            key={text}
            className="comment-chip"
            draggable
            onDragStart={(e) => handleDragStart(e, text)}
          >
            {text}
          </div>
        ))}
      </div>
      <p className="palette-hint">ドラッグして配置<br />右クリック・ダブルクリックで削除</p>
    </aside>
  );
}
