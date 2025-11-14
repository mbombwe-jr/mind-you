// src/components/DesignModel.tsx
import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Grid } from "@react-three/drei";
import * as THREE from 'three';

const MODEL_PATH = "/models/design.gltf";

const CenteredModel = () => {
  const { scene } = useGLTF(MODEL_PATH, true);
  // Compute bounding box and center
  const bbox = new THREE.Box3().setFromObject(scene);
  const center = new THREE.Vector3();
  bbox.getCenter(center);
  // Offset model so center is at origin (0,0,0)
  scene.position.x = scene.position.x - center.x;
  scene.position.y = scene.position.y - center.y;
  scene.position.z = scene.position.z - center.z;

  return <primitive object={scene} />;
};

export default function DesignModel() {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 900,
        aspectRatio: '2.4',
        background: "#1a1a1a",
        borderRadius: 24,
        margin: "2rem auto",
        overflow: "hidden",
        boxShadow: "0 2px 16px #0008"
      }}
    >
      <Canvas shadows camera={{ position: [4, 3, 7], fov: 40 }}
        style={{ background: '#1a1a1a', borderRadius: 24 }}
      >
        <ambientLight intensity={0.65} />
        <directionalLight position={[6, 10, 6]} intensity={0.7} castShadow />
        <Grid
          position={[0, 0, 0]}
          args={[20, 20]}
          cellColor="#444"
          sectionColor="#777"
          sectionThickness={2}
          cellThickness={1.5}
          fadeDistance={30}
          fadeStrength={1}
          infiniteGrid
        />
        <Suspense fallback={null}>
          {/* Model's center will be at (0,0,0) */}
          <CenteredModel />
        </Suspense>
        <OrbitControls target={[0, 0, 0]} enableDamping makeDefault />
      </Canvas>
    </div>
  );
}