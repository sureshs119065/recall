import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

/* ---------------------------------------------------------------------
   RECALL — pitch prototype (v3 / "ultimate")
   No external dependencies beyond React. All layout is inline styles;
   a small scoped <style> block covers hover states, keyframes, and
   the one media query. State for the whole roster lives in <App> and
   is shared across every screen, so assigning a mistake as the coach
   and resolving it as the student are visibly the same event.

   New in v3:
   - Overview screen: the pitch itself, dramatized as an animated race
     between a generic lesson library (assign -> done) and Recall
     (assign -> attempt & explain -> confirm -> held).
   - Present Mode: a narrator caption bar that explains what to notice
     on whatever screen you're on — built for talking through this in
     an interview without having to narrate the UI yourself.
   - Keyboard shortcuts (1/2/3/4) to jump screens while presenting.
--------------------------------------------------------------------- */

const INK = '#0f1210';
const PANEL = '#171b16';
const PANEL_2 = '#1e231c';
const HAIRLINE = '#2b3227';
const CREAM = '#ece6d6';
const MUTED = '#8d9483';
const GOLD = '#c8a355';
const RED = '#b8543f';
const GREEN = '#7a9b5e';
const AMBER = '#d69a45';

const SERIF = "'Iowan Old Style','Palatino Linotype','Book Antiqua',Georgia,serif";
const SANS = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

function squareId(row, col) { return FILES[col] + (8 - row); }
function uid() { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36); }

/* --------------------------------- icons (inline svg, no deps) --------------------------------- */

const Icon = {
  flag: (p) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke={p.color||'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>,
  clock: (p) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke={p.color||'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  check: (p) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke={p.color||'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  alert: (p) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke={p.color||'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  x: (p) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke={p.color||'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  chevron: (p) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke={p.color||'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={p.style} ><polyline points="9 18 15 12 9 6"/></svg>,
  chevronDown: (p) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke={p.color||'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{transition:'transform .2s ease', transform: p.open ? 'rotate(90deg)' : 'rotate(0deg)'}}><polyline points="9 18 15 12 9 6"/></svg>,
  user: (p) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke={p.color||'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  arrowRight: (p) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke={p.color||'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  sparkle: (p) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke={p.color||'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/></svg>,
  play: (p) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill={p.color||'currentColor'} stroke="none"><polygon points="6 3 20 12 6 21 6 3"/></svg>,
  pause: (p) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill={p.color||'currentColor'} stroke="none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
  refresh: (p) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke={p.color||'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
  mic: (p) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke={p.color||'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/></svg>,
};

/* ----------------------------- Chessboard ----------------------------- */

function Chessboard({ pieces, actualMove, correctMove, targetSquares, selected, onSquareClick }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gridTemplateRows: 'repeat(8, 1fr)',
      width: '100%', aspectRatio: '1 / 1', borderRadius: 3, overflow: 'hidden',
      border: `1px solid ${HAIRLINE}`, boxShadow: '0 20px 60px -15px rgba(0,0,0,0.6)',
    }}>
      {Array.from({ length: 8 }).map((_, row) =>
        Array.from({ length: 8 }).map((_, col) => {
          const sq = squareId(row, col);
          const dark = (row + col) % 2 === 1;
          const piece = pieces[sq];
          const isActualFrom = actualMove && actualMove.from === sq;
          const isActualTo = actualMove && actualMove.to === sq;
          const isCorrectFrom = correctMove && correctMove.from === sq;
          const isCorrectTo = correctMove && correctMove.to === sq;
          const isTarget = targetSquares && targetSquares.includes(sq);
          const isSelected = selected === sq;
          const isWhite = piece && '♔♕♖♗♘♙'.includes(piece);

          return (
            <div key={sq} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: dark ? '#232b1e' : '#33402c', userSelect: 'none' }}>
              {(isCorrectFrom || isCorrectTo) && (
                <div style={{ position: 'absolute', inset: 3, borderRadius: 2, border: `2px solid ${GREEN}`, background: isCorrectTo ? 'rgba(122,155,94,0.28)' : 'transparent' }} />
              )}
              {(isActualFrom || isActualTo) && (
                <div style={{ position: 'absolute', inset: 3, borderRadius: 2, border: `2px dashed ${RED}`, background: isActualTo ? 'rgba(184,84,63,0.28)' : 'transparent' }} />
              )}
              {isTarget && (
                <button onClick={() => onSquareClick(sq)} className="recall-target-btn" style={{ position: 'absolute', inset: 0, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }} aria-label={`Move to ${sq}`}>
                  <span style={{ position: 'absolute', inset: 8, borderRadius: '50%', transition: 'all .2s ease', background: isSelected ? 'rgba(200,163,85,0.85)' : 'rgba(236,230,214,0.16)', boxShadow: isSelected ? `0 0 0 3px ${GOLD}` : 'none' }} />
                </button>
              )}
              {piece && (
                <span style={{ fontSize: 'clamp(20px, 4.2vw, 34px)', lineHeight: 1, position: 'relative', zIndex: 1, color: isWhite ? '#f4f0e4' : '#12140f', filter: isWhite ? 'drop-shadow(0 1px 1px rgba(0,0,0,0.5))' : 'drop-shadow(0 1px 0px rgba(255,255,255,0.15))' }}>{piece}</span>
              )}
              {col === 0 && <span style={{ position: 'absolute', top: 2, left: 4, fontSize: 9, color: 'rgba(236,230,214,0.35)' }}>{8 - row}</span>}
              {row === 7 && <span style={{ position: 'absolute', bottom: 2, right: 4, fontSize: 9, color: 'rgba(236,230,214,0.35)' }}>{FILES[col]}</span>}
            </div>
          );
        })
      )}
    </div>
  );
}

function MiniThumb({ pieces }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gridTemplateRows: 'repeat(8,1fr)', width: '100%', height: '100%' }}>
      {Array.from({ length: 8 }).map((_, row) =>
        Array.from({ length: 8 }).map((_, col) => {
          const sq = squareId(row, col);
          const dark = (row + col) % 2 === 1;
          const piece = pieces[sq];
          return (
            <div key={sq} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: dark ? '#232b1e' : '#33402c' }}>
              {piece && <span style={{ fontSize: 8, lineHeight: 1, color: '♔♕♖♗♘♙'.includes(piece) ? '#f4f0e4' : '#12140f' }}>{piece}</span>}
            </div>
          );
        })
      )}
    </div>
  );
}

/* --------------------------- Mistake bank (templates coach can assign) --------------------------- */

