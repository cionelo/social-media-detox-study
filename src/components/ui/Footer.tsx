import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="fixed bottom-0 right-0 p-4 z-50">
      <a
        href="https://itsnemo.dev/work"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/80 backdrop-blur-sm border border-black/10 hover:bg-white/95 transition-all hover:scale-105 shadow-sm"
      >
        <Image
          src="/nemo-logo.png"
          alt="Nemo logo"
          width={24}
          height={24}
          className="rounded-full"
        />
        <span className="text-xs font-mono text-black/70">built by itsnemo.dev</span>
      </a>
    </footer>
  )
}
