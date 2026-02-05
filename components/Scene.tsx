import React, { useMemo, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Html, OrthographicCamera, Line, Edges, ContactShadows } from '@react-three/drei';
import { GlobalConfig, LayoutData, BayType } from '../types';
import { DIMENSIONS, COLORS } from '../constants';
import { FramePart, ShelfPart, HangerPart, XBarPart, CornerShelfPart, LPostPart, DrawerPart, FabricDrawerPart, CabinetPart, MirrorPart, CurtainPart } from './Parts';

interface SceneProps {
  config: GlobalConfig;
  previewModelUrl: string | null;
  selectedBayId: string | null;
  onBayClick: (id: string) => void;
  interactionMode: 'none' | 'placing_shelf' | 'placing_hanger' | 'placing_drawer' | 'placing_fabric_drawer' | 'placing_cabinet_open' | 'placing_cabinet_door' | 'placing_mirror' | 'placing_curtain_400_1500' | 'placing_curtain_400_2100' | 'placing_curtain_800_1500' | 'placing_curtain_800_2100';
  setInteractionMode: (mode: any) => void;
  onItemPlace: (bayId: string, levelIndex: number) => void;
  onAddBay: (width: number, type?: BayType) => void;
  onRemoveBay: (bayId: string) => void;
  triggerFit: number;
  isQuotationOpen: boolean;
  isManualOpen?: boolean;
  isTopView?: boolean;
  showDimensions?: boolean;
  onBackgroundClick?: () => void;
}

const BACKGROUND_COLOR = "#cbd5e1"; 

// ... CameraController, TopViewCamera, DimensionMarkers, BayFootprint omitted for brevity (they are unchanged) ...
// Copying them back to ensure file integrity
const CameraController: React.FC<{ 
    layout: LayoutData[], 
    triggerFit: number,
    hasCorner: boolean,
    isTopView?: boolean,
    isQuotationOpen: boolean,
    isManualOpen?: boolean,
    showDimensions?: boolean
}> = ({ layout, triggerFit, hasCorner, isTopView, isQuotationOpen, isManualOpen, showDimensions }) => {
    const { camera, controls } = useThree();
    const controlsRef = useRef<any>(null);
    const lastTriggerRef = useRef<number>(0);

    useEffect(() => {
        if (triggerFit > lastTriggerRef.current && !isTopView) {
             lastTriggerRef.current = triggerFit;
             
             if (layout.length === 0) {
                 if(controlsRef.current) {
                    controlsRef.current.reset();
                    camera.position.set(300, 400, 500);
                    controlsRef.current.target.set(0, 0, 0);
                    controlsRef.current.update();
                 }
                 return;
             }

             const box = new THREE.Box3();
             const tempVec = new THREE.Vector3();
             
             layout.forEach(l => {
                 box.expandByPoint(tempVec.set(...l.entryPoint));
                 box.expandByPoint(tempVec.set(...l.exitPoint));
                 box.expandByPoint(tempVec.set(l.entryPoint[0], 210, l.entryPoint[2]));
             });
             
             const padding = showDimensions ? 120 : 60;
             box.expandByScalar(padding);

             const center = new THREE.Vector3();
             box.getCenter(center);
             const size = new THREE.Vector3();
             box.getSize(size);
             
             const maxDim = Math.max(size.x, size.y, size.z);
             let finalCamPos = new THREE.Vector3();

             const lastBay = layout[layout.length - 1];
             const rotation = lastBay ? lastBay.rotation : 0;
             const isLastCorner = lastBay && lastBay.bay.type === 'corner';
             
             const dist = maxDim * 1.5 + 250;
             
             if (isLastCorner) {
                 const diagonalAngle = rotation - (Math.PI / 4);
                 const baseVec = new THREE.Vector3(0, 0.4, 1.2).normalize().multiplyScalar(dist);
                 baseVec.applyAxisAngle(new THREE.Vector3(0,1,0), diagonalAngle);
                 finalCamPos = center.clone().add(baseVec);
             } else {
                 const offset = new THREE.Vector3(1, 0.6, 1).normalize().multiplyScalar(dist);
                 offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation);
                 finalCamPos = center.clone().add(offset);
             }

             if (controlsRef.current) {
                const shiftAmount = maxDim * 0.3;
                const shiftVec = new THREE.Vector3(0, 0, 0);

                if (isQuotationOpen || isManualOpen) {
                     const camDir = new THREE.Vector3().subVectors(center, finalCamPos).normalize();
                     const rightDir = new THREE.Vector3().crossVectors(camDir, new THREE.Vector3(0,1,0)).normalize();
                     shiftVec.add(rightDir.multiplyScalar(shiftAmount));
                }

                const targetPos = center.clone().add(shiftVec);

                controlsRef.current.target.copy(targetPos);
                camera.position.copy(finalCamPos.add(shiftVec));
                camera.zoom = 1;
                camera.updateProjectionMatrix();
                controlsRef.current.update();
             }
        }
    }, [triggerFit, isQuotationOpen, isManualOpen, isTopView, camera, hasCorner, showDimensions]); 

    if (isTopView) return null;

    return <OrbitControls ref={controlsRef} makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2} />;
}

