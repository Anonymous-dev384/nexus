import { Atom } from "lucide-react"

interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={`relative ${className}`}>
      <Atom className="text-primary w-full h-full" />
      <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl -z-10"></div>
    </div>
  )
}

export default Logo
