import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Line, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'

type ProgressRef = { current: number }

function smoothstep(edge0: number, edge1: number, value: number) {
  const x = THREE.MathUtils.clamp((value - edge0) / (edge1 - edge0), 0, 1)
  return x * x * (3 - 2 * x)
}

function DataField({ progress }: { progress: ProgressRef }) {
  const pointsRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.PointsMaterial>(null)
  const count = 720
  const { chaos, organized, seeds } = useMemo(() => {
    const chaosPositions = new Float32Array(count * 3)
    const organizedPositions = new Float32Array(count * 3)
    const randomSeeds = new Float32Array(count)
    let seed = 71821
    const random = () => {
      seed = (seed * 16807) % 2147483647
      return (seed - 1) / 2147483646
    }

    for (let index = 0; index < count; index += 1) {
      const offset = index * 3
      chaosPositions[offset] = (random() - 0.5) * 14
      chaosPositions[offset + 1] = (random() - 0.5) * 8
      chaosPositions[offset + 2] = (random() - 0.5) * 10 - 2

      const stream = index % 5
      const row = Math.floor(index / 5)
      organizedPositions[offset] = (stream - 2) * 1.18 + Math.sin(row * 0.2) * 0.16
      organizedPositions[offset + 1] = (row / (count / 5) - 0.5) * 8
      organizedPositions[offset + 2] = -2.6 + Math.cos(row * 0.13 + stream) * 0.25
      randomSeeds[index] = random() * Math.PI * 2
    }
    return { chaos: chaosPositions, organized: organizedPositions, seeds: randomSeeds }
  }, [])

  const positions = useMemo(() => chaos.slice(), [chaos])

  useFrame(({ clock }) => {
    if (!pointsRef.current) return
    const positionAttribute = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute
    const values = positionAttribute.array as Float32Array
    const p = progress.current
    const alignment = smoothstep(0.3, 0.65, p)
    const ascent = smoothstep(0.55, 0.86, p)
    const surfaceFade = smoothstep(0.82, 0.96, p)
    const time = clock.elapsedTime

    for (let index = 0; index < count; index += 1) {
      const offset = index * 3
      const driftX = Math.sin(time * 0.22 + seeds[index]) * 0.14 * (1 - alignment)
      const driftY = Math.cos(time * 0.17 + seeds[index] * 1.7) * 0.11 * (1 - alignment)
      values[offset] = THREE.MathUtils.lerp(chaos[offset] + driftX, organized[offset], alignment)
      values[offset + 1] = THREE.MathUtils.lerp(chaos[offset + 1] + driftY, organized[offset + 1] + ascent * 2.8, alignment)
      values[offset + 2] = THREE.MathUtils.lerp(chaos[offset + 2], organized[offset + 2], alignment)
    }
    positionAttribute.needsUpdate = true
    pointsRef.current.rotation.y = Math.sin(time * 0.08) * 0.05 * (1 - alignment)
    if (materialRef.current) materialRef.current.opacity = 0.76 * (1 - surfaceFade)
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        color="#90d7df"
        size={0.045}
        sizeAttenuation
        transparent
        opacity={0.76}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function GoldenNetwork({ progress }: { progress: ProgressRef }) {
  const groupRef = useRef<THREE.Group>(null)
  const rayRef = useRef<THREE.MeshBasicMaterial>(null)
  const curves = useMemo(() => Array.from({ length: 5 }, (_, stream) => {
    const x = (stream - 2) * 1.18
    return Array.from({ length: 34 }, (_, point) => {
      const y = (point / 33 - 0.5) * 8 + 1.4
      return [x + Math.sin(point * 0.28 + stream) * 0.12, y, -2.55] as [number, number, number]
    })
  }), [])

  useFrame(({ clock }) => {
    const reveal = smoothstep(0.33, 0.61, progress.current) * (1 - smoothstep(0.86, 0.98, progress.current))
    if (groupRef.current) {
      groupRef.current.visible = reveal > 0.01
      groupRef.current.scale.setScalar(0.96 + reveal * 0.04)
      groupRef.current.position.y = smoothstep(0.55, 0.86, progress.current) * 2.8
    }
    if (rayRef.current) rayRef.current.opacity = reveal * (0.1 + Math.sin(clock.elapsedTime * 0.8) * 0.015)
  })

  return (
    <group ref={groupRef} visible={false}>
      <mesh position={[0, 2.5, -3.3]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[2.8, 9, 32, 1, true]} />
        <meshBasicMaterial ref={rayRef} color="#fbbb1e" transparent opacity={0.1} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {curves.map((points, index) => (
        <Line key={index} points={points} color="#fbbb1e" transparent opacity={0.42} lineWidth={0.7} />
      ))}
    </group>
  )
}

function SurfaceAndSun({ progress }: { progress: ProgressRef }) {
  const surfaceRef = useRef<THREE.Mesh>(null)
  const sunGroupRef = useRef<THREE.Group>(null)
  const haloRef = useRef<THREE.MeshBasicMaterial>(null)

  useFrame(({ clock }) => {
    const surface = smoothstep(0.68, 0.86, progress.current)
    const sun = smoothstep(0.82, 1, progress.current)
    if (surfaceRef.current) {
      surfaceRef.current.position.y = THREE.MathUtils.lerp(-7, -1.15, surface)
      surfaceRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.25) * 0.015
    }
    if (sunGroupRef.current) {
      sunGroupRef.current.visible = sun > 0.01
      sunGroupRef.current.scale.setScalar(0.25 + sun * 0.75)
      sunGroupRef.current.position.y = THREE.MathUtils.lerp(-1.8, 0.55, sun)
    }
    if (haloRef.current) haloRef.current.opacity = 0.08 + sun * 0.16 + Math.sin(clock.elapsedTime * 0.65) * 0.015
  })

  return (
    <>
      <mesh ref={surfaceRef} position={[0, -7, -3]} rotation={[-Math.PI / 2.35, 0, 0]}>
        <planeGeometry args={[24, 15, 24, 12]} />
        <meshBasicMaterial color="#0a6171" transparent opacity={0.26} wireframe />
      </mesh>
      <group ref={sunGroupRef} position={[0, -1.8, -4]} visible={false}>
        <mesh>
          <sphereGeometry args={[0.78, 48, 48]} />
          <meshBasicMaterial color="#ffd663" />
        </mesh>
        <mesh scale={2.2}>
          <sphereGeometry args={[0.78, 32, 32]} />
          <meshBasicMaterial ref={haloRef} color="#fbbb1e" transparent opacity={0.12} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>
    </>
  )
}

function Scene({ progress }: { progress: ProgressRef }) {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null)
  const backgroundRef = useRef<THREE.Color>(null)

  useFrame(() => {
    if (!cameraRef.current || !backgroundRef.current) return
    const p = progress.current
    const surface = smoothstep(0.62, 0.9, p)
    backgroundRef.current.setRGB(
      THREE.MathUtils.lerp(0, 0.015, surface),
      THREE.MathUtils.lerp(0.027, 0.11, surface),
      THREE.MathUtils.lerp(0.047, 0.15, surface),
    )
    cameraRef.current.position.x = Math.sin(p * Math.PI) * 0.25
    cameraRef.current.position.y = THREE.MathUtils.lerp(-0.65, 1.15, surface)
    cameraRef.current.position.z = THREE.MathUtils.lerp(7.8, 6.2, p)
    cameraRef.current.lookAt(0, THREE.MathUtils.lerp(0, 0.65, surface), -2.4)
  })

  return (
    <>
      <color ref={backgroundRef} attach="background" args={['#00070c']} />
      <PerspectiveCamera ref={cameraRef} makeDefault position={[0, -0.65, 7.8]} fov={54} near={0.1} far={40} />
      <fog attach="fog" args={['#001018', 5, 17]} />
      <DataField progress={progress} />
      <GoldenNetwork progress={progress} />
      <SurfaceAndSun progress={progress} />
    </>
  )
}

export default function SunbeatCanvas({ progress }: { progress: ProgressRef }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
    >
      <Scene progress={progress} />
    </Canvas>
  )
}
