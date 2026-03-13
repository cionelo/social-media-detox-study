type Variant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: React.ReactNode
}

const styles: Record<Variant, string> = {
  primary: 'bg-sage text-white hover:bg-sage/90 shadow-soft',
  secondary: 'bg-cream text-ink border border-ink/20 hover:bg-parchment',
  ghost: 'text-ink/70 hover:text-ink hover:bg-cream/60',
}

export function Button({ variant = 'primary', children, className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`px-5 py-2.5 rounded-xl font-mono text-sm font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