const TopViewCamera: React.FC<{ layout: LayoutData[] }> = ({ layout }) => {
    const box = useMemo(() => {
        const b = new THREE.Box3();
        if (layout.length === 0) return b.setFromCenterAndSize(new THREE.Vector3(0,0,0), new THREE.Vector3(200,200,200));
        
        const tempVec = new THREE.Vector3();
        layout.forEach(l => {
            b.expandByPoint(tempVec.set(...l.entryPoint));
            b.expandByPoint(tempVec.set(...l.exitPoint));
            b.expandByPoint(tempVec.set(l.entryPoint[0], 210, l.entryPoint[2]));
            
            if (l.bay.type === 'corner') {
                 const p1 = new THREE.Vector3(...l.entryPoint);
                 // Expand for corner footprint
                 b.expandByPoint(p1.clone().add(new THREE.Vector3(65, 0, 65)));
                 b.expandByPoint(p1.clone().add(new THREE.Vector3(65, 0, -65)));
            }
        });
        b.expandByScalar(120); 
        return b;
    }, [layout]);

    const center = new THREE.Vector3();
    box.getCenter(center);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.z);

    return (
        <OrthographicCamera 
            makeDefault 
            position={[center.x, 1000, center.z]} 
            rotation={[-Math.PI / 2, 0, 0]}
            zoom={250 / maxDim} 
            near={0}
            far={5000}
        />
    )
}

