import { useState } from 'react';
import type { Player } from '../App';

type EditingCell =
  | { kind: 'vote'; day: number; pi: number }
  | { kind: 'playerName'; pi: number }
  | { kind: 'playerNumber'; pi: number };

type Props = {
  players: Player[];
  voteTable: string[][];
  onUpdateVote: (day: number, pi: number, value: string) => void;
  onAddDay: () => void;
  onAddPlayer: () => void;
  onRemoveDay: (day: number) => void;
  onRemovePlayer: (pi: number) => void;
  onUpdatePlayer: (pi: number, player: Player) => void;
};

export default function VoteTable({
  players, voteTable,
  onUpdateVote, onAddDay, onAddPlayer, onRemoveDay, onRemovePlayer, onUpdatePlayer,
}: Props) {
  const [editing, setEditing] = useState<EditingCell | null>(null);
  const [inputValue, setInputValue] = useState('');

  const startEdit = (cell: EditingCell, initial: string) => {
    setEditing(cell);
    setInputValue(initial);
  };

  const commitEdit = () => {
    if (!editing) return;
    if (editing.kind === 'vote') {
      onUpdateVote(editing.day, editing.pi, inputValue.trim());
    } else if (editing.kind === 'playerName') {
      onUpdatePlayer(editing.pi, { ...players[editing.pi], name: inputValue.trim() });
    } else if (editing.kind === 'playerNumber') {
      const n = parseInt(inputValue, 10);
      if (!isNaN(n) && n > 0) onUpdatePlayer(editing.pi, { ...players[editing.pi], number: n });
    }
    setEditing(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') setEditing(null);
  };

  const days = voteTable.length;

  return (
    <div className="vote-container">
      {players.length === 0 && (
        <p className="vote-empty">プレイヤーを追加してください</p>
      )}
      {players.length > 0 && (
        <table className="vote-table">
          <thead>
            <tr>
              <th className="vote-th vote-th--player">プレイヤー</th>
              {Array.from({ length: days }, (_, d) => (
                <th key={d} className="vote-th vote-th--day">
                  <span>Day {d + 1}</span>
                  <button
                    className="vote-del-btn"
                    onClick={() => onRemoveDay(d)}
                    title={`Day ${d + 1} を削除`}
                  >×</button>
                </th>
              ))}
              <th className="vote-th vote-th--add">
                <button className="vote-add-btn" onClick={onAddDay} title="日を追加">＋</button>
              </th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, pi) => (
              <tr key={pi} className="vote-row">
                <td className="vote-td vote-td--player">
                  {/* 番号 */}
                  {editing?.kind === 'playerNumber' && editing.pi === pi ? (
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
                      onClick={() => startEdit({ kind: 'playerNumber', pi }, String(player.number))}
                      title="クリックで番号を編集"
                    >
                      {player.number}
                    </span>
                  )}
                  {/* 名前 */}
                  {editing?.kind === 'playerName' && editing.pi === pi ? (
                    <input
                      className="vote-input vote-input--name"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={handleKeyDown}
                      autoFocus
                      placeholder="名前"
                    />
                  ) : (
                    <span
                      className="vote-player-name"
                      onClick={() => startEdit({ kind: 'playerName', pi }, player.name)}
                      title="クリックで名前を編集"
                    >
                      {player.name || <span className="vote-placeholder">名前</span>}
                    </span>
                  )}
                  <button
                    className="vote-del-btn"
                    onClick={() => onRemovePlayer(pi)}
                    title="このプレイヤーを削除"
                  >×</button>
                </td>
                {Array.from({ length: days }, (_, d) => {
                  const val = voteTable[d]?.[pi] ?? '';
                  const isEditing = editing?.kind === 'vote' && editing.day === d && editing.pi === pi;
                  return (
                    <td
                      key={d}
                      className={`vote-td vote-td--cell${isEditing ? ' vote-td--editing' : ''}`}
                      onClick={() => !isEditing && startEdit({ kind: 'vote', day: d, pi }, val)}
                      title="クリックで編集"
                    >
                      {isEditing ? (
                        <input
                          className="vote-input vote-input--cell"
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={handleKeyDown}
                          autoFocus
                        />
                      ) : (
                        val || <span className="vote-placeholder">-</span>
                      )}
                    </td>
                  );
                })}
                <td className="vote-td vote-td--empty" />
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <button className="vote-add-player-btn" onClick={onAddPlayer}>
        ＋ プレイヤー追加
      </button>
    </div>
  );
}
