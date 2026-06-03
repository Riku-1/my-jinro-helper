import { useState } from 'react';
import type { Player } from '../App';

type SelectedDay = 'all' | number;

type Props = {
  players: Player[];
  voteTable: string[][];
  onUpdateVote: (day: number, pi: number, value: string) => void;
  onAddDay: () => void;
  onRemoveDay: (day: number) => void;
};

export default function VoteTable({ players, voteTable, onUpdateVote, onAddDay, onRemoveDay }: Props) {
  const [selectedDay, setSelectedDay] = useState<SelectedDay>('all');

  const days = voteTable.length;

  const handleRemoveDay = (d: number) => {
    onRemoveDay(d);
    if (selectedDay === d) setSelectedDay('all');
    else if (typeof selectedDay === 'number' && selectedDay > d) setSelectedDay(selectedDay - 1);
  };

  const renderVoteSelect = (d: number, pi: number) => {
    const val = voteTable[d]?.[pi] ?? '';
    return (
      <select
        className="vote-select"
        value={val}
        onChange={(e) => onUpdateVote(d, pi, e.target.value)}
      >
        <option value="">-</option>
        {players.map((p) => (
          <option key={p.number} value={String(p.number)}>
            {p.number}{p.name ? ` ${p.name}` : ''}
          </option>
        ))}
      </select>
    );
  };

  if (players.length === 0) {
    return (
      <div className="vote-container">
        <p className="vote-empty">「プレイヤー管理」タブでプレイヤーを追加してください</p>
      </div>
    );
  }

  return (
    <div className="vote-container">
      {/* タブ */}
      <div className="vote-day-tabs">
        <button
          className={`vote-day-tab${selectedDay === 'all' ? ' vote-day-tab--active' : ''}`}
          onClick={() => setSelectedDay('all')}
        >全体</button>
        {Array.from({ length: days }, (_, d) => (
          <button
            key={d}
            className={`vote-day-tab${selectedDay === d ? ' vote-day-tab--active' : ''}`}
            onClick={() => setSelectedDay(d)}
          >
            {d + 1}日目
            <span
              className="vote-day-tab-del"
              onClick={(e) => { e.stopPropagation(); handleRemoveDay(d); }}
              title="この日を削除"
            >×</span>
          </button>
        ))}
        <button className="vote-add-btn" onClick={onAddDay}>＋ 日を追加</button>
      </div>

      {selectedDay === 'all' ? (
        /* 全体ビュー */
        <table className="vote-table">
          <thead>
            <tr>
              <th className="vote-th vote-th--player">プレイヤー</th>
              {Array.from({ length: days }, (_, d) => (
                <th key={d} className="vote-th vote-th--day">{d + 1}日目</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {players.map((player, pi) => (
              <tr key={pi} className="vote-row">
                <td className="vote-td vote-td--player">
                  <span className="vote-player-num">{player.number}</span>
                  <span className="vote-player-name-ro">{player.name || <span className="vote-placeholder">—</span>}</span>
                </td>
                {Array.from({ length: days }, (_, d) => (
                  <td key={d} className="vote-td vote-td--cell">
                    {renderVoteSelect(d, pi)}
                  </td>
                ))}
                <td className="vote-td vote-td--empty" />
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        /* 1日ビュー */
        <table className="vote-table">
          <thead>
            <tr>
              <th className="vote-th vote-th--player">プレイヤー</th>
              <th className="vote-th vote-th--day">{selectedDay + 1}日目 投票先</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, pi) => (
              <tr key={pi} className="vote-row">
                <td className="vote-td vote-td--player">
                  <span className="vote-player-num">{player.number}</span>
                  <span className="vote-player-name-ro">{player.name || <span className="vote-placeholder">—</span>}</span>
                </td>
                <td className="vote-td vote-td--cell">
                  {renderVoteSelect(selectedDay, pi)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