const MISTAKE_BANK = [
  {
    templateId: 'rook-endgame', title: 'Rook endgame — king march', shortLabel: 'Missed the opposition',
    oneLine: 'What actually needed to happen here?', move: 41,
    pieces: { e8: '♚', h8: '♜', e5: '♔', a1: '♖', e6: '♙' },
    actualMove: { from: 'e5', to: 'd5' }, correctMove: { from: 'e5', to: 'f6' },
    targetSquares: ['d5', 'd6', 'f5', 'f6'], correctSquare: 'f6',
    keywords: ['opposition', 'king'],
    annotation: 'Missed the opposition — Kf6 shuts the black king out and shepherds the pawn home.',
    notePlaceholder: 'Think about which square keeps the black king shut out before you push the pawn.',
  },
  {
    templateId: 'back-rank', title: 'Back-rank blindness', shortLabel: 'Back-rank blindness',
    oneLine: 'Was the king actually safe here?', move: 24,
    pieces: { g8: '♚', f7: '♟', g7: '♟', h7: '♟', a1: '♖' },
    actualMove: { from: 'a1', to: 'b1' }, correctMove: { from: 'a1', to: 'a8' },
    targetSquares: ['a8', 'b1', 'c1', 'a5'], correctSquare: 'a8',
    keywords: ['back rank', 'mate', 'escape'],
    annotation: 'Missed the mate — the black king has no escape square on the back rank.',
    notePlaceholder: 'Check every rank before you play a quiet move — is there a bigger threat on the board?',
  },
  {
    templateId: 'pawn-break', title: 'Overextended pawn break', shortLabel: 'Overextended pawn break',
    oneLine: 'Was it safe to push before tucking the king away?', move: 18,
    pieces: { g8: '♚', c6: '♞', g1: '♔', d4: '♙', e4: '♙' },
    actualMove: { from: 'd4', to: 'd5' }, correctMove: { from: 'g1', to: 'f1' },
    targetSquares: ['f1', 'f2', 'h1', 'h2'], correctSquare: 'f1',
    keywords: ['king', 'safety', 'safe'],
    annotation: 'Missed king safety — Kf1 first; the pawn break can wait until the king is tucked away.',
    notePlaceholder: 'Before committing pawns, ask: is my own king settled first?',
  },
  {
    templateId: 'hanging-piece', title: 'Hanging piece on move 22', shortLabel: 'Hanging piece on move 22',
    oneLine: 'Did that bishop have anywhere safe to go?', move: 22,
    pieces: { e8: '♚', d5: '♞', c3: '♗' },
    actualMove: { from: 'c3', to: 'b4' }, correctMove: { from: 'c3', to: 'd2' },
    targetSquares: ['b4', 'd2', 'e1', 'a5'], correctSquare: 'd2',
    keywords: ['safe', 'retreat', 'hanging', 'fork'],
    annotation: 'Missed the retreat — Bd2 saves the piece instead of wandering into a knight fork.',
    notePlaceholder: 'Scan for forks before moving a piece toward the center.',
  },
];

function outcomeFromResult(result) {
  if (result === 'confirmed') return 'hit';
  if (result === 'not-confirmed') return 'partial';
  return 'miss';
}
function statusFromOutcome(outcome) {
  if (outcome === 'hit') return 'Confirmed Fixed';
  if (outcome === 'partial') return 'Improving';
  return 'Stuck';
}

function dateRank(d) {
  if (d === 'Just now') return 9999;
  if (d === 'Today') return 9998;
  const m = /Jul (\d+)/.exec(d || '');
  return m ? parseInt(m[1], 10) : -1;
}

