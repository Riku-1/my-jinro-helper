import { useState } from 'react';
import type { Player } from '../App';

type EditingCell =
  | { kind: 'name'; pi: number }
  | { kind: 'number'; pi: number };

type Props = {
  players: Player[];
  onAddPlayer: () => void;
  onRemovePlayer: (pi: number) => void;
  onUpdatePlayer: (pi: number, player: Player) => void;
  onSetPlayerCount: (count: number) => void;
};

export default function PlayerManager({ players, onAddPlayer, onRemovePlayer, onUpdatePlayer, onSetPlayerCount }: Props) {
  const [editing, setEditing] = useState<EditingCell | null>(null);
  const [inputValue, setInputValue] = useState('');

  const startEdit = (cell: EditingCell, initial: string) => {
    setEditing(cell);
    setInputValue(initial);
  };

  const commitEdit = () => {
    if (!editing) return;
    if (editing.kind === 'name') {
      onUpdatePlayer(editing.pi, { ...players[editing.pi], name: inputValue.trim() });
    } else {
      const n = parseInt(inputValue, 10);
      if (!isNaN(n) && n > 0) onUpdatePlayer(editing.pi, { ...players[editing.pi], number: n });
    }
    setEditing(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') setEditing(null);
  };

  return (
    <div className="player-manager">
      <div className="player-manager-header">
        <h2 className="player-manager-title">プレイヤー設定</h2>
        <div className="player-count-row">
          <label className="player-count-label">人数</label>
          <select
            className="player-count-select"
            value={players.length <= 16 ? players.length : ''}
            onChange={(e) => onSetPlayerCount(Number(e.target.value))}
          >
            <option value={0}>0人</option>
            {Array.from({ length: 16 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}人</option>
            ))}
          </select>
        </div>
      </div>

      {players.length > 0 && (
        <table className="vote-table">
          <thead>
            <tr>
              <th className="vote-th" style={{ width: 60 }}>番号</th>
              <th className="vote-th" style={{ minWidth: 140 }}>名前</th>
              <th className="vote-th" style={{ width: 40 }} />
            </tr>
          </thead>
          <tbody>
            {players.map((player, pi) => (
              <tr key={pi} className="vote-row">
                <td className="vote-td" style={{ textAlign: 'center' }}>
                  {editing?.kind === 'number' && editing.pi === pi ? (
                    <input
                      className="vote-input vote-input--num"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={handleKeyDown}
                      autoFocus
                    />
                  ) : (
                    <span
                      className="vote-player-num"
                      onClick={() => startEdit({ kind: 'number', pi }, String(player.number))}
                      title="クリックで編集"
                    >
                      {player.number}
                    </span>
                  )}
                </td>
                <td className="vote-td">
                  {editing?.kind === 'name' && editing.pi === pi ? (
                    <input
                      className="vote-input vote-input--name"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={handleKeyDown}
                      autoFocus
                      placeholder="名前を入力"
                    />
                  ) : (
                    <span
                      className="vote-player-name"
                      onClick={() => startEdit({ kind: 'name', pi }, player.name)}
                      title="クリックで編集"
                    >
                      {player.name || <span className="vote-placeholder">（未設定）</span>}
                    </span>
                  )}
                </td>
                <td className="vote-td" style={{ textAlign: 'center' }}>
                  <button className="vote-del-btn" onClick={() => onRemovePlayer(pi)} title="削除">×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <button className="vote-add-player-btn" onClick={onAddPlayer}>
        ＋ プレイヤーを1人追加
      </button>
    </div>
  );
}
