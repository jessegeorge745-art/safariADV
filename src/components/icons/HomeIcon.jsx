/**
 * HomeIcon
 *
 * Shared by every navbar's link row (sits alongside Trips/Dashboard/etc,
 * not next to the SafariADV brand text — see Brand.jsx).
 */

export default function HomeIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  )
}