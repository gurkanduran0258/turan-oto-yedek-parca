"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  findCatalogPart,
  GROUPS,
  VEHICLE_PARTS,
  type CatalogGroupId,
  type CatalogPart,
} from "@/lib/vehicle-catalog";

type Props = {
  modelUrl?: string;
};

type StoredMaterial = {
  object: THREE.Mesh;
  material: THREE.Material | THREE.Material[];
};

export default function VehicleCatalog3D({
  modelUrl = "/models/fiat-egea-demo.glb",
}: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const selectedMeshesRef = useRef<StoredMaterial[]>([]);
  const [selectedPart, setSelectedPart] = useState<CatalogPart | null>(null);
  const [activeGroup, setActiveGroup] = useState<CatalogGroupId>("on-grup");
  const [loading, setLoading] = useState(true);
  const [modelError, setModelError] = useState<string | null>(null);

  const groupParts = useMemo(
    () => VEHICLE_PARTS.filter((part) => part.group === activeGroup),
    [activeGroup]
  );

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let disposed = false;
    let animationId = 0;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);

    const camera = new THREE.PerspectiveCamera(
      38,
      Math.max(mount.clientWidth, 1) / Math.max(mount.clientHeight, 1),
      0.1,
      100
    );
    camera.position.set(6.2, 3.4, 7.8);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.minDistance = 4;
    controls.maxDistance = 13;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.target.set(0, 0.7, 0);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x666666, 2.2);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xffffff, 4.3);
    key.position.set(5, 8, 6);
    key.castShadow = true;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xffffff, 2.4);
    fill.position.set(-5, 4, -5);
    scene.add(fill);

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(5.5, 96),
      new THREE.MeshStandardMaterial({
        color: 0xe9e9e9,
        roughness: 0.9,
        metalness: 0,
      })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(11, 22, 0xd0d0d0, 0xe2e2e2);
    grid.position.y = 0.001;
    scene.add(grid);

    const selectableMeshes: THREE.Mesh[] = [];
    let carRoot: THREE.Object3D | null = null;

    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        if (disposed) return;

        carRoot = gltf.scene;
        scene.add(carRoot);

        carRoot.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return;

          child.castShadow = true;
          child.receiveShadow = true;

          const catalogPart = findCatalogPart(child.name);
          if (catalogPart) {
            child.userData.catalogPart = catalogPart;
            selectableMeshes.push(child);
          }
        });

        const box = new THREE.Box3().setFromObject(carRoot);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        const maxDimension = Math.max(size.x, size.y, size.z);
        const targetSize = 5.8;
        const scale = maxDimension > 0 ? targetSize / maxDimension : 1;

        carRoot.scale.setScalar(scale);

        const scaledBox = new THREE.Box3().setFromObject(carRoot);
        const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
        const scaledMin = scaledBox.min.clone();

        carRoot.position.x -= scaledCenter.x;
        carRoot.position.z -= scaledCenter.z;
        carRoot.position.y -= scaledMin.y;

        controls.target.set(0, 0.8, 0);
        controls.update();

        setLoading(false);
      },
      undefined,
      (error) => {
        console.error(error);
        setLoading(false);
        setModelError(
          "3D model yüklenemedi. public/models klasöründeki GLB dosyasını kontrol et."
        );
      }
    );

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    function restoreSelection() {
      for (const item of selectedMeshesRef.current) {
        item.object.material = item.material;
      }
      selectedMeshesRef.current = [];
    }

    function makeHighlighted(mesh: THREE.Mesh) {
      const original = mesh.material;
      selectedMeshesRef.current.push({ object: mesh, material: original });

      const cloneOne = (material: THREE.Material) => {
        const cloned = material.clone();

        if ("emissive" in cloned) {
          const standard = cloned as THREE.MeshStandardMaterial;
          standard.emissive = new THREE.Color(0xb5121b);
          standard.emissiveIntensity = 0.9;
        }

        if ("color" in cloned) {
          const colored = cloned as THREE.MeshStandardMaterial;
          colored.color = colored.color.clone().lerp(new THREE.Color(0xff3344), 0.25);
        }

        return cloned;
      };

      mesh.material = Array.isArray(original)
        ? original.map(cloneOne)
        : cloneOne(original);
    }

    function selectPart(part: CatalogPart) {
      restoreSelection();
      setSelectedPart(part);
      setActiveGroup(part.group);

      for (const mesh of selectableMeshes) {
        const meshPart = mesh.userData.catalogPart as CatalogPart | undefined;
        if (meshPart?.title === part.title) {
          makeHighlighted(mesh);
        }
      }
    }

    function onPointerDown(event: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();

      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(selectableMeshes, false);

      if (!hits.length) return;

      const mesh = hits[0].object as THREE.Mesh;
      const part = mesh.userData.catalogPart as CatalogPart | undefined;
      if (part) selectPart(part);
    }

    renderer.domElement.addEventListener("pointerdown", onPointerDown);

    function onResize() {
      if (!mount) return;
      const width = Math.max(mount.clientWidth, 1);
      const height = Math.max(mount.clientHeight, 1);

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }

    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(mount);

    function animate() {
      controls.update();
      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    }

    animate();

    const api = {
      selectPart,
    };
    (mount as HTMLDivElement & { __vehicleApi?: typeof api }).__vehicleApi = api;

    return () => {
      disposed = true;
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      restoreSelection();
      controls.dispose();
      renderer.dispose();

      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry?.dispose();

        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];

        for (const material of materials) {
          material.dispose();
        }
      });

      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [modelUrl]);

  function selectFromList(part: CatalogPart) {
    const mount = mountRef.current as
      | (HTMLDivElement & {
          __vehicleApi?: { selectPart: (part: CatalogPart) => void };
        })
      | null;

    mount?.__vehicleApi?.selectPart(part);
  }

  return (
    <div className="vehicleCatalog">
      <section className="viewerColumn">
        <div className="viewerToolbar">
          <div>
            <span className="eyebrow">3D PARÇA KATALOĞU</span>
            <h1>Fiat Egea</h1>
            <p>Aracı çevir, yakınlaştır ve parçanın üzerine tıkla.</p>
          </div>

          <div className="vehicleBadge">
            <span>MODEL</span>
            <strong>Egea Sedan</strong>
          </div>
        </div>

        <div className="viewerFrame">
          <div ref={mountRef} className="threeMount" />

          {loading && (
            <div className="viewerMessage">
              <div className="spinner" />
              <strong>3D araç hazırlanıyor…</strong>
            </div>
          )}

          {modelError && (
            <div className="viewerMessage error">
              <strong>Model açılamadı</strong>
              <span>{modelError}</span>
            </div>
          )}

          <div className="viewerHint">
            Sol tuş: döndür · Tekerlek: yakınlaştır · Parçaya tıkla
          </div>
        </div>
      </section>

      <aside className="catalogPanel">
        <div className="groupTabs" role="tablist" aria-label="Parça grupları">
          {(Object.keys(GROUPS) as CatalogGroupId[]).map((groupId) => (
            <button
              type="button"
              key={groupId}
              className={activeGroup === groupId ? "active" : ""}
              onClick={() => {
                setActiveGroup(groupId);
                setSelectedPart(null);
              }}
            >
              {GROUPS[groupId].title}
            </button>
          ))}
        </div>

        <div className="panelHeading">
          <span>{GROUPS[activeGroup].title}</span>
          <p>{GROUPS[activeGroup].description}</p>
        </div>

        <div className="partList">
          {groupParts.map((part) => (
            <button
              type="button"
              className={
                selectedPart?.title === part.title
                  ? "partButton selected"
                  : "partButton"
              }
              key={part.title}
              onClick={() => selectFromList(part)}
            >
              <span className="partDot" />
              <span>
                <strong>{part.title}</strong>
                <small>{part.searchTerms.slice(0, 3).join(" · ")}</small>
              </span>
              <b>›</b>
            </button>
          ))}
        </div>

        <div className="selectedBox">
          {selectedPart ? (
            <>
              <span className="selectedLabel">SEÇİLEN BÖLÜM</span>
              <h2>{selectedPart.title}</h2>
              <p>
                Bu bölüm ürün veritabanına bağlandığında, yalnızca bu parçaya
                ait ürünler burada listelenecek.
              </p>

              <div className="keywordList">
                {selectedPart.searchTerms.map((term) => (
                  <span key={term}>{term}</span>
                ))}
              </div>

              <a
                className="productsButton"
                href={`/urunler?ara=${encodeURIComponent(
                  selectedPart.searchTerms[0]
                )}`}
              >
                UYGUN PARÇALARI GÖSTER
              </a>
            </>
          ) : (
            <>
              <span className="selectedLabel">NASIL KULLANILIR?</span>
              <h2>Bir parçaya dokun</h2>
              <p>
                3D araç üzerindeki kaporta parçasını veya yukarıdaki listeden
                bir bölümü seç.
              </p>
            </>
          )}
        </div>
      </aside>

      <style jsx>{`
        .vehicleCatalog {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 380px;
          gap: 22px;
          max-width: 1500px;
          margin: 0 auto;
          padding: 24px;
          color: #171717;
        }

        .viewerColumn {
          min-width: 0;
        }

        .viewerToolbar {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 15px;
        }

        .eyebrow,
        .selectedLabel {
          display: block;
          color: #c31621;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 1.2px;
        }

        .viewerToolbar h1 {
          margin: 4px 0 2px;
          font-size: clamp(28px, 3vw, 42px);
          line-height: 1;
        }

        .viewerToolbar p,
        .panelHeading p,
        .selectedBox p {
          margin: 6px 0 0;
          color: #686868;
          line-height: 1.55;
        }

        .vehicleBadge {
          border: 1px solid #dedede;
          border-radius: 12px;
          background: white;
          padding: 10px 14px;
          min-width: 140px;
        }

        .vehicleBadge span {
          display: block;
          color: #8a8a8a;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .vehicleBadge strong {
          display: block;
          margin-top: 3px;
          font-size: 14px;
        }

        .viewerFrame {
          position: relative;
          height: min(68vh, 710px);
          min-height: 500px;
          overflow: hidden;
          border: 1px solid #dedede;
          border-radius: 18px;
          background: #f5f5f5;
        }

        .threeMount {
          width: 100%;
          height: 100%;
          touch-action: none;
        }

        .viewerMessage {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: rgba(245, 245, 245, 0.86);
          z-index: 5;
        }

        .viewerMessage span {
          max-width: 420px;
          padding: 0 25px;
          color: #666;
          text-align: center;
        }

        .viewerMessage.error strong {
          color: #b5121b;
        }

        .spinner {
          width: 34px;
          height: 34px;
          border: 4px solid #ddd;
          border-top-color: #c31621;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .viewerHint {
          position: absolute;
          left: 50%;
          bottom: 15px;
          transform: translateX(-50%);
          padding: 9px 13px;
          border: 1px solid #ddd;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.92);
          color: #555;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
          pointer-events: none;
        }

        .catalogPanel {
          align-self: start;
          border: 1px solid #dedede;
          border-radius: 18px;
          background: #fff;
          overflow: hidden;
        }

        .groupTabs {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border-bottom: 1px solid #e4e4e4;
        }

        .groupTabs button {
          min-height: 56px;
          padding: 10px 6px;
          border: 0;
          border-right: 1px solid #e8e8e8;
          background: #fafafa;
          color: #5a5a5a;
          font-weight: 800;
          cursor: pointer;
        }

        .groupTabs button:last-child {
          border-right: 0;
        }

        .groupTabs button.active {
          background: #c31621;
          color: white;
        }

        .panelHeading {
          padding: 20px 20px 12px;
        }

        .panelHeading > span {
          font-size: 20px;
          font-weight: 900;
        }

        .partList {
          padding: 0 12px 14px;
        }

        .partButton {
          display: grid;
          grid-template-columns: 10px minmax(0, 1fr) 18px;
          align-items: center;
          gap: 11px;
          width: 100%;
          padding: 13px 10px;
          border: 0;
          border-bottom: 1px solid #ededed;
          background: transparent;
          color: #222;
          text-align: left;
          cursor: pointer;
        }

        .partButton:hover {
          background: #fafafa;
        }

        .partButton.selected {
          background: #fff3f4;
        }

        .partDot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #c31621;
        }

        .partButton strong,
        .partButton small {
          display: block;
        }

        .partButton strong {
          font-size: 14px;
        }

        .partButton small {
          margin-top: 3px;
          overflow: hidden;
          color: #888;
          font-size: 11px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .partButton b {
          color: #999;
          font-size: 22px;
        }

        .selectedBox {
          border-top: 1px solid #e4e4e4;
          background: #fafafa;
          padding: 20px;
        }

        .selectedBox h2 {
          margin: 5px 0 0;
          font-size: 24px;
        }

        .keywordList {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin: 14px 0 18px;
        }

        .keywordList span {
          padding: 6px 8px;
          border: 1px solid #dedede;
          border-radius: 7px;
          background: white;
          color: #555;
          font-size: 11px;
          font-weight: 700;
        }

        .productsButton {
          display: block;
          padding: 13px 15px;
          border-radius: 9px;
          background: #c31621;
          color: white;
          font-size: 13px;
          font-weight: 900;
          text-align: center;
          text-decoration: none;
        }

        @media (max-width: 1050px) {
          .vehicleCatalog {
            grid-template-columns: 1fr;
          }

          .catalogPanel {
            width: 100%;
          }

          .viewerFrame {
            height: 58vh;
            min-height: 430px;
          }
        }

        @media (max-width: 620px) {
          .vehicleCatalog {
            padding: 12px;
          }

          .viewerToolbar {
            align-items: start;
          }

          .vehicleBadge {
            display: none;
          }

          .viewerFrame {
            height: 470px;
            min-height: 470px;
            border-radius: 12px;
          }

          .viewerHint {
            max-width: calc(100% - 20px);
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .groupTabs button {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}