const DimensionMarkers: React.FC<{ layout: LayoutData[], isTopView?: boolean }> = ({ layout, isTopView }) => {
    const { min, max, width, depth, height } = useMemo(() => {
        if (layout.length === 0) return { min: new THREE.Vector3(), max: new THREE.Vector3(), width: 0, depth: 0, height: 210 };
        const b = new THREE.Box3();
        const { FRAME_THICKNESS, FRAME_DEPTH } = DIMENSIONS;
        const halfThick = FRAME_THICKNESS / 2;
        const halfDepth = FRAME_DEPTH / 2;

        layout.forEach(l => {
             const r = l.rotation;
             const p1 = new THREE.Vector3(...l.entryPoint);
             const p2 = new THREE.Vector3(...l.exitPoint);

             if (l.bay.type === 'corner') {
                 // Simplified bounds for corner
                 b.expandByPoint(p1.clone().add(new THREE.Vector3(62, 0, 62))); 
                 b.expandByPoint(p1.clone().add(new THREE.Vector3(62, 0, -62))); 
                 b.expandByPoint(p1);
             } else {
                 const dirVec = new THREE.Vector3(...l.exitPoint).sub(new THREE.Vector3(...l.entryPoint)).normalize();
                 b.expandByPoint(p1.clone().add(dirVec.clone().multiplyScalar(-halfThick)));
                 b.expandByPoint(p2.clone().add(dirVec.clone().multiplyScalar(halfThick)));

                 const depthVec = new THREE.Vector3(0, 0, halfDepth).applyAxisAngle(new THREE.Vector3(0,1,0), r);
                 b.expandByPoint(p1.clone().add(depthVec));
                 b.expandByPoint(p1.clone().sub(depthVec));
                 b.expandByPoint(p2.clone().add(depthVec));
                 b.expandByPoint(p2.clone().sub(depthVec));
             }
             b.expandByPoint(p1.clone().setY(0));
             b.expandByPoint(p1.clone().setY(210));
        });

        const size = new THREE.Vector3();
        b.getSize(size);
        return { min: b.min, max: b.max, width: size.x, depth: size.z, height: 210 };
    }, [layout]);

    if (layout.length === 0) return null;

    const lineOffset = 40; 
    const tickSize = 5; 
    
    const wStart = [min.x, -lineOffset, max.z + lineOffset] as [number,number,number];
    const wEnd = [max.x, -lineOffset, max.z + lineOffset] as [number,number,number];
    
    const dStart = [max.x + lineOffset, -lineOffset, min.z] as [number,number,number];
    const dEnd = [max.x + lineOffset, -lineOffset, max.z] as [number,number,number];
    
    const hStart = [min.x - lineOffset, 0, max.z + lineOffset] as [number,number,number];
    const hEnd = [min.x - lineOffset, height, max.z + lineOffset] as [number,number,number];

    const MarkerLine = ({ start, end, label, textPos, type }: { start: any, end: any, label: string, textPos?: any, type: 'width' | 'depth' | 'height' }) => {
        const tickVec = type === 'width' ? [0,0,tickSize] : (type === 'depth' ? [tickSize,0,0] : [0,0,tickSize]);
        const startTickP1 = [start[0]-tickVec[0], start[1]-tickVec[1], start[2]-tickVec[2]] as any;
        const startTickP2 = [start[0]+tickVec[0], start[1]+tickVec[1], start[2]+tickVec[2]] as any;
        const endTickP1 = [end[0]-tickVec[0], end[1]-tickVec[1], end[2]-tickVec[2]] as any;
        const endTickP2 = [end[0]+tickVec[0], end[1]+tickVec[1], end[2]+tickVec[2]] as any;

        const lineProps = isTopView ? { depthTest: false, renderOrder: 999 } : { depthTest: true };

        return (
            <group>
                <Line points={[start, end]} color="#2563eb" lineWidth={3} {...lineProps} />
                <Line points={[startTickP1, startTickP2]} color="#2563eb" lineWidth={3} {...lineProps} />
                <Line points={[endTickP1, endTickP2]} color="#2563eb" lineWidth={3} {...lineProps} />
                
                <Html 
                    position={textPos || [(start[0]+end[0])/2, (start[1]+end[1])/2, (start[2]+end[2])/2]} 
                    center 
                    zIndexRange={[100, 0]} 
                >
                     <div className="text-blue-600 text-lg font-bold whitespace-nowrap bg-white/80 px-2 py-0.5 rounded shadow-sm" style={{ backdropFilter: 'blur(2px)' }}>
                         {label}
                     </div>
                </Html>
            </group>
        );
    };

    return (
        <group>
            <MarkerLine 
                type="width"
                start={wStart} end={wEnd} label={`${width.toFixed(1)}`} 
                textPos={[(wStart[0]+wEnd[0])/2, wStart[1] - 30, wStart[2] + 25]}
            />
            <MarkerLine 
                type="depth"
                start={dStart} end={dEnd} label={`${depth.toFixed(1)}`} 
                textPos={[dStart[0] + 35, dStart[1], (dStart[2]+dEnd[2])/2]}
            />
            
            {!isTopView && (
                <MarkerLine 
                    type="height"
                    start={hStart} end={hEnd} label={`${height}`} 
                    textPos={[hStart[0] - 35, (hStart[1]+hEnd[1])/2, hStart[2]]}
                />
            )}
            
            {isTopView && (
                <Html 
                    position={[(min.x + max.x)/2, 0, min.z - 80]} 
                    center 
                    zIndexRange={[100, 0]}
                >
                     <div className="text-blue-600 text-lg font-bold whitespace-nowrap bg-white/80 px-2 py-0.5 rounded shadow-sm border border-blue-200" style={{ backdropFilter: 'blur(2px)' }}>
                         H: 2100mm
                     </div>
                </Html>
            )}
        </group>
    );
}

