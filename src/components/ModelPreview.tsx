import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface ModelPreviewProps {
  src: string;
  className?: string;
  interactive?: boolean;
}

const encodeAssetUrl = (url: string) => {
  try {
    return new URL(url).toString();
  } catch {
    return encodeURI(url);
  }
};

const getVisibleMeshBounds = (object: THREE.Object3D) => {
  object.updateWorldMatrix(true, true);

  const bounds = new THREE.Box3();
  let hasMesh = false;

  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh || !mesh.visible || !mesh.geometry) return;

    const geometry = mesh.geometry;
    if (!geometry.boundingBox) {
      geometry.computeBoundingBox();
    }
    if (!geometry.boundingBox) return;

    const meshBounds = geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld);
    if (!hasMesh) {
      bounds.copy(meshBounds);
      hasMesh = true;
    } else {
      bounds.union(meshBounds);
    }
  });

  return hasMesh ? bounds : new THREE.Box3().setFromObject(object);
};

export default function ModelPreview({
  src,
  className,
  interactive = false,
}: ModelPreviewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let frameId = 0;
    let disposed = false;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#f8fafc');

    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 1000);
    camera.position.set(0, 1.2, 4.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = interactive;
    controls.screenSpacePanning = true;
    controls.enableZoom = interactive;
    controls.enableRotate = interactive;
    controls.autoRotate = !interactive;
    controls.autoRotateSpeed = 2.2;
    controls.minDistance = 1.5;
    controls.maxDistance = 10;

    const ambientLight = new THREE.AmbientLight('#ffffff', 1.8);
    scene.add(ambientLight);

    const hemisphereLight = new THREE.HemisphereLight('#ffffff', '#cbd5e1', 1.4);
    hemisphereLight.position.set(0, 2, 0);
    scene.add(hemisphereLight);

    const keyLight = new THREE.DirectionalLight('#ffffff', 2.2);
    keyLight.position.set(4, 8, 6);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight('#dbeafe', 1.2);
    fillLight.position.set(-5, 3, -3);
    scene.add(fillLight);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(3.2, 64),
      new THREE.ShadowMaterial({ color: '#94a3b8', opacity: 0.15 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.15;
    floor.receiveShadow = true;
    scene.add(floor);

    const modelRoot = new THREE.Group();
    const centeredRoot = new THREE.Group();
    centeredRoot.add(modelRoot);
    scene.add(centeredRoot);

    const setSize = () => {
      const width = container.clientWidth || 1;
      const height = container.clientHeight || 1;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    setSize();

    const resizeObserver = new ResizeObserver(() => {
      setSize();
    });
    resizeObserver.observe(container);

    const loader = new GLTFLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(
      encodeAssetUrl(src),
      (gltf) => {
        if (disposed) return;

        modelRoot.clear();
        centeredRoot.position.set(0, 0, 0);

        const model = gltf.scene;
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        modelRoot.add(model);
        centeredRoot.updateWorldMatrix(true, true);

        const box = getVisibleMeshBounds(centeredRoot);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const sphere = box.getBoundingSphere(new THREE.Sphere());
        const halfFovY = THREE.MathUtils.degToRad(camera.fov * 0.5);
        const halfFovX = Math.atan(Math.tan(halfFovY) * camera.aspect);
        const distanceForHeight = sphere.radius / Math.tan(halfFovY);
        const distanceForWidth = sphere.radius / Math.tan(halfFovX);
        const distance = Math.max(distanceForHeight, distanceForWidth) * 1.35;

        centeredRoot.position.copy(center.clone().multiplyScalar(-1));
        centeredRoot.updateWorldMatrix(true, true);

        const centeredBox = getVisibleMeshBounds(centeredRoot);
        const centeredSize = centeredBox.getSize(new THREE.Vector3());

        floor.position.y = -centeredSize.y * 0.5 - 0.02;

        camera.position.set(0, 0, distance);
        controls.target.set(0, 0, 0);
        controls.minDistance = Math.max(sphere.radius * 0.6, 0.8);
        controls.maxDistance = Math.max(distance * 2.5, 6);
        camera.lookAt(0, 0, 0);
        controls.update();
      },
      undefined,
      () => {
        if (disposed) return;
        const fallbackGeometry = new THREE.BoxGeometry(1.2, 1.8, 0.8);
        const fallbackMaterial = new THREE.MeshStandardMaterial({
          color: '#818cf8',
          metalness: 0.2,
          roughness: 0.45,
        });
        const fallbackMesh = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
        fallbackMesh.castShadow = true;
        fallbackMesh.receiveShadow = true;
        modelRoot.clear();
        centeredRoot.position.set(0, 0, 0);
        modelRoot.add(fallbackMesh);
        controls.target.set(0, 0.3, 0);
        controls.update();
      },
    );

    const animate = () => {
      frameId = window.requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
        const material = mesh.material;
        if (Array.isArray(material)) {
          material.forEach((item) => item.dispose());
        } else if (material) {
          material.dispose();
        }
      });
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [interactive, src]);

  return <div ref={containerRef} className={className} />;
}