function downloadCSV(rows) {
  const header = ['Student', 'Mistake', 'Category', 'Assigned', 'Status', 'Attempts', 'Last outcome', 'Last reasoning'];
  const lines = rows.map((r) => {
    const last = r.history[r.history.length - 1];
    return [
      r.studentName, r.title, r.shortLabel, r.assignedDate, r.status, r.history.length,
      last ? last.outcome : '', last ? last.reasoning.replace(/"/g, "'") : '',
    ].map((v) => `"${String(v)}"`).join(',');
  });
  const csv = [header.join(','), ...lines].join('\n');
  const uri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  const link = document.createElement('a');
  link.setAttribute('href', uri);
  link.setAttribute('download', 'recall-roster-export.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function makeMistake(template, assignedDate) {
  const t = MISTAKE_BANK.find((m) => m.templateId === template);
  return { ...t, id: uid(), assignedDate, status: 'Stuck', history: [] };
}

/* --------------------------- Initial roster (shared state) --------------------------- */

const INITIAL_ROSTER = [
  {
    id: 'maya', name: 'Maya Chen',
    mistakes: [{
      ...MISTAKE_BANK[0], id: 'm-maya-1', assignedDate: 'Jul 14', status: 'Improving',
      history: [
        { date: 'Jul 14', outcome: 'miss', reasoning: 'Kd5 keeps the king closer to the center.' },
        { date: 'Jul 15', outcome: 'miss', reasoning: 'I thought the rook covered it.' },
        { date: 'Jul 17', outcome: 'partial', reasoning: 'Kf6 felt right.' },
        { date: 'Jul 19', outcome: 'partial', reasoning: 'Kf6 again, still not sure why.' },
      ],
    }],
  },
  {
    id: 'theo', name: 'Theo Martins',
    mistakes: [{
      ...MISTAKE_BANK[1], id: 'm-theo-1', assignedDate: 'Jul 9', status: 'Confirmed Fixed',
      history: [
        { date: 'Jul 9', outcome: 'miss', reasoning: 'Rb1 looked more active.' },
        { date: 'Jul 10', outcome: 'partial', reasoning: 'Ra8 — back rank mate.' },
        { date: 'Jul 12', outcome: 'hit', reasoning: 'Ra8 is mate — the king has no escape square on the back rank.' },
        { date: 'Jul 16', outcome: 'hit', reasoning: 'Checked the back rank first — mate with Ra8.' },
        { date: 'Jul 20', outcome: 'hit', reasoning: 'Back rank mate, no escape square for the king.' },
      ],
    }],
  },
  {
    id: 'priya', name: 'Priya Shah',
    mistakes: [{
      ...MISTAKE_BANK[2], id: 'm-priya-1', assignedDate: 'Jul 15', status: 'Stuck',
      history: [
        { date: 'Jul 15', outcome: 'miss', reasoning: 'd5 grabs more space.' },
        { date: 'Jul 16', outcome: 'miss', reasoning: 'Still think the pawn push is right.' },
        { date: 'Jul 18', outcome: 'miss', reasoning: 'd5 opens lines for my pieces.' },
      ],
    }],
  },
  {
    id: 'owen', name: 'Owen Blake',
    mistakes: [{
      ...MISTAKE_BANK[3], id: 'm-owen-1', assignedDate: 'Jul 5', status: 'Confirmed Fixed',
      history: [
        { date: 'Jul 5', outcome: 'miss', reasoning: 'Bb4 pins the knight.' },
        { date: 'Jul 6', outcome: 'hit', reasoning: 'Bd2 avoids the fork and keeps the piece safe.' },
        { date: 'Jul 9', outcome: 'hit', reasoning: 'Scanned for forks first, retreated to d2.' },
        { date: 'Jul 13', outcome: 'hit', reasoning: 'Bd2 — safe square, no fork available.' },
        { date: 'Jul 18', outcome: 'hit', reasoning: 'Same idea, retreated before advancing.' },
      ],
    }],
  },
  {
    id: 'sofia', name: 'Sofia Reyes',
    mistakes: [{
      ...MISTAKE_BANK[1], id: 'm-sofia-1', assignedDate: 'Jul 17', status: 'Stuck',
      history: [
        { date: 'Jul 17', outcome: 'miss', reasoning: 'Wanted to activate the rook.' },
        { date: 'Jul 18', outcome: 'miss', reasoning: 'Missed it again, same idea.' },
      ],
    }],
  },
];

/* ------------------------------- Loop bar ------------------------------- */

const STAGES = ['Flag the mistake', 'Attempt & explain', 'System confirms', 'Coach sees it hold'];

function LoopBar({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%', flexWrap: 'wrap', rowGap: 10 }}>
      {STAGES.map((label, i) => (
        <React.Fragment key={label}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', transition: 'all .3s ease', background: i <= current ? GOLD : 'transparent', border: `1px solid ${i <= current ? GOLD : HAIRLINE}`, boxShadow: i === current ? '0 0 0 3px rgba(200,163,85,0.18)' : 'none' }} />
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap', transition: 'color .3s ease', color: i === current ? CREAM : i < current ? MUTED : 'rgba(141,148,131,0.45)' }}>{label}</span>
          </div>
          {i < STAGES.length - 1 && <div style={{ height: 1, flex: 1, minWidth: 24, margin: '0 12px', transition: 'background .3s ease', background: i < current ? GOLD : HAIRLINE, opacity: i < current ? 0.5 : 1 }} />}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ------------------------------- Small UI atoms ------------------------------- */

function TabButton({ active, onClick, eyebrow, label, keyHint }) {
  return (
    <button onClick={onClick} className="recall-hoverable" style={{ textAlign: 'left', padding: '10px 16px', borderRadius: 3, cursor: 'pointer', background: active ? PANEL_2 : 'transparent', border: `1px solid ${active ? HAIRLINE : 'transparent'}`, transition: 'all .2s ease', flexShrink: 0, position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: active ? GOLD : MUTED }}>{eyebrow}</span>
        {keyHint && <span style={{ fontSize: 9, color: MUTED, border: `1px solid ${HAIRLINE}`, borderRadius: 3, padding: '0 4px', opacity: 0.7 }}>{keyHint}</span>}
      </div>
      <div style={{ fontSize: 14, color: active ? CREAM : MUTED, fontFamily: SERIF }}>{label}</div>
    </button>
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ background: PANEL, color: CREAM, border: `1px solid ${HAIRLINE}`, borderRadius: 3, padding: '8px 10px', fontSize: 13, fontFamily: SANS, outline: 'none', cursor: 'pointer' }}
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function StatusBadge({ status }) {
  const color = status === 'Stuck' ? RED : status === 'Improving' ? AMBER : GREEN;
  return <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 999, color, border: `1px solid ${color}`, whiteSpace: 'nowrap' }}>{status}</span>;
}

function ConfettiBurst({ color }) {
  const n = 10;
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}>
      {Array.from({ length: n }).map((_, i) => (
        <span key={i} className="recall-confetti-dot" style={{ '--angle': `${(360 / n) * i}deg`, background: i % 2 ? GOLD : color }} />
      ))}
    </div>
  );
}

/* ------------------------------- Overview / pitch screen ------------------------------- */

const RACE_STEPS = [
  { library: 'Card assigned', recall: 'Card assigned', libraryDone: false, recallDone: false },
  { library: 'Link sent', recall: 'Student attempts the move', libraryDone: false, recallDone: false },
  { library: '— nothing else happens —', recall: 'Student explains their reasoning', libraryDone: false, recallDone: false },
  { library: 'Marked "complete"', recall: 'System checks if the idea actually landed', libraryDone: true, recallDone: false },
  { library: 'No one knows if it stuck', recall: 'Coach sees exactly what held, roster-wide', libraryDone: true, recallDone: true },
];

function OverviewScreen({ onJump }) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!playing) return;
    if (step >= RACE_STEPS.length - 1) { setPlaying(false); return; }
    timerRef.current = setTimeout(() => setStep((s) => Math.min(s + 1, RACE_STEPS.length - 1)), 1100);
    return () => clearTimeout(timerRef.current);
  }, [playing, step]);

  function play() {
    if (step >= RACE_STEPS.length - 1) setStep(0);
    setPlaying(true);
  }
  function reset() { setPlaying(false); setStep(0); }

  return (
    <div>
      <div style={{ maxWidth: 720, marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: GOLD, marginBottom: 14 }}>
          <Icon.sparkle size={13} color={GOLD} /> The pitch, in one loop
        </div>
        <h1 style={{ fontFamily: SERIF, fontWeight: 400, color: CREAM, fontSize: 'clamp(28px, 4.5vw, 44px)', lineHeight: 1.15, margin: 0 }}>
          Assigned isn't the same as understood.
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: MUTED, marginTop: 18, maxWidth: 620 }}>
          A coach can already flag a mistake and send a lesson. What no chess platform does today is confirm,
          afterward, that the correction actually held — for one student, or across a whole roster. That's the
          entire idea. Everything below is one race between the old way and Recall, at the same speed.
        </p>
      </div>

      <div style={{ border: `1px solid ${HAIRLINE}`, borderRadius: 4, padding: '24px 24px 20px', background: PANEL, marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: MUTED }}>Same mistake, two workflows, run side by side</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={play} className="recall-hoverable" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '7px 14px', borderRadius: 999, background: playing ? PANEL_2 : GOLD, color: playing ? CREAM : INK, border: `1px solid ${playing ? HAIRLINE : GOLD}`, cursor: 'pointer' }}>
              {playing ? <Icon.pause size={11} /> : <Icon.play size={11} />} {playing ? 'Playing…' : step >= RACE_STEPS.length - 1 ? 'Replay' : 'Play the race'}
            </button>
            <button onClick={reset} className="recall-hoverable" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '7px 12px', borderRadius: 999, background: 'transparent', color: MUTED, border: `1px solid ${HAIRLINE}`, cursor: 'pointer' }}>
              <Icon.refresh size={11} /> Reset
            </button>
          </div>
        </div>

        <div className="recall-two-col">
          <RaceColumn
            label="Generic lesson library"
            tone={MUTED}
            steps={RACE_STEPS.map((s) => s.library)}
            step={step}
            doneAt={3}
            endState="closed"
          />
          <RaceColumn
            label="Recall"
            tone={GOLD}
            steps={RACE_STEPS.map((s) => s.recall)}
            step={step}
            doneAt={4}
            endState="confirmed"
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <PitchCard icon={Icon.flag} title="Diagnosis-specific" body="Tied to the exact position and the exact idea the student missed — not a generic topic pulled from a library." />
        <PitchCard icon={Icon.mic} title="Reasoning, not just the move" body="The student has to say why, in their own words. A correct square with the wrong reason doesn't count as understood." />
        <PitchCard icon={Icon.check} title="Closed-loop by design" body="Every card stays open until it's confirmed — and if it isn't, it comes back sooner instead of quietly disappearing." />
        <PitchCard icon={Icon.user} title="Visible at the roster level" body="A coach can see, across every student, which corrections actually held — something no spreadsheet or chat thread shows today." />
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button onClick={() => onJump('flag')} className="recall-hoverable" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 3, fontSize: 14, background: GOLD, color: INK, border: 'none', cursor: 'pointer' }}>
          Try it as the coach <Icon.arrowRight size={14} />
        </button>
        <button onClick={() => onJump('queue')} className="recall-hoverable" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 3, fontSize: 14, background: 'transparent', color: CREAM, border: `1px solid ${HAIRLINE}`, cursor: 'pointer' }}>
          Try it as the student
        </button>
        <button onClick={() => onJump('dashboard')} className="recall-hoverable" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 3, fontSize: 14, background: 'transparent', color: CREAM, border: `1px solid ${HAIRLINE}`, cursor: 'pointer' }}>
          See the roster dashboard
        </button>
      </div>
    </div>
  );
}