const BayFootprint: React.FC<{ bayWidth: number, type: 'normal' | 'corner', position: [number, number, number], rotation: number }> = ({ bayWidth, type, position, rotation }) => {
    const { FRAME_THICKNESS, FRAME_DEPTH } = DIMENSIONS;
    
    if (type === 'corner') {
        const frameHalf = FRAME_THICKNESS / 2; 
        const entryFrontX = frameHalf + 0.1; 
        const entryFrontZ = FRAME_DEPTH / 2; 
        const innerCornerX = 31.15; 
        const innerCornerZ = 44.9; 
        const farX = 61.25; 
        const farZ = -15.0;
        const entryFarZ = -15.0; 

        const pts = [
            new THREE.Vector3(entryFrontX, 0, entryFrontZ),
            new THREE.Vector3(innerCornerX, 0, entryFrontZ),
            new THREE.Vector3(innerCornerX, 0, innerCornerZ),
            new THREE.Vector3(farX, 0, innerCornerZ),
            new THREE.Vector3(farX, 0, farZ),
            new THREE.Vector3(entryFrontX, 0, entryFarZ), 
            new THREE.Vector3(entryFrontX, 0, entryFrontZ)
        ];
        
        return (
             <group position={position} rotation={[0, rotation, 0]}>
                 <Line points={pts} color="black" lineWidth={2} />
             </group>
        )
    } else {
        const w = bayWidth;
        const d = FRAME_DEPTH;
        const pts = [
            new THREE.Vector3(-w/2 + FRAME_THICKNESS/2, 0, d/2),
            new THREE.Vector3(w/2 - FRAME_THICKNESS/2, 0, d/2),
            new THREE.Vector3(w/2 - FRAME_THICKNESS/2, 0, -d/2),
            new THREE.Vector3(-w/2 + FRAME_THICKNESS/2, 0, -d/2),
            new THREE.Vector3(-w/2 + FRAME_THICKNESS/2, 0, d/2)
        ];
        return (
            <group position={position} rotation={[0, rotation, 0]}>
                <Line points={pts} color="black" lineWidth={2} />
            </group>
        )
    }
}

