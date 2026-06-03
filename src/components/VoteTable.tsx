import { useState } from 'react';
import type { Player } from '../App';

type SelectedDay  = 'all' | number;
type ContentMode  = 'vote' | 'memo';

type Props = {
  players: Player[];
  voteTable: string[][];
  dayMemos: string[];
  onUpdateVote: (day: number, pi: number, value: string) => void;
  onAddDay: () => void;
  onRemoveDay: (day: number) => void;
  onUpdateMemo: (day: number, memo: string) => void;
};

export default function VoteTable({
  players, voteTable, dayMemos,
  onUpdateVote, onAddDay, onRemoveDay, onUpdateMemo,
}: Props) {
  const [contentMode, setContentMode]     = useState<ContentMode>('vote');
  const [selectedVoteDay, setSelectedVoteDay] = useState<SelectedDay>('all');
  const [selectedMemoDay, setSelectedMemoDay] = useState<SelectedDay>('all');

  const days = voteTable.length;

  const handleRemoveDay = (d: number) => {
    onRemoveDay(d);
    if (selectedVoteDay === d) setSelectedVoteDay('all');
    else if (typeof selectedVoteDay === 'number' && selectedVoteDay > d) setSelectedVoteDay(selectedVoteDay - 1);
    if (selectedMemoDay === d) setSelectedMemoDay('all');
    else if (typeof selectedMemoDay === 'number' && selectedMemoDay > d) setSelectedMemoDay(selectedMemoDay - 1);
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

  const dayLabels = Array.from({ length: days }, (_, d) => `${d + 1}日目`);

  return (
    <div className="vote-container">
      {/* 上段：メモタブ */}
      <div className="vote-day-tabs vote-day-tabs--memo">
        <button
          className={`vote-day-tab vote-day-tab--memo${contentMode === 'memo' && selectedMemoDay === 'all' ? ' vote-day-tab--memo-active' : ''}`}
          onClick={() => { setContentMode('memo'); setSelectedMemoDay('all'); }}
        >全体メモ</button>
        {dayLabels.map((label, d) => (
          <button
            key={d}
            className={`vote-day-tab vote-day-tab--memo${contentMode === 'memo' && selectedMemoDay === d ? ' vote-day-tab--memo-active' : ''}`}
            onClick={() => { setContentMode('memo'); setSelectedMemoDay(d); }}
          >{label} メモ</button>
        ))}
      </div>

      {/* 下段：投票タブ */}
      <div className="vote-day-tabs">
        <button
          className={`vote-day-tab${contentMode === 'vote' && selectedVoteDay === 'all' ? ' vote-day-tab--active' : ''}`}
          onClick={() => { setContentMode('vote'); setSelectedVoteDay('all'); }}
        >全体</button>
        {dayLabels.map((label, d) => (
          <button
            key={d}
            className={`vote-day-tab${contentMode === 'vote' && selectedVoteDay === d ? ' vote-day-tab--active' : ''}`}
            onClick={() => { setContentMode('vote'); setSelectedVoteDay(d); }}
          >
            {label}
            <span
              className="vote-day-tab-del"
              onClick={(e) => { e.stopPropagation(); handleRemoveDay(d); }}
              title="この日を削除"
            >×</span>
          </button>
        ))}
        <button className="vote-add-btn" onClick={onAddDay}>＋ 日を追加</button>
      </div>

      {/* コンテンツ */}
      {contentMode === 'vote' ? (
        selectedVoteDay === 'all' ? (
          <table className="vote-table">
            <thead>
              <tr>
                <th className="vote-th vote-th--player">プレイヤー</th>
                {dayLabels.map((label, d) => (
                  <th key={d} className="vote-th vote-th--day">{label}</th>
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
                    <td key={d} className="vote-td vote-td--cell">{renderVoteSelect(d, pi)}</td>
                  ))}
                  <td className="vote-td vote-td--empty" />
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="vote-table">
            <thead>
              <tr>
                <th className="vote-th vote-th--player">プレイヤー</th>
                <th className="vote-th vote-th--day">{selectedVoteDay + 1}日目 投票先</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player, pi) => (
                <tr key={pi} className="vote-row">
                  <td className="vote-td vote-td--player">
                    <span className="vote-player-num">{player.number}</span>
                    <span className="vote-player-name-ro">{player.name || <span className="vote-placeholder">—</span>}</span>
                  </td>
                  <td className="vote-td vote-td--cell">{renderVoteSelect(selectedVoteDay, pi)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      ) : (
        /* メモビュー */
        selectedMemoDay === 'all' ? (
          <div className="memo-all">
            {dayLabels.map((label, d) => (
              <div key={d} className="memo-all-item">
                <span className="memo-all-label">{label}</span>
                <span className="memo-all-text">{dayMemos[d] || <span className="vote-placeholder">（メモなし）</span>}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="memo-section">
            <label className="memo-label">{selectedMemoDay + 1}日目 メモ</label>
            <textarea
              className="memo-textarea"
              value={dayMemos[selectedMemoDay] ?? ''}
              onChange={(e) => onUpdateMemo(selectedMemoDay, e.target.value)}
              placeholder="この日のメモを入力..."
              rows={4}
            />
          </div>
        )
      )}
    </div>
  );
}
