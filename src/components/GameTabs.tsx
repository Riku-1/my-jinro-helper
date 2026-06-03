import type { Game } from '../App';

type Props = {
  games: Game[];
  activeGameId: string;
  onSwitch: (id: string) => void;
  onCreate: () => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
};

export default function GameTabs({ games, activeGameId, onSwitch, onCreate, onRename, onDelete }: Props) {
  const handleRename = () => {
    const current = games.find((g) => g.id === activeGameId);
    if (!current) return;
    const name = window.prompt('ゲーム名を入力してください', current.name);
    if (name?.trim()) onRename(activeGameId, name.trim());
  };

  const handleDelete = () => {
    const current = games.find((g) => g.id === activeGameId);
    if (!current) return;
    if (window.confirm(`「${current.name}」を削除しますか？`)) onDelete(activeGameId);
  };

  return (
    <div className="game-selector-bar">
      <select
        className="game-select"
        value={activeGameId}
        onChange={(e) => onSwitch(e.target.value)}
      >
        {games.map((g) => (
          <option key={g.id} value={g.id}>{g.name}</option>
        ))}
      </select>
      <button className="game-btn" onClick={onCreate} title="新しいゲームを作成">＋</button>
      <button className="game-btn" onClick={handleRename} title="ゲーム名を変更">名前変更</button>
      {games.length > 1 && (
        <button className="game-btn game-btn--danger" onClick={handleDelete} title="このゲームを削除">削除</button>
      )}
    </div>
  );
}