export const Scene: React.FC<SceneProps> = ({ 
    config, 
    selectedBayId, 
    onBayClick, 
    interactionMode, 
    setInteractionMode, 
    onItemPlace, 
    onAddBay, 
    onRemoveBay, 
    triggerFit, 
    isQuotationOpen, 
    isManualOpen, 
    isTopView = false, 
    showDimensions = false, 
    onBackgroundClick 
}) => {
  const { RUNG_LEVELS, XBAR_POSITIONS } = DIMENSIONS;

  const { layoutData, hasCorner } = useMemo(() => {
      const data: LayoutData[] = [];
      let currentPos = new THREE.Vector3(0, 0, 0); 
      let currentRot = 0; 
      let cornerExists = false;
      
      config.bays.forEach((bay) => {
          const isCorner = bay.type === 'corner';
          if (isCorner) cornerExists = true;
          
          if (isCorner) {
              const exitOffsetX = 46.25; 
              const exitOffsetZ = 46.25; 
              
              const offsetVec = new THREE.Vector3(exitOffsetX, 0, exitOffsetZ).applyAxisAngle(new THREE.Vector3(0,1,0), currentRot);
              const exitGlobal = currentPos.clone().add(offsetVec);
              
              data.push({
                   bay,
                   position: [currentPos.x, currentPos.y, currentPos.z],
                   rotation: currentRot,
                   entryPoint: [currentPos.x, currentPos.y, currentPos.z],
                   exitPoint: [exitGlobal.x, exitGlobal.y, exitGlobal.z],
               });
               
               currentPos = exitGlobal;
               currentRot -= Math.PI / 2; 
          } else {
              const width = bay.width; 
              const moveDist = width; 
              const moveVec = new THREE.Vector3(moveDist, 0, 0).applyAxisAngle(new THREE.Vector3(0,1,0), currentRot);
              const nextJoint = currentPos.clone().add(moveVec);
              
              const centerDist = moveDist / 2;
              const centerVec = new THREE.Vector3(centerDist, 0, 0).applyAxisAngle(new THREE.Vector3(0,1,0), currentRot);
              const bayCenter = currentPos.clone().add(centerVec);

               data.push({
                  bay,
                  position: [bayCenter.x, bayCenter.y, bayCenter.z],
                  rotation: currentRot,
                  entryPoint: [currentPos.x, currentPos.y, currentPos.z],
                  exitPoint: [nextJoint.x, nextJoint.y, nextJoint.z],
              });
              
              currentPos = nextJoint;
          }
      });
      
      return { layoutData: data, hasCorner: cornerExists };
  }, [config.bays]);

  return (
    <Canvas shadows={!isTopView} camera={{ position: [300, 400, 500], fov: 35, far: 10000 }}>
      {/* Background & Atmosphere */}
      <color attach="background" args={[isTopView ? '#ffffff' : BACKGROUND_COLOR]} />
      {!isTopView && <fog attach="fog" args={[BACKGROUND_COLOR, 500, 2000]} />}
      
      {!isTopView && <ambientLight intensity={0.7} />}
      {!isTopView && <directionalLight position={[100, 200, 150]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0001} />}
      {isTopView && <ambientLight intensity={1.5} />}
      
      {!isTopView && <Environment preset="city" />}
      
      <group onPointerMissed={() => onBackgroundClick && onBackgroundClick()}>
          {isTopView ? (
              <TopViewCamera layout={layoutData} />
          ) : (
              <CameraController 
                layout={layoutData} 
                triggerFit={triggerFit} 
                hasCorner={hasCorner} 
                isQuotationOpen={isQuotationOpen} 
                isManualOpen={isManualOpen}
                showDimensions={showDimensions} 
              />
          )}

          {showDimensions && <DimensionMarkers layout={layoutData} isTopView={isTopView} />}

          <group position={[0, 0, 0]}>
            
            {layoutData.length === 0 && (
                <FramePart position={[0, 0, 0]} color={config.frameColor} isQuotationOpen={isQuotationOpen} isTopView={isTopView} />
            )}

            {layoutData.map(({ bay, position, rotation, entryPoint, exitPoint }, index) => {
              const isSelected = !isTopView && bay.id === selectedBayId;
              const posTuple: [number, number, number] = [position[0], position[1], position[2]];
              const entryTuple: [number, number, number] = [entryPoint[0], entryPoint[1], entryPoint[2]];
              const exitTuple: [number, number, number] = [exitPoint[0], exitPoint[1], exitPoint[2]];
              const isCorner = bay.type === 'corner';
              
              const lPostLocalX = 61.25;
              const lPostLocalZ = -15.0;
              
              const lPostLocal = new THREE.Vector3(lPostLocalX, 0, lPostLocalZ);
              const lPostGlobal = lPostLocal.clone().applyAxisAngle(new THREE.Vector3(0,1,0), rotation).add(new THREE.Vector3(...entryTuple));
              const lPostTuple: [number,number,number] = [lPostGlobal.x, lPostGlobal.y, lPostGlobal.z];
              const prevBay = index > 0 ? layoutData[index - 1].bay : null;
              const shouldSwapBrackets = prevBay && prevBay.type === 'corner';

              const ghostLevels: number[] = [];
              if (interactionMode !== 'none' && !isTopView) {
                 RUNG_LEVELS.forEach((_, levelIndex) => {
                     const hasShelf = bay.items.some(i => i.levelIndex === levelIndex && (i.type === 'shelf' || i.type === 'corner'));
                     const hasHanger = bay.items.some(i => i.levelIndex === levelIndex && i.type === 'hanger');
                     const hasDrawer = bay.items.some(i => i.levelIndex === levelIndex && i.type === 'drawer');
                     const hasFabricDrawer = bay.items.some(i => i.levelIndex === levelIndex && i.type === 'fabric_drawer');
                     const hasCabinet = bay.items.some(i => (i.type === 'cabinet_800_open' || i.type === 'cabinet_800_door'));
                     const hasMirror = bay.items.some(i => i.type === 'mirror');
                     const hasCurtain = bay.items.some(i => i.type.startsWith('curtain'));
                     
                     // Helper: Check if specific item type exists at this level
                     const hasSpecificDrawer = hasDrawer || hasFabricDrawer;
                     const hasAnyStorage = hasDrawer || hasFabricDrawer || hasCabinet;

                     if (interactionMode === 'placing_shelf') {
                         if (!hasShelf && !hasCabinet) ghostLevels.push(levelIndex);
                     }
                     if (interactionMode === 'placing_hanger') {
                        if (!hasHanger) {
                            if (levelIndex === 0) return; // Never on floor
                            // Check collisions with storage
                            const blockedByDrawer = bay.items.some(i => i.levelIndex === levelIndex && (i.type.includes('drawer')));
                            const blockedByCabinet = bay.items.some(i => i.levelIndex === 0 && (i.type === 'cabinet_800_open' || i.type === 'cabinet_800_door'));
                            
                            if (blockedByDrawer) return;
                            if (blockedByCabinet && levelIndex <= 1) return; // Cabinet blocks Level 1
                            if (isCorner && !hasShelf) return; // Corner needs shelf for hanger
                            
                            ghostLevels.push(levelIndex);
                        }
                     }
                     if (interactionMode === 'placing_drawer') {
                         if (bay.width > 80 && bay.width < 90 && !isCorner && !hasMirror) { 
                             if (levelIndex <= 1) ghostLevels.push(levelIndex);
                         }
                     }
                     if (interactionMode === 'placing_fabric_drawer') {
                         const is800 = bay.width > 80 && bay.width < 90;
                         const is400 = bay.width > 40 && bay.width < 50;
                         if ((is800 || is400) && !isCorner) {
                             if (levelIndex <= 1) ghostLevels.push(levelIndex);
                         }
                     }
                     if (interactionMode === 'placing_cabinet_open' || interactionMode === 'placing_cabinet_door') {
                         const is800 = bay.width > 80 && bay.width < 90;
                         if (is800 && !isCorner && !hasMirror) {
                             if (levelIndex === 0) ghostLevels.push(levelIndex);
                         }
                     }
                     if (interactionMode === 'placing_mirror') {
                         const is400 = bay.width > 40 && bay.width < 50;
                         if (is400 && !isCorner) {
                             if (levelIndex === 0) ghostLevels.push(levelIndex);
                         }
                     }
                     // Curtain Ghost: Only at Level 5 (Top), Not Corner, Not Mirror
                     if (interactionMode.startsWith('placing_curtain')) {
                         if (!isCorner && !hasMirror) {
                             // Can replace existing curtain
                             if (levelIndex === 5) {
                                 // Check width constraints for curtain highlight
                                 const is400 = bay.width < 60;
                                 const is800or1200 = bay.width > 60;
                                 
                                 if (interactionMode.includes('400') && is400) {
                                     ghostLevels.push(levelIndex);
                                 } else if (interactionMode.includes('800') && is800or1200) {
                                     ghostLevels.push(levelIndex);
                                 }
                             }
                         }
                     }
                 });
              }

              // X-Bar Group Logic (unchanged)
              const XBarGroup = () => {
                 if (!bay.hasXBar || isCorner) return null;
                 const zBackFace = -15.1; 
                 return (
                     <>
                        <XBarPart position={[0, XBAR_POSITIONS[0], zBackFace]} 
                                  rotation={[0, 0, 0]} 
                                  width={bay.width} height={RUNG_LEVELS[1] - RUNG_LEVELS[0]} isQuotationOpen={isQuotationOpen} isTopView={isTopView} />
                        <XBarPart position={[0, XBAR_POSITIONS[1], zBackFace]} 
                                  rotation={[0, 0, 0]} 
                                  width={bay.width} height={RUNG_LEVELS[4] - RUNG_LEVELS[3]} isQuotationOpen={isQuotationOpen} isTopView={isTopView} />
                     </>
                 )
              }

              // Corner X-Bars (unchanged)
              const CornerXBars = () => {
                 if (!bay.hasXBar || !isCorner) return null;
                 const h1 = RUNG_LEVELS[1] - RUNG_LEVELS[0];
                 const h2 = RUNG_LEVELS[4] - RUNG_LEVELS[3];
                 
                 const p1_Z = -15.1; 
                 const p2_Z = -15.1; 
                 const exitZ = 46.25;
                 
                 const start1 = new THREE.Vector3(0, 0, p1_Z);
                 const end1 = new THREE.Vector3(lPostLocalX, 0, p1_Z); 
                 const mid1 = new THREE.Vector3().addVectors(start1, end1).multiplyScalar(0.5);
                 const width1 = start1.distanceTo(end1); 
                 
                 const start2 = new THREE.Vector3(lPostLocalX, 0, p2_Z);
                 const end2 = new THREE.Vector3(lPostLocalX, 0, exitZ);
                 const mid2 = new THREE.Vector3().addVectors(start2, end2).multiplyScalar(0.5);
                 const width2 = start2.distanceTo(end2);

                 return (
                     <group>
                         <XBarPart position={[mid1.x, XBAR_POSITIONS[0], mid1.z]} rotation={[0, 0, 0]} width={width1} height={h1} customWidth={width1} isQuotationOpen={isQuotationOpen} isTopView={isTopView} />
                         <XBarPart position={[mid1.x, XBAR_POSITIONS[1], mid1.z]} rotation={[0, 0, 0]} width={width1} height={h2} customWidth={width1} isQuotationOpen={isQuotationOpen} isTopView={isTopView} />
                         
                         <XBarPart position={[mid2.x, XBAR_POSITIONS[0], mid2.z]} rotation={[0, -Math.PI/2, 0]} width={width2} height={h1} customWidth={width2} isQuotationOpen={isQuotationOpen} isTopView={isTopView} />
                         <XBarPart position={[mid2.x, XBAR_POSITIONS[1], mid2.z]} rotation={[0, -Math.PI/2, 0]} width={width2} height={h2} customWidth={width2} isQuotationOpen={isQuotationOpen} isTopView={isTopView} />
                     </group>
                 );
              }
              
              const isInteractable = interactionMode === 'none';

              return (
                <group key={bay.id} onClick={(e) => { e.stopPropagation(); if(onBayClick) onBayClick(bay.id); }}>
                  
                  {isTopView && (
                       <BayFootprint bayWidth={bay.width} type={bay.type} position={posTuple} rotation={rotation} />
                  )}

                  {index === 0 && (
                     <FramePart position={entryTuple} rotation={[0, 0, 0]} color={config.frameColor} isQuotationOpen={isQuotationOpen} isTopView={isTopView} /> 
                  )}

                  {isCorner ? (
                      <>
                          <FramePart position={exitTuple} rotation={[0, rotation - Math.PI/2, 0]} color={config.frameColor} isQuotationOpen={isQuotationOpen} isTopView={isTopView} />
                          <LPostPart position={lPostTuple} rotation={[0, rotation, 0]} color={config.frameColor} isQuotationOpen={isQuotationOpen} isTopView={isTopView} />
                      </>
                  ) : (
                      <FramePart position={exitTuple} rotation={[0, rotation, 0]} color={config.frameColor} isQuotationOpen={isQuotationOpen} isTopView={isTopView} />
                  )}
                  
                  <group position={isCorner ? entryTuple : posTuple} rotation={[0, rotation, 0]}>
                      
                      <XBarGroup />
                      <CornerXBars />

                      {bay.items.map((item) => {
                          const yPos = RUNG_LEVELS[item.levelIndex] || RUNG_LEVELS[0];
                          const props = {
                              position: [0, yPos, 0] as [number, number, number],
                              width: bay.width,
                              color: config.shelfColor,
                              isInteractable
                          };

                          let Component: React.ReactNode = null;
                          if (item.type === 'corner') {
                              Component = <CornerShelfPart {...props} isQuotationOpen={isQuotationOpen} isTopView={isTopView} />;
                          } else if (item.type === 'shelf') {
                              Component = <ShelfPart {...props} swapBrackets={shouldSwapBrackets} isQuotationOpen={isQuotationOpen} isTopView={isTopView} />;
                          } else if (item.type === 'hanger') {
                              Component = <HangerPart {...props} bayIndex={index} isCorner={isCorner} isQuotationOpen={isQuotationOpen} isTopView={isTopView} />;
                          } else if (item.type === 'drawer') {
                              Component = <DrawerPart {...props} isQuotationOpen={isQuotationOpen} isTopView={isTopView} />;
                          } else if (item.type === 'fabric_drawer') {
                              Component = <FabricDrawerPart {...props} isQuotationOpen={isQuotationOpen} isTopView={isTopView} />;
                          } else if (item.type === 'cabinet_800_open') {
                              Component = <CabinetPart {...props} width={80} isQuotationOpen={isQuotationOpen} isTopView={isTopView} hasDoor={false} />;
                          } else if (item.type === 'cabinet_800_door') {
                              Component = <CabinetPart {...props} width={80} isQuotationOpen={isQuotationOpen} isTopView={isTopView} hasDoor={true} />;
                          } else if (item.type === 'mirror') {
                              Component = <MirrorPart {...props} width={40} isQuotationOpen={isQuotationOpen} isTopView={isTopView} />
                          } else if (item.type.startsWith('curtain')) {
                              const h = item.type.includes('2100') ? 210 : 150;
                              // Curtain sits at very top (approx 206cm mark), yPos is mostly reference
                              Component = <CurtainPart {...props} position={[0, RUNG_LEVELS[5], 0]} width={bay.width} height={h} isQuotationOpen={isQuotationOpen} isTopView={isTopView} />
                          }

                          return (
                              <group 
                                  key={item.id} 
                                  onClick={(e) => { 
                                      if (interactionMode !== 'none') {
                                          e.stopPropagation(); 
                                          onItemPlace(bay.id, item.levelIndex); 
                                      }
                                  }}
                                  onPointerOver={() => { if (interactionMode !== 'none') document.body.style.cursor = 'pointer'; }}
                                  onPointerOut={() => { document.body.style.cursor = 'auto'; }}
                              >
                                  {Component}
                              </group>
                          );
                      })}

                      {!isTopView && ghostLevels.map(levelIdx => {
                          const yPos = RUNG_LEVELS[levelIdx];
                          return (
                            <group 
                                key={`ghost-${levelIdx}`} 
                                onClick={(e) => { e.stopPropagation(); onItemPlace(bay.id, levelIdx); }}
                            >
                                {interactionMode === 'placing_shelf' && (
                                    isCorner 
                                    ? <CornerShelfPart position={[0, yPos, 0]} color={config.shelfColor} width={bay.width} isGhost />
                                    : <ShelfPart position={[0, yPos, 0]} width={bay.width} color={config.shelfColor} isGhost />
                                )}
                                {interactionMode === 'placing_hanger' && (
                                    <HangerPart position={[0, yPos, 0]} width={bay.width} bayIndex={index} isGhost isCorner={isCorner} />
                                )}
                                {interactionMode === 'placing_drawer' && (
                                    <DrawerPart position={[0, yPos, 0]} width={bay.width} color={config.shelfColor} isGhost />
                                )}
                                {interactionMode === 'placing_fabric_drawer' && (
                                    <FabricDrawerPart position={[0, yPos, 0]} width={bay.width} color={config.shelfColor} isGhost />
                                )}
                                {interactionMode === 'placing_cabinet_open' && (
                                    <CabinetPart position={[0, yPos, 0]} width={80} color={config.shelfColor} isGhost hasDoor={false} />
                                )}
                                {interactionMode === 'placing_cabinet_door' && (
                                    <CabinetPart position={[0, yPos, 0]} width={80} color={config.shelfColor} isGhost hasDoor={true} />
                                )}
                                {interactionMode === 'placing_mirror' && (
                                    <MirrorPart position={[0, yPos, 0]} width={40} color={config.shelfColor} isGhost />
                                )}
                                {interactionMode.startsWith('placing_curtain') && (
                                    <CurtainPart 
                                        position={[0, RUNG_LEVELS[5], 0]} 
                                        width={bay.width} 
                                        height={interactionMode.includes('2100') ? 210 : 150} 
                                        isGhost 
                                    />
                                )}
                            </group>
                          )
                      })}
                  </group>

                </group>
              );
            })}
            
            {/* Contact Shadows for grounding */}
            {!isTopView && (
                <ContactShadows 
                    position={[0, 0.1, 0]} 
                    opacity={0.4} 
                    scale={200} 
                    blur={2} 
                    far={4.5} 
                />
            )}
            
          </group>
      </group>
    </Canvas>
  );
}