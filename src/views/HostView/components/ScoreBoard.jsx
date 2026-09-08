export function ScoreBoard({ players }) {
  const ranked = [...players].sort((a, b) => b.score - a.score)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 'min(90vw, 480px)' }}>
      {ranked.map((player, i) => (
        <div
          key={player.id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 20px',
            borderRadius: 14,
            background: i === 0 ? 'rgba(250, 204, 21, 0.2)' : 'rgba(255,255,255,0.06)',
            border: i === 0 ? '2px solid #facc15' : '2px solid rgba(255,255,255,0.15)',
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 20 }}>
            {i + 1}. {player.name}
          </span>
          <span style={{ fontWeight: 900, fontSize: 22, color: '#facc15' }}>{player.score}</span>
        </div>
      ))}
    </div>
  )
}
