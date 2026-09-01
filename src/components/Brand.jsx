/**
 * Brand
 *
 * Purely a static label — no icon, no link. "Home" now lives as a
 * regular text link in each navbar's own link row instead of being a
 * clickable icon here (see PublicNavbar/TravelerNavbar/AgentNavbar/
 * AdminNavbar — each adds its own "Home" NavLink pointing wherever
 * that role's landing page is).
 */

export default function Brand({ badge }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span
        style={{
          fontSize: '1.05rem',
          fontWeight: 700,
          color: 'var(--color-text)',
          letterSpacing: '-0.01em',
        }}
      >
        SafariADV
      </span>
      {badge && (
        <span style={{ marginLeft: 2, fontSize: '0.7rem', background: 'rgba(232,160,32,0.15)', color: 'var(--color-primary)', padding: '2px 7px', borderRadius: 4, fontWeight: 600 }}>
          {badge}
        </span>
      )}
    </div>
  )
}