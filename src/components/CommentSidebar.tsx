import { useState, useRef } from 'react';

const DEFAULT_COMMENTS = [
  '白い', '黒い', '微黒', '微白',
  '真狂', '真狼', '狼', '狂人',
  'おかしい', '気になる', 'わからん',
  '怪しい',
  '盤面黒', '盤面白', '役目', '素村',
  '偽', '真', '人外', '非狩',
  '非役',
];

export default function CommentSidebar() {
  const [customComments, setCustomComments] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragStart = (e: React.DragEvent, text: string) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'new-comment', text }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const addCustomComment = () => {
    const text = inputValue.trim();
    if (!text || customComments.includes(text) || DEFAULT_COMMENTS.includes(text)) return;
    setCustomComments((prev) => [text, ...prev]);
    setInputValue('');
    inputRef.current?.focus();
  };

  const removeCustomComment = (text: string) => {
    setCustomComments((prev) => prev.filter((c) => c !== text));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') addCustomComment();
  };

  return (
    <aside className="right-sidebar">
      <h1 className="app-title">コメント</h1>
      <p className="sidebar-subtitle">主観</p>

      <div className="comment-input-row">
        <input
          ref={inputRef}
          className="comment-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="自由入力..."
          maxLength={20}
        />
        <button className="comment-add-btn" onClick={addCustomComment} title="追加">＋</button>
      </div>

      <div className="comment-list">
        {customComments.map((text) => (
          <div key={text} className="comment-chip comment-chip--custom" draggable onDragStart={(e) => handleDragStart(e, text)}>
            <span>{text}</span>
            <button
              className="comment-chip-remove"
              onClick={(e) => { e.stopPropagation(); removeCustomComment(text); }}
              title="削除"
            >×</button>
          </div>
        ))}
        {DEFAULT_COMMENTS.map((text) => (
          <div key={text} className="comment-chip" draggable onDragStart={(e) => handleDragStart(e, text)}>
            {text}
          </div>
        ))}
      </div>

      <p className="palette-hint">ドラッグして配置<br />右クリック・ダブルクリックで削除</p>
    </aside>
  );
}
