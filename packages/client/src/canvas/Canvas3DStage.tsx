import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CanvasObject } from "../state/opQueue";
import { PeerPresence } from "@cad-collab/shared";

interface Props {
  objects: CanvasObject[];
  peers?: PeerPresence[];
  extrudeDepth?: number;
}

export function Canvas3DStage({ objects, peers = [], extrudeDepth = 40 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Initialize Scene, Camera, and Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0f172a");

    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 5000);
    camera.position.set(400, 500, 600);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 2. Add OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;

    // 3. Add Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(300, 500, 300);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.4);
    scene.add(hemiLight);

    // 4. Add 3D Grid Ground Plane
    const gridHelper = new THREE.GridHelper(2000, 50, 0x3b82f6, 0x334155);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // 5. Helper to create material matching 2D sketch color
    const getMaterialForObject = (obj: CanvasObject, defaultHex: string) => {
      const hexColor = (obj.props as any).color || defaultHex;
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(hexColor),
        metalness: 0.3,
        roughness: 0.25
      });
    };

    // Center offset to align 2D canvas origin (0,0) with 3D space
    const centerOffsetX = -400;
    const centerOffsetZ = -300;

    // 6. Generate 3D Extruded Meshes from 2D Objects
    objects.forEach((obj) => {
      if (obj.type === "rectangle") {
        const x = (obj.props.x as number) + centerOffsetX;
        const z = (obj.props.y as number) + centerOffsetZ;
        const w = Math.max(1, obj.props.width as number);
        const h = Math.max(1, obj.props.height as number);
        const d = Math.max(5, extrudeDepth);

        const geo = new THREE.BoxGeometry(w, d, h);
        const mat = getMaterialForObject(obj, "#ef4444");
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x + w / 2, d / 2, z + h / 2);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
      } else if (obj.type === "circle") {
        const x = (obj.props.x as number) + centerOffsetX;
        const z = (obj.props.y as number) + centerOffsetZ;
        const r = Math.max(1, obj.props.radius as number);
        const d = Math.max(5, extrudeDepth);

        const geo = new THREE.CylinderGeometry(r, r, d, 32);
        const mat = getMaterialForObject(obj, "#10b981");
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, d / 2, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
      } else if (obj.type === "line") {
        const pts = obj.props.points as number[];
        if (pts && pts.length >= 4) {
          const x1 = pts[0] + centerOffsetX;
          const z1 = pts[1] + centerOffsetZ;
          const x2 = pts[2] + centerOffsetX;
          const z2 = pts[3] + centerOffsetZ;
          const d = Math.max(5, extrudeDepth);

          const dx = x2 - x1;
          const dz = z2 - z1;
          const length = Math.sqrt(dx * dx + dz * dz);
          const angle = Math.atan2(dz, dx);

          const geo = new THREE.BoxGeometry(length, d, 6);
          const mat = getMaterialForObject(obj, "#2563eb");
          const mesh = new THREE.Mesh(geo, mat);
          mesh.position.set((x1 + x2) / 2, d / 2, (z1 + z2) / 2);
          mesh.rotation.y = -angle;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          scene.add(mesh);
        }
      }
    });

    // 7. Render 3D Peer Collaborator Markers
    peers.forEach((peer) => {
      if (peer.cursor) {
        const px = peer.cursor.x + centerOffsetX;
        const pz = peer.cursor.y + centerOffsetZ;

        const pGeo = new THREE.ConeGeometry(8, 20, 16);
        const pMat = new THREE.MeshBasicMaterial({ color: peer.color || 0x2563eb });
        const pMesh = new THREE.Mesh(pGeo, pMat);
        pMesh.position.set(px, extrudeDepth + 15, pz);
        pMesh.rotation.x = Math.PI;
        scene.add(pMesh);
      }
    });

    // 8. Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 9. Resize Listener
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [objects, peers, extrudeDepth]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#0f172a"
      }}
    >
      <div style={{
        position: "absolute",
        bottom: 16,
        left: 16,
        padding: "8px 14px",
        borderRadius: 8,
        backgroundColor: "rgba(15, 23, 42, 0.8)",
        backdropFilter: "blur(4px)",
        border: "1px solid #334155",
        color: "#94a3b8",
        fontSize: "0.75rem",
        pointerEvents: "none"
      }}>
        💡 <b>3D Orbit Controls</b>: Left Click Drag to Rotate | Right Click Drag to Pan | Scroll to Zoom
      </div>
    </div>
  );
}
