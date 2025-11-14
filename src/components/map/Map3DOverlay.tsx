import React, { useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box, Text, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

export interface Map3DBlock {
  id: string;
  lat: number;
  lng: number;
  height: number;
  color: string;
  label?: string;
  buildingType?: string;
}

interface Map3DOverlayProps {
  blocks: Map3DBlock[];
  mapCenter: [number, number];
  mapZoom: number;
  onBlockClick?: (block: Map3DBlock) => void;
  className?: string;
}

// Convert lat/lng to 3D coordinates relative to map center
function latLngTo3D(lat: number, lng: number, mapCenter: [number, number], zoom: number): [number, number, number] {
  // Scale factor based on zoom level
  const scale = Math.pow(2, zoom - 16) * 0.001;
  
  // Convert to relative coordinates
  const x = (lng - mapCenter[1]) * scale * 1000; // longitude to x
  const z = (lat - mapCenter[0]) * scale * 1000; // latitude to z (inverted for proper orientation)
  
  return [x, 0, z];
}

function BuildingBlock({ 
  block, 
  mapCenter, 
  mapZoom, 
  onClick 
}: { 
  block: Map3DBlock; 
  mapCenter: [number, number]; 
  mapZoom: number; 
  onClick?: (block: Map3DBlock) => void;
}) {
  const meshRef = React.useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  const position = latLngTo3D(block.lat, block.lng, mapCenter, mapZoom);
  const height = block.height * 0.1; // Scale height
  
  useFrame((state, delta) => {
    if (meshRef.current && hovered) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group position={[position[0], height / 2, position[2]]}>
      <Box
        ref={meshRef}
        args={[1, height, 1]}
        onClick={() => onClick?.(block)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial 
          color={hovered ? '#60a5fa' : block.color} 
          metalness={0.2}
          roughness={0.6}
          transparent
          opacity={0.9}
        />
      </Box>
      
      {block.label && (
        <Text
          position={[0, height / 2 + 0.5, 0]}
          fontSize={0.2}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {block.label}
        </Text>
      )}
    </group>
  );
}

export default function Map3DOverlay({ 
  blocks, 
  mapCenter, 
  mapZoom, 
  onBlockClick, 
  className = "" 
}: Map3DOverlayProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Show 3D blocks only at certain zoom levels
  useEffect(() => {
    setIsVisible(mapZoom >= 16);
  }, [mapZoom]);

  if (!isVisible || blocks.length === 0) {
    return null;
  }

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      <Canvas
        camera={{ position: [0, 10, 0], fov: 60 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} />
        <pointLight position={[-5, 5, -5]} intensity={0.3} />
        
        {blocks.map((block) => (
          <BuildingBlock
            key={block.id}
            block={block}
            mapCenter={mapCenter}
            mapZoom={mapZoom}
            onClick={onBlockClick}
          />
        ))}
        
        <OrbitControls 
          enablePan={false}
          enableZoom={false}
          enableRotate={false}
        />
      </Canvas>
    </div>
  );
}

// Sample data for testing
export const sampleBlocks: Map3DBlock[] = [
  {
    id: 'block1',
    lat: -6.771,
    lng: 39.240,
    height: 3,
    color: '#3b82f6',
    label: 'Block A',
    buildingType: 'office'
  },
  {
    id: 'block2',
    lat: -6.772,
    lng: 39.241,
    height: 2,
    color: '#10b981',
    label: 'Block B',
    buildingType: 'residential'
  },
  {
    id: 'block3',
    lat: -6.770,
    lng: 39.239,
    height: 4,
    color: '#f59e0b',
    label: 'Block C',
    buildingType: 'commercial'
  }
];
