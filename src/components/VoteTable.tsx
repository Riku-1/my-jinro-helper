import { useState } from 'react';
import type { Player } from '../App';

type EditingCell = { day: number; pi: number };

type Props = {
  players: Player[];
  voteTable: string[][];
  onUpdateVote: (day: number, pi: number, value: string) => void;
  onAddDay: () => void;
  onRemoveDay: (day: number) => void;
};

export default function VoteTable({ players, voteTable, onUpdateVote, onAddDay, onRemoveDay }: Props) {
  const [editing, setEditing] = useState<EditingCell | null>(null);
  const [inputValue, setInputValue] = useState('');

  const startEdit = (cell: EditingCell, initial: string) => {
    setEditing(cell);
    setInputValue(initial);
  };

  const commitEdit = () => {
    if (!editing) return;
    onUpdateVote(editing.day, editing.pi, inputValue.trim());
    setEditing(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') setEditing(null);
  };

  const days = voteTable.length;

  if (players.length === 0) {
    return (
      <div className="vote-container">
        <p className="vote-empty">「投票履歴」タブでプレイヤーを追加してください</p>
      </div>
    );
  }

  return (
    <div className="vote-container">
      <table className="vote-table">
        <thead>
          <tr>
            <th className="vote-th vote-th--player">プレイヤー</th>
            {Array.from({ length: days }, (_, d) => (
              <th key={d} className="vote-th vote-th--day">
                <span>Day {d + 1}</span>
                <button className="vote-del-btn" onClick={() => onRemoveDay(d)} title={`Day ${d + 1} を削除`}>×</button>
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
                <span className="vote-player-num">{player.number}</span>
                <span className="vote-player-name-ro">{player.name || <span className="vote-placeholder">—</span>}</span>
              </td>
              {Array.from({ length: days }, (_, d) => {
                const val = voteTable[d]?.[pi] ?? '';
                const isEditing = editing?.day === d && editing?.pi === pi;
                return (
                  <td
                    key={d}
                    className={`vote-td vote-td--cell${isEditing ? ' vote-td--editing' : ''}`}
                    onClick={() => !isEditing && startEdit({ day: d, pi }, val)}
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
    </div>
  );
}
