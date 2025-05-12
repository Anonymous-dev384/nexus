"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls, PerspectiveCamera, Html } from "@react-three/drei"
import { Check, DollarSign } from "lucide-react"
import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import type { Mesh, MeshStandardMaterial } from "three"
import { Badge } from "@/components/ui/badge"

interface VerificationBadgesProps {
  verified: boolean
  earningVerified: boolean
  size?: "sm" | "md" | "lg"
  showLabels?: boolean
  type?: string
  className?: string
}

// 3D Verification Badge component
function VerificationBadge({ position = [0, 0, 0], color = "#3b82f6", icon = "check", rotate = true }) {
  const meshRef = useRef<Mesh>(null)
  const materialRef = useRef<MeshStandardMaterial>(null)

  // Rotation animation
  useFrame(({ clock }) => {
    if (meshRef.current && rotate) {
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.5
    }
  })

  return (
    <group position={position}>
      <mesh ref={meshRef} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 0.1, 32]} />
        <meshStandardMaterial ref={materialRef} color={color} metalness={0.8} roughness={0.2} />
      </mesh>
      <Html position={[0, 0, 0.06]} transform>
        <div className="flex items-center justify-center w-8 h-8">
          {icon === "check" ? <Check className="text-white h-5 w-5" /> : <DollarSign className="text-white h-5 w-5" />}
        </div>
      </Html>
    </group>
  )
}

// Export both as default and named export for compatibility
export default function VerificationBadges({
  verified,
  earningVerified,
  size = "md",
  showLabels = false,
  type,
  className,
}: VerificationBadgesProps) {
  // Determine height based on size
  const height = size === "sm" ? 60 : size === "md" ? 100 : 150

  return (
    <div className={`flex flex-col items-center ${className || ""}`}>
      <div style={{ height: `${height}px`, width: "100%" }} className="rounded-lg overflow-hidden">
        <Canvas shadows>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} castShadow />
          <PerspectiveCamera makeDefault position={[0, 0, 5]} />

          {/* Verification badges */}
          {verified && <VerificationBadge position={[-1, 0, 0]} color="#3b82f6" icon="check" />}
          {earningVerified && <VerificationBadge position={[1, 0, 0]} color="#10b981" icon="dollar" />}

          <OrbitControls enableZoom={false} enablePan={false} />
        </Canvas>
      </div>

      {showLabels && (
        <div className="flex gap-2 mt-2">
          {verified && (
            <Badge variant="outline" className="bg-blue-500/10 text-blue-500">
              <Check className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
          {earningVerified && (
            <Badge variant="outline" className="bg-green-500/10 text-green-500">
              <DollarSign className="h-3 w-3 mr-1" />
              Earning
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}

// Named export for compatibility
export { VerificationBadges }
