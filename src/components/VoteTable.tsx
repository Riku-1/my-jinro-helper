import { useState } from 'react';
import type { Player, VoteDayInfo } from '../App';

type SelectedDay = 'all' | number;
type ContentMode = 'vote' | 'memo';

type Props = {
  players: Player[];
  voteTable: string[][];
  voteDayInfo: VoteDayInfo[];
  dayMemos: Record<number, string>;
  onUpdateVote: (entryIndex: number, pi: number, value: string) => void;
  onAddDay: () => void;
  onAddRound: (day: number) => void;
  onRemoveDay: (day: number) => void;
  onUpdateMemo: (day: number, memo: string) => void;
};

const getDayLabel = (info: VoteDayInfo) =>
  info.round === 1 ? `${info.day}日目` : `${info.day}日目(${info.round}回目)`;

export default function VoteTable({
  players, voteTable, voteDayInfo, dayMemos,
  onUpdateVote, onAddDay, onAddRound, onRemoveDay, onUpdateMemo,
}: Props) {
  const [contentMode, setContentMode] = useState<ContentMode>('memo');
  const [selectedVoteDay, setSelectedVoteDay] = useState<SelectedDay>('all');
  const [selectedMemoDay, setSelectedMemoDay] = useState<SelectedDay>('all');
  const [sortByVotes, setSortByVotes] = useState(false);

  const uniqueDays = [...new Set(voteDayInfo.map((d) => d.day))];

  const selectedDayEntries = typeof selectedVoteDay === 'number'
    ? voteDayInfo.map((info, i) => ({ info, i })).filter(({ info }) => info.day === selectedVoteDay)
    : [];

  const handleRemoveDayTab = (dayNum: number) => {
    if (!window.confirm(`${dayNum}日目を削除しますか？`)) return;
    onRemoveDay(dayNum);
    if (selectedVoteDay === dayNum) setSelectedVoteDay('all');
    if (selectedMemoDay === dayNum) setSelectedMemoDay('all');
  };

  const renderVoteSelect = (
    entryIdx: number,
    pi: number,
    ranks?: { counts: Record<string, number>; first: number; second: number },
  ) => {
    const val = voteTable[entryIdx]?.[pi] ?? '';
    const selectedCnt = ranks && val ? (ranks.counts[val] ?? 0) : 0;
    const selectColor =
      ranks && ranks.first > 0 && selectedCnt === ranks.first ? 'red'
      : ranks && ranks.second > 0 && selectedCnt === ranks.second ? 'dodgerblue'
      : undefined;
    return (
      <select
        className="vote-select"
        value={val}
        style={selectColor ? { color: selectColor } : undefined}
        onChange={(e) => onUpdateVote(entryIdx, pi, e.target.value)}
      >
        <option value="" style={{ color: 'white' }}>-</option>
        {players.map((p) => (
          <option key={p.number} value={String(p.number)} style={{ color: 'white' }}>
            {p.number}{p.name ? ` ${p.name}` : ''}
          </option>
        ))}
      </select>
    );
  };

  const computeVoteRanks = (entryIndices: number[]) => {
    const counts: Record<string, number> = {};
    entryIndices.forEach((idx) => {
      players.forEach((_, pi) => {
        const voted = voteTable[idx]?.[pi];
        if (voted) counts[voted] = (counts[voted] ?? 0) + 1;
      });
    });
    const sorted = [...new Set(Object.values(counts))].sort((a, b) => b - a);
    return { counts, first: sorted[0] ?? 0, second: sorted[1] ?? 0 };
  };

  const singleDayRanks = selectedDayEntries.length > 0
    ? computeVoteRanks(selectedDayEntries.map(({ i }) => i))
    : null;

  if (players.length === 0) {
    return (
      <div className="vote-container">
        <p className="vote-empty">「プレイヤー管理」タブでプレイヤーを追加してください</p>
      </div>
    );
  }

  const renderSingleDayView = () => {
    const playerEntries = players.map((player, pi) => ({ player, pi }));
    const totalRounds = selectedDayEntries.length;
    if (sortByVotes && singleDayRanks) {
      playerEntries.sort((a, b) => {
        const maxCntA = Math.max(
          ...selectedDayEntries.map(({ i }) => {
            const voted = voteTable[i]?.[a.pi] ?? '';
            return voted ? (singleDayRanks.counts[voted] ?? 0) : -1;
          }),
          -1,
        );
        const maxCntB = Math.max(
          ...selectedDayEntries.map(({ i }) => {
            const voted = voteTable[i]?.[b.pi] ?? '';
            return voted ? (singleDayRanks.counts[voted] ?? 0) : -1;
          }),
          -1,
        );
        return maxCntB - maxCntA;
      });
    }
    return (
      <>
        <div className="vote-sort-bar">
          <button
            className={`vote-sort-btn${sortByVotes ? ' vote-sort-btn--active' : ''}`}
            onClick={() => setSortByVotes((v) => !v)}
          >得票数順{sortByVotes ? ' ON' : ' OFF'}</button>
        </div>
        <table className="vote-table">
          <thead>
            <tr>
              <th className="vote-th vote-th--player">プレイヤー</th>
              {selectedDayEntries.map(({ info }) => (
                <th key={info.round} className="vote-th vote-th--day">
                  {totalRounds === 1 ? '投票先' : `${info.round}回目`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {playerEntries.map(({ player, pi }) => {
              return (
                <tr key={pi} className="vote-row">
                  <td className="vote-td vote-td--player">
                    <span className="vote-player-num">{player.number}</span>
                    <span className="vote-player-name-ro">{player.name || <span className="vote-placeholder">—</span>}</span>
                  </td>
                  {selectedDayEntries.map(({ i: entryIdx }) => (
                    <td key={entryIdx} className="vote-td vote-td--cell">
                      {renderVoteSelect(entryIdx, pi, singleDayRanks ?? undefined)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </>
    );
  };

  const allEntryCount = voteTable.length;

  return (
    <div className="vote-container">
      {/* 上段：メモタブ */}
      <div className="vote-day-tabs vote-day-tabs--memo">
        <button
          className={`vote-day-tab vote-day-tab--memo${contentMode === 'memo' && selectedMemoDay === 'all' ? ' vote-day-tab--memo-active' : ''}`}
          onClick={() => { setContentMode('memo'); setSelectedMemoDay('all'); }}
        >全体</button>
        {uniqueDays.map((dayNum) => (
          <button
            key={dayNum}
            className={`vote-day-tab vote-day-tab--memo${contentMode === 'memo' && selectedMemoDay === dayNum ? ' vote-day-tab--memo-active' : ''}`}
            onClick={() => { setContentMode('memo'); setSelectedMemoDay(dayNum); }}
          >{dayNum}日目</button>
        ))}
      </div>

      {/* 下段：投票タブ */}
      <div className="vote-day-tabs">
        <button
          className={`vote-day-tab${contentMode === 'vote' && selectedVoteDay === 'all' ? ' vote-day-tab--active' : ''}`}
          onClick={() => { setContentMode('vote'); setSelectedVoteDay('all'); }}
        >全体</button>
        {uniqueDays.map((dayNum, idx) => (
          <button
            key={dayNum}
            className={`vote-day-tab${contentMode === 'vote' && selectedVoteDay === dayNum ? ' vote-day-tab--active' : ''}`}
            onClick={() => { setContentMode('vote'); setSelectedVoteDay(dayNum); }}
          >
            {dayNum}日目
            {idx === uniqueDays.length - 1 && (
              <span
                className="vote-day-tab-del"
                onClick={(e) => { e.stopPropagation(); handleRemoveDayTab(dayNum); }}
                title="この日を削除"
              >×</span>
            )}
          </button>
        ))}
        <button className="vote-add-btn" onClick={onAddDay}>＋ 日を追加</button>
        {typeof selectedVoteDay === 'number' && (
          <button className="vote-add-btn" onClick={() => onAddRound(selectedVoteDay)}>＋ 再投票</button>
        )}
      </div>

      {/* コンテンツ */}
      {contentMode === 'vote' ? (
        selectedVoteDay === 'all' ? (
          <table className="vote-table">
            <thead>
              <tr>
                <th className="vote-th vote-th--player">プレイヤー</th>
                {voteDayInfo.map((info, d) => (
                  <th key={d} className="vote-th vote-th--day">{getDayLabel(info)}</th>
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
                  {Array.from({ length: allEntryCount }, (_, d) => (
                    <td key={d} className="vote-td vote-td--cell">{renderVoteSelect(d, pi)}</td>
                  ))}
                  <td className="vote-td vote-td--empty" />
                </tr>
              ))}
            </tbody>
          </table>
        ) : renderSingleDayView()
      ) : (
        selectedMemoDay === 'all' ? (
          <div className="memo-all">
            {uniqueDays.map((dayNum) => (
              <div key={dayNum} className="memo-all-item">
                <span className="memo-all-label">{dayNum}日目</span>
                <span className="memo-all-text">{dayMemos[dayNum] || <span className="vote-placeholder">（メモなし）</span>}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="memo-section">
            <label className="memo-label">{selectedMemoDay}日目 メモ</label>
            <textarea
              className="memo-textarea"
              value={typeof selectedMemoDay === 'number' ? (dayMemos[selectedMemoDay] ?? '') : ''}
              onChange={(e) => { if (typeof selectedMemoDay === 'number') onUpdateMemo(selectedMemoDay, e.target.value); }}
              placeholder="この日のメモを入力..."
              rows={40}
            />
          </div>
        )
      )}
    </div>
  );
}
