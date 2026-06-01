export type IconDef = {
  id: string;
  label: string;
  color: string;
  colors?: string[];  // CO順の色シーケンス（役職COアイコンのみ）
  textColor: string;
  title: string;
  border?: string;
  shape?: 'badge';
};

export type IconCategory = {
  label: string;
  icons: IconDef[];
};

export const ICON_CATEGORIES: IconCategory[] = [
  {
    label: '役職CO',
    icons: [
      { id: 'seer',   label: '占', color: '#1d4ed8', colors: ['#1d4ed8', '#dc2626', '#d97706'], textColor: '#fff', title: '占い師' },
      { id: 'medium', label: '霊', color: '#7e22ce', colors: ['#7e22ce', '#0f766e', '#c2410c'], textColor: '#fff', title: '霊媒師' },
      { id: 'hunter', label: '狩', color: '#4d7c0f', colors: ['#4d7c0f', '#be185d', '#1e3a8a'], textColor: '#fff', title: '狩人' },
    ],
  },
  {
    label: '占い／霊媒 結果',
    icons: [
      { id: 'white',   label: '白', color: '#f8fafc', textColor: '#1e293b', title: '白判定', border: '#94a3b8' },
      { id: 'black',   label: '黒', color: '#1e293b', textColor: '#f8fafc', title: '黒判定', border: '#475569' },
    ],
  },
  {
    label: '状態',
    icons: [
      { id: 'attack', label: '╲╲╲', color: '#7f1d1d', textColor: '#fca5a5', title: '襲撃', shape: 'badge' },
      { id: 'hang',   label: '✕',   color: '#dc2626', textColor: '#fff',    title: '吊り', shape: 'badge' },
    ],
  },
];