function RaceColumn({ label, tone, steps, step, doneAt, endState }) {
  const finished = step >= steps.length - 1;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: tone }} />
        <span style={{ fontSize: 14, fontFamily: SERIF, color: CREAM }}>{label}</span>
        {finished && (
          <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '2px 8px', borderRadius: 999, border: `1px solid ${endState === 'confirmed' ? GREEN : HAIRLINE}`, color: endState === 'confirmed' ? GREEN : MUTED }}>
            {endState === 'confirmed' ? 'Confirmed' : 'Closed, no signal'}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {steps.map((label2, i) => {
          const reached = i <= step;
          const isCurrent = i === step;
          return (
            <div key={i} style={{ display: 'flex', gap: 12, opacity: reached ? 1 : 0.3, transition: 'opacity .3s ease' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 16 }}>
                <div style={{
                  width: 9, height: 9, borderRadius: '50%', flexShrink: 0, marginTop: 3,
                  background: reached ? (i >= doneAt ? (endState === 'confirmed' ? GREEN : HAIRLINE) : tone) : 'transparent',
                  border: `1px solid ${reached ? (i >= doneAt ? (endState === 'confirmed' ? GREEN : MUTED) : tone) : HAIRLINE}`,
                  boxShadow: isCurrent ? `0 0 0 4px ${tone}22` : 'none', transition: 'all .3s ease',
                }} />
                {i < steps.length - 1 && <div style={{ width: 1, flex: 1, minHeight: 22, background: reached && i < step ? HAIRLINE : 'transparent', borderLeft: `1px dashed ${HAIRLINE}` }} />}
              </div>
              <div style={{ paddingBottom: 20, fontSize: 13, lineHeight: 1.5, color: reached ? (i >= doneAt && endState !== 'confirmed' ? MUTED : CREAM) : MUTED, fontStyle: label2.startsWith('—') ? 'italic' : 'normal' }}>
                {label2}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PitchCard({ icon: IconComp, title, body }) {
  return (
    <div style={{ border: `1px solid ${HAIRLINE}`, borderRadius: 3, padding: 18, background: PANEL }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${HAIRLINE}`, marginBottom: 12 }}>
        <IconComp size={13} color={GOLD} />
      </div>
      <div style={{ fontSize: 14, fontFamily: SERIF, color: CREAM, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 12, lineHeight: 1.6, color: MUTED }}>{body}</div>
    </div>
  );
}

/* ------------------------------- Coach: Flag screen ------------------------------- */

function CoachFlagScreen({ roster, onAssign, activity }) {
  const [studentId, setStudentId] = useState(roster[0].id);
  const [templateId, setTemplateId] = useState(MISTAKE_BANK[0].templateId);
  const [assigning, setAssigning] = useState(false);
  const [note, setNote] = useState('');
  const [justAssigned, setJustAssigned] = useState(false);
  const [enteringId, setEnteringId] = useState(null);

  const template = MISTAKE_BANK.find((m) => m.templateId === templateId);
  const studentName = roster.find((s) => s.id === studentId).name;

  function pickTemplate(id) {
    setTemplateId(id);
    setAssigning(false);
    setJustAssigned(false);
    setNote('');
  }

  function handleAssign() {
    const newId = onAssign(studentId, templateId, note);
    setEnteringId(newId);
    setJustAssigned(true);
    setAssigning(false);
    setNote('');
    requestAnimationFrame(() => requestAnimationFrame(() => setEnteringId(null)));
  }

  return (
    <div className="recall-two-col">
      <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
          {MISTAKE_BANK.map((m) => (
            <button
              key={m.templateId}
              onClick={() => pickTemplate(m.templateId)}
              className="recall-hoverable"
              style={{
                fontSize: 12, padding: '7px 12px', borderRadius: 999, cursor: 'pointer',
                background: templateId === m.templateId ? PANEL_2 : 'transparent',
                border: `1px solid ${templateId === m.templateId ? GOLD : HAIRLINE}`,
                color: templateId === m.templateId ? GOLD : MUTED, transition: 'all .15s ease',
              }}
            >
              {m.shortLabel}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: MUTED }}>Move {template.move} · sparring set</div>
          <h2 style={{ fontFamily: SERIF, color: CREAM, fontSize: 24, marginTop: 4, fontWeight: 400 }}>{template.title}</h2>
        </div>
        <div style={{ maxWidth: 420 }}>
          <Chessboard pieces={template.pieces} actualMove={template.actualMove} correctMove={template.correctMove} />
        </div>
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 420 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
            <span style={{ width: 12, height: 12, borderRadius: 2, border: `2px dashed ${RED}`, display: 'inline-block' }} />
            <span style={{ color: MUTED }}>Played: <span style={{ color: CREAM }}>{template.actualMove.from}–{template.actualMove.to}</span></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
            <span style={{ width: 12, height: 12, borderRadius: 2, border: `2px solid ${GREEN}`, display: 'inline-block' }} />
            <span style={{ color: MUTED }}>Correct: <span style={{ color: CREAM }}>{template.correctMove.from}–{template.correctMove.to}</span></span>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: CREAM, fontFamily: SERIF, marginTop: 8 }}>"{template.annotation}"</p>
        </div>

        <div style={{ marginTop: 28, maxWidth: 420 }}>
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: MUTED }}>Assign to</span>
            <Select value={studentId} onChange={setStudentId} options={roster.map((s) => ({ value: s.id, label: s.name }))} />
          </div>
          {!assigning && !justAssigned && (
            <button onClick={() => setAssigning(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 3, fontSize: 14, background: GOLD, color: INK, border: 'none', cursor: 'pointer' }}>
              <Icon.flag size={14} /> Assign to Recall
            </button>
          )}
          {assigning && (
            <div style={{ border: `1px solid ${HAIRLINE}`, borderRadius: 3, padding: 16, background: PANEL }}>
              <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: MUTED }}>Note for {studentName}</label>
              <textarea autoFocus value={note} onChange={(e) => setNote(e.target.value)} placeholder={template.notePlaceholder} rows={3}
                style={{ width: '100%', marginTop: 8, background: 'transparent', border: `1px solid ${HAIRLINE}`, borderRadius: 3, padding: 8, fontSize: 14, outline: 'none', resize: 'none', color: CREAM, fontFamily: SERIF, boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button onClick={handleAssign} style={{ padding: '8px 16px', borderRadius: 3, fontSize: 14, background: GOLD, color: INK, border: 'none', cursor: 'pointer' }}>Add to queue</button>
                <button onClick={() => setAssigning(false)} style={{ padding: '8px 16px', borderRadius: 3, fontSize: 14, color: MUTED, background: 'transparent', border: 'none', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          )}
          {justAssigned && !assigning && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: GREEN }}>
              <Icon.check size={15} /> Sent to {studentName}'s Recall queue.
            </div>
          )}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: MUTED, marginBottom: 12 }}>Recall queue · across your roster</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {activity.map((item) => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: `1px solid ${HAIRLINE}`, borderRadius: 3, padding: '12px 16px', background: PANEL, transition: 'all .5s ease-out', opacity: enteringId === item.id ? 0 : 1, transform: enteringId === item.id ? 'translateY(-10px)' : 'translateY(0)' }}>
              <div>
                <div style={{ fontSize: 14, color: CREAM, fontFamily: SERIF }}>{item.student}</div>
                <div style={{ fontSize: 12, marginTop: 2, color: MUTED }}>{item.desc}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: MUTED }}><Icon.clock size={11} /> {item.time}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, marginTop: 20, lineHeight: 1.6, color: MUTED }}>
          A lesson library ends here — link sent, task closed. Recall keeps this card open until the student attempts it,
          explains their reasoning, and the system confirms the idea actually stuck. Try it: assign this, then switch to
          the Student tab as {studentName}.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------- Student: Queue screen ------------------------------- */

function StudentQueueScreen({ roster, studentId, setStudentId, view, setView, selectedMistakeId, setSelectedMistakeId, onResolve }) {
  const [attempt, setAttempt] = useState(null);
  const [reasoning, setReasoning] = useState('');
  const [result, setResult] = useState(null);

  const student = roster.find((s) => s.id === studentId);
  const due = student.mistakes.filter((m) => m.status !== 'Confirmed Fixed');
  const selectedMistake = student.mistakes.find((m) => m.id === selectedMistakeId);

  function openCard(m) {
    setSelectedMistakeId(m.id);
    setAttempt(null);
    setReasoning('');
    setResult(null);
    setView('attempt');
  }

  function submit() {
    const moveCorrect = attempt === selectedMistake.correctSquare;
    const reasoningHit = selectedMistake.keywords.some((k) => reasoning.toLowerCase().includes(k));
    let outcome;
    if (!moveCorrect) outcome = 'wrong-move';
    else if (reasoningHit) outcome = 'confirmed';
    else outcome = 'not-confirmed';
    setResult(outcome);
    setView('result');
    onResolve(studentId, selectedMistakeId, outcomeFromResult(outcome), reasoning);
  }

  function backToQueue() { setView('list'); setSelectedMistakeId(null); }
  function retry() { setAttempt(null); setReasoning(''); setResult(null); setView('attempt'); }

  const studentSwitcher = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 12, color: MUTED }}>Viewing as</span>
      <Select value={studentId} onChange={(id) => { setStudentId(id); setView('list'); setSelectedMistakeId(null); }} options={roster.map((s) => ({ value: s.id, label: s.name }))} />
    </div>
  );

  if (view === 'list') {
    return (
      <div>
        {studentSwitcher}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: MUTED }}>{student.name} · Due today</div>
          <h2 style={{ fontFamily: SERIF, color: CREAM, fontSize: 24, marginTop: 4, fontWeight: 400 }}>Your Recall queue</h2>
        </div>
        {due.length === 0 ? (
          <div style={{ maxWidth: 560, border: `1px dashed ${HAIRLINE}`, borderRadius: 3, padding: 28, textAlign: 'center' }}>
            <div style={{ fontSize: 15, color: CREAM, fontFamily: SERIF, marginBottom: 6 }}>All caught up</div>
            <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>Nothing due for {student.name} today — every assigned correction has held.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 560 }}>
            {due.map((m) => (
              <button key={m.id} onClick={() => openCard(m)} className="recall-hoverable" style={{ display: 'flex', alignItems: 'center', gap: 16, border: `1px solid ${HAIRLINE}`, borderRadius: 3, padding: 12, textAlign: 'left', background: PANEL, cursor: 'pointer', transition: 'border-color .15s ease' }}>
                <div style={{ width: 64, height: 64, flexShrink: 0, borderRadius: 3, overflow: 'hidden' }}><MiniThumb pieces={m.pieces} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: CREAM, fontFamily: SERIF }}>{m.shortLabel}</div>
                  <div style={{ fontSize: 12, marginTop: 4, color: MUTED }}>{m.oneLine}</div>
                </div>
                <StatusBadge status={m.status} />
                <Icon.chevron size={16} color={MUTED} />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (view === 'attempt') {
    const m = selectedMistake;
    return (
      <div className="recall-two-col">
        <div>
          <button onClick={backToQueue} style={{ fontSize: 12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4, color: MUTED, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>← Back to queue</button>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: MUTED }}>Move {m.move} · your position</div>
          <h2 style={{ fontFamily: SERIF, color: CREAM, fontSize: 20, marginTop: 4, marginBottom: 16, fontWeight: 400 }}>{m.oneLine}</h2>
          <div style={{ maxWidth: 420 }}><Chessboard pieces={m.pieces} targetSquares={m.targetSquares} selected={attempt} onSquareClick={setAttempt} /></div>
          <p style={{ fontSize: 12, marginTop: 12, color: MUTED }}>Click the square you think the piece should move to.</p>
        </div>
        <div>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: MUTED, marginBottom: 8 }}>Explain your reasoning</div>
          <textarea value={reasoning} onChange={(e) => setReasoning(e.target.value)} placeholder="Why does this square work?" rows={5}
            style={{ width: '100%', background: PANEL, border: `1px solid ${HAIRLINE}`, borderRadius: 3, padding: 12, fontSize: 14, outline: 'none', resize: 'none', color: CREAM, fontFamily: SERIF, boxSizing: 'border-box' }} />
          <button disabled={!attempt || reasoning.trim().length === 0} onClick={submit}
            style={{ marginTop: 16, padding: '10px 20px', borderRadius: 3, fontSize: 14, background: GOLD, color: INK, border: 'none', cursor: (!attempt || reasoning.trim().length === 0) ? 'default' : 'pointer', opacity: (!attempt || reasoning.trim().length === 0) ? 0.3 : 1, transition: 'opacity .15s ease' }}>
            Submit attempt
          </button>
          {m.history.length > 0 && (
            <div style={{ marginTop: 28 }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: MUTED, marginBottom: 10 }}>Review history so far</div>
              <MiniTimeline history={m.history} />
            </div>
          )}
        </div>
      </div>
    );
  }

  const m = selectedMistake;
  const config = {
    'wrong-move': { color: RED, icon: Icon.x, title: 'Not quite the right square', sub: "This one comes right back — try again with the note in mind.", pill: 'Reviews again tomorrow' },
    'not-confirmed': { color: AMBER, icon: Icon.alert, title: 'Understanding not confirmed', sub: "Right square, but the reasoning didn't name the idea behind it. This comes back sooner.", pill: 'Next review in 2 days' },
    confirmed: { color: GREEN, icon: Icon.check, title: 'Confirmed — it stuck', sub: 'Right move, right reasoning. The interval extends.', pill: 'Next review in 7 days' },
  }[result];
  const ResultIcon = config.icon;

  return (
    <div style={{ maxWidth: 560 }}>
      <button onClick={backToQueue} style={{ fontSize: 12, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 4, color: MUTED, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>← Back to queue</button>
      <div style={{ border: `1px solid ${config.color}`, borderRadius: 3, padding: 28, background: PANEL_2, boxShadow: `0 0 0 1px ${config.color}22`, transition: 'all .5s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: `${config.color}22`, border: `1px solid ${config.color}` }}>
            <ResultIcon size={18} color={config.color} />
            {result === 'confirmed' && <ConfettiBurst color={config.color} />}
          </div>
          <div style={{ fontSize: 18, fontFamily: SERIF, color: CREAM }}>{config.title}</div>
        </div>
        <p style={{ fontSize: 14, marginTop: 16, lineHeight: 1.6, color: CREAM }}>{config.sub}</p>

        {result !== 'wrong-move' && (
          <div style={{ marginTop: 20, fontSize: 14, border: `1px solid ${HAIRLINE}`, borderRadius: 3, padding: 12 }}>
            <span style={{ color: MUTED }}>You wrote: </span>
            <span style={{ color: CREAM, fontStyle: 'italic' }}>"{reasoning}"</span>
          </div>
        )}

        <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, fontSize: 12, border: `1px solid ${config.color}`, color: config.color }}><Icon.clock size={12} /> {config.pill}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {result !== 'confirmed' && <button onClick={retry} style={{ fontSize: 12, padding: '8px 12px', borderRadius: 3, color: MUTED, border: `1px solid ${HAIRLINE}`, background: 'transparent', cursor: 'pointer' }}>Try again now</button>}
            <button onClick={backToQueue} style={{ fontSize: 12, padding: '8px 12px', borderRadius: 3, background: GOLD, color: INK, border: 'none', cursor: 'pointer' }}>Back to queue</button>
          </div>
        </div>
      </div>
      <p style={{ fontSize: 12, marginTop: 20, lineHeight: 1.6, color: MUTED }}>
        This is the step a lesson library can't show: not just that {student.name.split(' ')[0]} opened the position, but whether the
        correction actually took. Switch to the Roster dashboard — this result is already there.
      </p>
    </div>
  );
}

function MiniTimeline({ history }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      {history.map((h, i) => (
        <span key={i} className="recall-dot-tooltip">
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: DOT_COLOR[h.outcome], display: 'inline-block' }} />
          <span className="recall-tooltip-bubble">{h.date} · {h.outcome}</span>
        </span>
      ))}
    </div>
  );
}

/* ------------------------------- Coach: Dashboard ------------------------------- */

const STATUS_COLOR = { Stuck: RED, Improving: AMBER, 'Confirmed Fixed': GREEN };
const DOT_COLOR = { miss: RED, partial: AMBER, hit: GREEN };

function Sparkline({ history }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {history.map((h, i) => (
        <React.Fragment key={i}>
          <span className="recall-dot-tooltip">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: DOT_COLOR[h.outcome], display: 'inline-block' }} />
            <span className="recall-tooltip-bubble">{h.date} · {h.outcome}</span>
          </span>
          {i < history.length - 1 && <div style={{ width: 12, height: 1, background: HAIRLINE, flexShrink: 0 }} />}
        </React.Fragment>
      ))}
    </div>
  );
}

function StatCard({ value, label, color }) {
  return (
    <div style={{ border: `1px solid ${HAIRLINE}`, borderRadius: 3, padding: '16px 18px', background: PANEL, flex: '1 1 160px', minWidth: 150 }}>
      <div style={{ fontFamily: SERIF, fontSize: 28, color: color || CREAM }}>{value}</div>
      <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>{label}</div>
    </div>
  );
}

const CATEGORY_ORDER = MISTAKE_BANK.map((m) => m.shortLabel);

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: PANEL_2, border: `1px solid ${HAIRLINE}`, borderRadius: 3, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ color: CREAM, marginBottom: 4, fontFamily: SERIF }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color, display: 'flex', gap: 8, justifyContent: 'space-between' }}>
          <span>{p.name}</span><span>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function SubTab({ active, onClick, label }) {
  return (
    <button onClick={onClick} className="recall-hoverable" style={{
      fontSize: 12, padding: '7px 14px', borderRadius: 999, cursor: 'pointer',
      background: active ? PANEL_2 : 'transparent', border: `1px solid ${active ? GOLD : HAIRLINE}`,
      color: active ? GOLD : MUTED, transition: 'all .15s ease',
    }}>{label}</button>
  );
}

function SortableTh({ label, sortKey, activeKey, dir, onClick, style }) {
  const active = sortKey === activeKey;
  return (
    <th onClick={sortKey ? () => onClick(sortKey) : undefined} style={{
      textAlign: 'left', fontWeight: 400, padding: '12px 16px', fontSize: 11, textTransform: 'uppercase',
      letterSpacing: '0.06em', color: active ? GOLD : MUTED, cursor: sortKey ? 'pointer' : 'default',
      userSelect: 'none', whiteSpace: 'nowrap', ...style,
    }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {label}
        {sortKey && <Icon.chevron size={10} color={active ? GOLD : 'rgba(141,148,131,0.4)'} style={{ transform: active && dir === 'asc' ? 'rotate(-90deg)' : 'rotate(90deg)', transition: 'transform .15s ease' }} />}
      </span>
    </th>
  );
}

function TrendsView({ rows }) {
  const byDate = useMemo(() => {
    const map = {};
    rows.forEach((r) => r.history.forEach((h) => {
      if (!map[h.date]) map[h.date] = { date: h.date, hit: 0, partial: 0, miss: 0 };
      map[h.date][h.outcome] += 1;
    }));
    return Object.values(map).sort((a, b) => dateRank(a.date) - dateRank(b.date));
  }, [rows]);

  const byCategory = useMemo(() => {
    return CATEGORY_ORDER.map((label) => {
      const inCat = rows.filter((r) => r.shortLabel === label);
      const stuck = inCat.filter((r) => r.status === 'Stuck').length;
      const improving = inCat.filter((r) => r.status === 'Improving').length;
      const fixed = inCat.filter((r) => r.status === 'Confirmed Fixed').length;
      return { label: label.length > 18 ? label.slice(0, 17) + '…' : label, fullLabel: label, stuck, improving, fixed, total: inCat.length };
    }).filter((c) => c.total > 0);
  }, [rows]);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 28 }}>
        <div style={{ border: `1px solid ${HAIRLINE}`, borderRadius: 4, padding: '20px 20px 8px', background: PANEL }}>
          <div style={{ fontSize: 13, fontFamily: SERIF, color: CREAM, marginBottom: 2 }}>Attempt outcomes over time</div>
          <div style={{ fontSize: 11, color: MUTED, marginBottom: 12 }}>Every attempt across the roster, by day — this is the loop actually closing.</div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={byDate} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={HAIRLINE} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: MUTED, fontSize: 11 }} axisLine={{ stroke: HAIRLINE }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: MUTED }} />
                <Line type="monotone" dataKey="hit" name="Confirmed" stroke={GREEN} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="partial" name="Not confirmed" stroke={AMBER} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="miss" name="Wrong move" stroke={RED} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ border: `1px solid ${HAIRLINE}`, borderRadius: 4, padding: '20px 20px 8px', background: PANEL }}>
          <div style={{ fontSize: 13, fontFamily: SERIF, color: CREAM, marginBottom: 2 }}>Where the roster gets stuck</div>
          <div style={{ fontSize: 11, color: MUTED, marginBottom: 12 }}>Mistake categories, broken down by current status — a generic lesson library can't split this by cause.</div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategory} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barCategoryGap={24}>
                <CartesianGrid stroke={HAIRLINE} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: MUTED, fontSize: 10 }} axisLine={{ stroke: HAIRLINE }} tickLine={false} interval={0} />
                <YAxis allowDecimals={false} tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: MUTED }} />
                <Bar dataKey="fixed" name="Confirmed fixed" stackId="a" fill={GREEN} radius={[0, 0, 0, 0]} />
                <Bar dataKey="improving" name="Improving" stackId="a" fill={AMBER} />
                <Bar dataKey="stuck" name="Stuck" stackId="a" fill={RED} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeatmapView({ roster }) {
  const [hovered, setHovered] = useState(null);
  const cellFor = (student, label) => student.mistakes.find((m) => m.shortLabel === label);

  return (
    <div style={{ border: `1px solid ${HAIRLINE}`, borderRadius: 4, padding: 20, background: PANEL }}>
      <div style={{ fontSize: 13, fontFamily: SERIF, color: CREAM, marginBottom: 2 }}>Roster × mistake type</div>
      <div style={{ fontSize: 11, color: MUTED, marginBottom: 16 }}>Every cell is one assigned correction. Hover for the detail — blank means it's never come up for that student.</div>
      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `140px repeat(${CATEGORY_ORDER.length}, minmax(96px, 1fr))`, minWidth: 560, gap: 6 }}>
          <div />
          {CATEGORY_ORDER.map((label) => (
            <div key={label} style={{ fontSize: 10, color: MUTED, textAlign: 'center', lineHeight: 1.3, padding: '0 2px 6px' }}>{label}</div>
          ))}
          {roster.map((s) => (
            <React.Fragment key={s.id}>
              <div style={{ fontSize: 13, color: CREAM, fontFamily: SERIF, display: 'flex', alignItems: 'center' }}>{s.name}</div>
              {CATEGORY_ORDER.map((label) => {
                const cell = cellFor(s, label);
                const key = s.id + label;
                const color = cell ? STATUS_COLOR[cell.status] : null;
                return (
                  <div key={label} onMouseEnter={() => cell && setHovered(key)} onMouseLeave={() => setHovered(null)} style={{ position: 'relative', height: 40, borderRadius: 3, background: cell ? `${color}26` : 'transparent', border: `1px solid ${cell ? color : HAIRLINE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: cell ? 'default' : 'default' }}>
                    {cell && <span style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />}
                    {cell && hovered === key && (
                      <div style={{ position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', background: PANEL_2, border: `1px solid ${HAIRLINE}`, borderRadius: 3, padding: '6px 10px', fontSize: 11, color: CREAM, whiteSpace: 'nowrap', zIndex: 5 }}>
                        {cell.status} · {cell.history.length} attempt{cell.history.length === 1 ? '' : 's'}
                      </div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 18, flexWrap: 'wrap' }}>
        {Object.entries(STATUS_COLOR).map(([label, color]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: MUTED }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: color }} /> {label}
          </div>
        ))}
      </div>
    </div>
  );
}

function CoachDashboard({ roster }) {
  const [view, setView] = useState('table');
  const [filter, setFilter] = useState('All');
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState('assignedDate');
  const [sortDir, setSortDir] = useState('desc');
  const [expandedId, setExpandedId] = useState(null);

  const rows = useMemo(() => roster.flatMap((s) => s.mistakes.map((m) => ({ ...m, studentName: s.name }))), [roster]);

  const counts = {
    Stuck: rows.filter((r) => r.status === 'Stuck').length,
    Improving: rows.filter((r) => r.status === 'Improving').length,
    'Confirmed Fixed': rows.filter((r) => r.status === 'Confirmed Fixed').length,
  };
  const confirmedRows = rows.filter((r) => r.status === 'Confirmed Fixed');
  const retentionRate = rows.length ? Math.round((confirmedRows.length / rows.length) * 100) : 0;
  const avgAttempts = confirmedRows.length
    ? (confirmedRows.reduce((sum, r) => sum + r.history.length, 0) / confirmedRows.length).toFixed(1)
    : '—';

  const filtered = useMemo(() => {
    let out = rows;
    if (filter !== 'All') out = out.filter((r) => r.status === filter);
    if (category !== 'All') out = out.filter((r) => r.shortLabel === category);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      out = out.filter((r) => r.studentName.toLowerCase().includes(q) || r.shortLabel.toLowerCase().includes(q));
    }
    const dir = sortDir === 'asc' ? 1 : -1;
    out = [...out].sort((a, b) => {
      if (sortKey === 'studentName' || sortKey === 'shortLabel' || sortKey === 'status') {
        return a[sortKey].localeCompare(b[sortKey]) * dir;
      }
      if (sortKey === 'attempts') return (a.history.length - b.history.length) * dir;
      if (sortKey === 'assignedDate') return (dateRank(a.assignedDate) - dateRank(b.assignedDate)) * dir;
      return 0;
    });
    return out;
  }, [rows, filter, category, query, sortKey, sortDir]);

  function toggleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  }

  return (
    <div>
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: MUTED }}>Coach view · roster analytics</div>
          <h2 style={{ fontFamily: SERIF, color: CREAM, fontSize: 24, marginTop: 4, fontWeight: 400 }}>Did it actually hold?</h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <SubTab active={view === 'table'} onClick={() => setView('table')} label="Table" />
          <SubTab active={view === 'trends'} onClick={() => setView('trends')} label="Trends" />
          <SubTab active={view === 'heatmap'} onClick={() => setView('heatmap')} label="Heatmap" />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <StatCard value={counts['Confirmed Fixed']} label="Confirmed fixed" color={GREEN} />
        <StatCard value={counts.Improving} label="Improving" color={AMBER} />
        <StatCard value={counts.Stuck} label="Stuck — needs attention" color={RED} />
        <StatCard value={`${retentionRate}%`} label="Roster retention rate" color={GOLD} />
        <StatCard value={avgAttempts} label="Avg. attempts to confirm" />
      </div>

      {view === 'table' && (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['All', 'Stuck', 'Improving', 'Confirmed Fixed'].map((f) => (
                <button key={f} onClick={() => setFilter(f)} className="recall-hoverable" style={{
                  fontSize: 12, padding: '6px 14px', borderRadius: 999, cursor: 'pointer',
                  background: filter === f ? PANEL_2 : 'transparent',
                  border: `1px solid ${filter === f ? GOLD : HAIRLINE}`,
                  color: filter === f ? GOLD : MUTED, transition: 'all .15s ease',
                }}>{f}{f !== 'All' ? ` (${counts[f]})` : ''}</button>
              ))}
            </div>
            <Select value={category} onChange={setCategory} options={[{ value: 'All', label: 'All categories' }, ...CATEGORY_ORDER.map((c) => ({ value: c, label: c }))]} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search student or mistake…"
              style={{ background: PANEL, color: CREAM, border: `1px solid ${HAIRLINE}`, borderRadius: 3, padding: '8px 10px', fontSize: 13, fontFamily: SANS, outline: 'none', minWidth: 200 }}
            />
            <button onClick={() => downloadCSV(filtered)} className="recall-hoverable" style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '8px 14px', borderRadius: 3, background: 'transparent', color: MUTED, border: `1px solid ${HAIRLINE}`, cursor: 'pointer' }}>
              Export CSV ({filtered.length})
            </button>
          </div>

          {filtered.length === 0 ? (
            <div style={{ border: `1px dashed ${HAIRLINE}`, borderRadius: 3, padding: 28, textAlign: 'center', color: MUTED, fontSize: 13 }}>
              No corrections match this filter.
            </div>
          ) : (
            <div style={{ overflowX: 'auto', border: `1px solid ${HAIRLINE}`, borderRadius: 3 }}>
              <table style={{ width: '100%', fontSize: 14, minWidth: 820, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${HAIRLINE}` }}>
                    <th style={{ width: 24, padding: '12px 0 12px 16px' }} />
                    <SortableTh label="Student" sortKey="studentName" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
                    <SortableTh label="Mistake assigned" sortKey="shortLabel" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
                    <SortableTh label="Date" sortKey="assignedDate" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
                    <SortableTh label="Status" sortKey="status" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
                    <SortableTh label="Attempts" sortKey="attempts" activeKey={sortKey} dir={sortDir} onClick={toggleSort} />
                    <SortableTh label="Review history" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => {
                    const isOpen = expandedId === r.id;
                    return (
                      <React.Fragment key={r.id}>
                        <tr onClick={() => setExpandedId(isOpen ? null : r.id)} className="recall-hoverable-row" style={{ borderBottom: isOpen ? 'none' : `1px solid ${HAIRLINE}`, background: i % 2 ? 'transparent' : PANEL, cursor: 'pointer' }}>
                          <td style={{ padding: '16px 0 16px 16px' }}><Icon.chevronDown size={14} color={MUTED} open={isOpen} /></td>
                          <td style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon.user size={13} color={MUTED} /><span style={{ color: CREAM, fontFamily: SERIF }}>{r.studentName}</span></div>
                          </td>
                          <td style={{ padding: '16px', color: CREAM }}>{r.shortLabel}</td>
                          <td style={{ padding: '16px', color: MUTED }}>{r.assignedDate}</td>
                          <td style={{ padding: '16px' }}><StatusBadge status={r.status} /></td>
                          <td style={{ padding: '16px', color: MUTED }}>{r.history.length}</td>
                          <td style={{ padding: '16px' }}>{r.history.length > 0 ? <Sparkline history={r.history} /> : <span style={{ fontSize: 12, color: MUTED }}>Not attempted yet</span>}</td>
                        </tr>
                        {isOpen && (
                          <tr style={{ borderBottom: `1px solid ${HAIRLINE}`, background: PANEL_2 }}>
                            <td colSpan={7} style={{ padding: '4px 16px 20px 48px' }}>
                              {r.history.length === 0 ? (
                                <div style={{ fontSize: 13, color: MUTED, padding: '8px 0' }}>No attempts logged yet — this card is waiting in {r.studentName.split(' ')[0]}'s queue.</div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10, maxWidth: 640 }}>
                                  {r.history.slice().reverse().map((h, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 13 }}>
                                      <span style={{ width: 74, flexShrink: 0, color: MUTED }}>{h.date}</span>
                                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: DOT_COLOR[h.outcome], marginTop: 5, flexShrink: 0 }} />
                                      <span style={{ width: 64, flexShrink: 0, color: STATUS_COLOR[statusFromOutcome(h.outcome)], fontSize: 12 }}>{h.outcome}</span>
                                      <span style={{ color: CREAM, fontStyle: 'italic', flex: 1 }}>"{h.reasoning}"</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {view === 'trends' && <TrendsView rows={rows} />}
      {view === 'heatmap' && <HeatmapView roster={roster} />}

      <div style={{ marginTop: 24, display: 'flex', alignItems: 'flex-start', gap: 12, border: `1px solid ${HAIRLINE}`, borderRadius: 3, padding: 16, maxWidth: 760, background: PANEL }}>
        <Icon.arrowRight size={15} color={GOLD} style={{ marginTop: 2, flexShrink: 0 }} />
        <p style={{ fontSize: 12, lineHeight: 1.6, color: MUTED }}>
          <span style={{ color: CREAM }}>{counts.Stuck} correction{counts.Stuck === 1 ? ' is' : 's are'} stuck</span> — every review keeps
          coming back a miss, worth a conversation this week. <span style={{ color: CREAM }}>{retentionRate}% roster retention</span> means
          that share of assigned corrections have been confirmed to hold, not just assigned. Click any row, or switch to
          Trends and Heatmap for the roster-wide shape a spreadsheet can't show.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------- Present-mode narrator ------------------------------- */

function narratorCaption(tab, view) {
  if (tab === 'overview') return 'This is the whole argument, dramatized: two workflows, same mistake, one closes and one confirms. Press play.';
  if (tab === 'flag') return "Point out: the note is tied to this exact position, not a generic topic. That's the diagnosis-specific half of the pitch.";
  if (tab === 'queue') {
    if (view === 'list') return "This is Maya's real queue — same data you just assigned, no page reload. Click a card.";
    if (view === 'attempt') return 'The student has to pick the square AND explain why. Try typing a reason that skips the key word — it will register as "not confirmed" even with the right move.';
    return 'This branch is the differentiator: right move, wrong reasoning still comes back sooner. That is the retention check no lesson library performs.';
  }
  if (tab === 'dashboard') return 'Table, Trends, and Heatmap are three cuts of the same data. Trends shows the loop closing over time; Heatmap shows every student against every mistake type at a glance — this is what a coach could never get from a WhatsApp thread.';
  return '';
}

/* ------------------------------------- App ------------------------------------- */

export default function App() {
  const [roster, setRoster] = useState(INITIAL_ROSTER);
  const [tab, setTab] = useState('overview');
  const [presentMode, setPresentMode] = useState(false);
  const [queueStudentId, setQueueStudentId] = useState('maya');
  const [studentView, setStudentView] = useState('list');
  const [selectedMistakeId, setSelectedMistakeId] = useState(null);
  const [activity, setActivity] = useState([
    { id: 'a1', student: 'Theo Martins', desc: 'Back-rank blindness', time: '2 days ago' },
    { id: 'a2', student: 'Priya Shah', desc: 'Overextended pawn break', time: 'Yesterday' },
  ]);

  const loopStage = tab === 'flag' ? 0 : tab === 'queue' ? (studentView === 'list' ? 0 : studentView === 'attempt' ? 1 : 2) : 3;

  useEffect(() => {
    function onKey(e) {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if (e.key === '1') setTab('overview');
      if (e.key === '2') setTab('flag');
      if (e.key === '3') setTab('queue');
      if (e.key === '4') setTab('dashboard');
      if (e.key.toLowerCase() === 'p') setPresentMode((p) => !p);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function handleAssign(studentId, templateId, note) {
    const newMistake = makeMistake(templateId, 'Just now');
    setRoster((prev) => prev.map((s) => (s.id === studentId ? { ...s, mistakes: [...s.mistakes, newMistake] } : s)));
    const studentName = roster.find((s) => s.id === studentId).name;
    setActivity((prev) => [{ id: newMistake.id, student: studentName, desc: newMistake.shortLabel, time: 'Just now' }, ...prev]);
    return newMistake.id;
  }

  function handleResolve(studentId, mistakeId, outcome, reasoning) {
    setRoster((prev) => prev.map((s) => {
      if (s.id !== studentId) return s;
      return {
        ...s,
        mistakes: s.mistakes.map((m) => m.id === mistakeId
          ? { ...m, status: statusFromOutcome(outcome), history: [...m.history, { date: 'Today', outcome, reasoning }] }
          : m),
      };
    }));
  }

  return (
    <div style={{ minHeight: '100vh', width: '100%', background: INK, fontFamily: SANS, paddingBottom: presentMode ? 72 : 0 }}>
      <style>{`
        .recall-two-col { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 40px; }
        @media (max-width: 900px) { .recall-two-col { grid-template-columns: 1fr; } }
        .recall-target-btn:hover span { background: rgba(236,230,214,0.28) !important; }
        .recall-hoverable:hover { border-color: rgba(200,163,85,0.4) !important; }
        .recall-hoverable-row:hover { background: #202619 !important; }
        @keyframes recall-fadein { from { opacity: 0; transform: translateY(6px);} to { opacity: 1; transform: translateY(0);} }
        .recall-fadein { animation: recall-fadein .35s ease; }
        textarea::placeholder { color: #6b7263; }
        .recall-dot-tooltip { position: relative; display: inline-flex; }
        .recall-tooltip-bubble { position: absolute; bottom: 130%; left: 50%; transform: translate(-50%,0); opacity: 0; transition: all .15s ease; background: ${PANEL_2}; border: 1px solid ${HAIRLINE}; padding: 4px 8px; border-radius: 3px; font-size: 11px; white-space: nowrap; pointer-events: none; z-index: 10; color: ${CREAM}; }
        .recall-dot-tooltip:hover .recall-tooltip-bubble { opacity: 1; transform: translate(-50%,-4px); }
        .recall-confetti-dot { position: absolute; top: 50%; left: 50%; width: 5px; height: 5px; margin: -2.5px; border-radius: 50%; opacity: 0; animation: recall-burst .7s ease-out forwards; transform: rotate(var(--angle)) translate(0,0); }
        @keyframes recall-burst { 0% { opacity: 1; transform: rotate(var(--angle)) translate(0,0); } 100% { opacity: 0; transform: rotate(var(--angle)) translate(28px,0); } }
        select:focus, textarea:focus, button:focus-visible { outline: 1px solid ${GOLD}; outline-offset: 1px; }
        @keyframes recall-caption-in { from { opacity: 0; transform: translate(-50%, 8px); } to { opacity: 1; transform: translate(-50%, 0); } }
      `}</style>
      <div style={{ maxWidth: 1152, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
          <button onClick={() => setTab('overview')} style={{ display: 'flex', alignItems: 'baseline', gap: 12, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
            <span style={{ fontSize: 24, fontFamily: SERIF, color: CREAM, letterSpacing: '0.01em' }}>Recall</span>
            <span style={{ fontSize: 12, color: MUTED }}>by XLChess</span>
          </button>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <TabButton active={tab === 'overview'} onClick={() => setTab('overview')} eyebrow="Pitch" label="Overview" keyHint="1" />
            <TabButton active={tab === 'flag'} onClick={() => setTab('flag')} eyebrow="Coach" label="Flag a mistake" keyHint="2" />
            <TabButton active={tab === 'queue'} onClick={() => setTab('queue')} eyebrow="Student" label="Recall queue" keyHint="3" />
            <TabButton active={tab === 'dashboard'} onClick={() => setTab('dashboard')} eyebrow="Coach" label="Roster dashboard" keyHint="4" />
            <button onClick={() => setPresentMode((p) => !p)} className="recall-hoverable" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 4, fontSize: 12, padding: '9px 14px', borderRadius: 3,
              background: presentMode ? GOLD : 'transparent', color: presentMode ? INK : MUTED, border: `1px solid ${presentMode ? GOLD : HAIRLINE}`, cursor: 'pointer',
            }} title="Toggle present mode (P)">
              <Icon.mic size={12} /> {presentMode ? 'Presenting' : 'Present mode'}
            </button>
          </div>
        </div>

        {tab !== 'overview' && (
          <div style={{ marginBottom: 40, border: `1px solid ${HAIRLINE}`, borderRadius: 3, padding: '16px 20px', background: PANEL }}>
            <LoopBar current={loopStage} />
          </div>
        )}

        <div key={tab + studentView} className="recall-fadein">
          {tab === 'overview' && <OverviewScreen onJump={setTab} />}
          {tab === 'flag' && <CoachFlagScreen roster={roster} onAssign={handleAssign} activity={activity} />}
          {tab === 'queue' && (
            <StudentQueueScreen
              roster={roster}
              studentId={queueStudentId}
              setStudentId={setQueueStudentId}
              view={studentView}
              setView={setStudentView}
              selectedMistakeId={selectedMistakeId}
              setSelectedMistakeId={setSelectedMistakeId}
              onResolve={handleResolve}
            />
          )}
          {tab === 'dashboard' && <CoachDashboard roster={roster} />}
        </div>

        <div style={{ marginTop: 56, paddingTop: 24, fontSize: 11, borderTop: `1px solid ${HAIRLINE}`, color: MUTED, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span>Recall — the loop no lesson library closes: assign → attempt & explain → confirm → coach sees it hold.</span>
          <span style={{ opacity: 0.6 }}>Keys: 1–4 to jump screens · P to toggle present mode</span>
        </div>
      </div>

      {presentMode && (
        <div style={{
          position: 'fixed', left: '50%', bottom: 20, transform: 'translateX(-50%)', zIndex: 50,
          maxWidth: 640, width: 'calc(100% - 32px)', background: PANEL_2, border: `1px solid ${GOLD}`,
          borderRadius: 6, padding: '14px 18px', boxShadow: '0 20px 50px -10px rgba(0,0,0,0.7)',
          display: 'flex', gap: 12, alignItems: 'flex-start', animation: 'recall-caption-in .3s ease',
        }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(200,163,85,0.15)', border: `1px solid ${GOLD}` }}>
            <Icon.mic size={12} color={GOLD} />
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.55, color: CREAM, margin: 0 }}>{narratorCaption(tab, studentView)}</p>
          <button onClick={() => setPresentMode(false)} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0, padding: 2 }}>
            <Icon.x size={13} color={MUTED} />
          </button>
        </div>
      )}
    </div>
  );
}