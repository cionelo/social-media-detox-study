export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-cream rounded-2xl shadow-card p-6 ${className}`}>
      {children}
    </div>
  )
}
