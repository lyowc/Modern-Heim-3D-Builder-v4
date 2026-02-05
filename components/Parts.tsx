import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Edges } from '@react-three/drei';
import { DIMENSIONS, COLORS } from '../constants';
import { GlobalConfig } from '../types';

// Utility to get hex color string
const getFrameColor = (colorKey: GlobalConfig['frameColor']) => COLORS.FRAME[colorKey];
const getShelfColor = (colorKey: GlobalConfig['shelfColor']) => COLORS.SHELF[colorKey];
const CONNECTOR_COLOR = "#444444"; // Dark Gray for all connectors

const getEdgeColor = (baseColorKey: string) => {
    if (baseColorKey === 'white') return "#d4a373"; // Wood color for white parts (Requested)
    return "#333333"; // Default dark gray/black for others
}

// Helper: Determine material props based on highlight/BOM state
const usePartMaterial = (baseColor: string, type: 'frame' | 'shelf' | 'hanger' | 'xbar' | 'drawer' | 'fabric_drawer' | 'cabinet' | 'mirror' | 'curtain' | 'default', isQuotationOpen: boolean, highlightColor?: string) => {
    if (isQuotationOpen) {
        // Explicit highlight color overrides everything (for shelf sizing etc)
        if (highlightColor) return { color: highlightColor };

        let bomColor = COLORS.HIGHLIGHT.default;
        if (type === 'hanger') bomColor = COLORS.HIGHLIGHT.hanger;
        else if (type === 'xbar') bomColor = COLORS.HIGHLIGHT.xbar;
        else if (type === 'frame') bomColor = COLORS.HIGHLIGHT.frame;
        else if (type === 'drawer') bomColor = COLORS.HIGHLIGHT.drawer;
        else if (type === 'fabric_drawer') bomColor = COLORS.HIGHLIGHT.fabric_drawer;
        else if (type === 'cabinet') bomColor = COLORS.HIGHLIGHT.cabinet;
        else if (type === 'mirror') bomColor = COLORS.HIGHLIGHT.mirror;
        else if (type === 'curtain') bomColor = COLORS.HIGHLIGHT.curtain;
        
        return { color: bomColor };
    }
    // Normal State
    return { color: baseColor };
};

// --- Helper: Invisible Hit Box for better clicking ---
const HitBox = ({ args, position = [0,0,0], onClick }: { args: [number, number, number], position?: [number, number, number], onClick?: (e:any) => void }) => (
    <mesh position={position} onClick={onClick}>
        <boxGeometry args={args} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} color="red" />
    </mesh>
);

// --- Helper: Placement Highlight Box (Ghost) ---
const HighlightBox: React.FC<{ width: number, depth: number, thickness: number, isRound?: boolean, color: string }> = ({ width, depth, thickness, isRound, color }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    useFrame(({ clock }) => {
        if (meshRef.current) {
            const material = meshRef.current.material as THREE.MeshBasicMaterial;
            material.opacity = 0.4 + Math.sin(clock.getElapsedTime() * 10) * 0.2; // Faster blink
        }
    });

    if (isRound) {
        return (
             <mesh ref={meshRef} rotation={[0,0,Math.PI/2]} renderOrder={999}>
                <cylinderGeometry args={[1.5, 1.5, width, 16]} />
                <meshBasicMaterial color={color} transparent opacity={0.5} depthTest={false} />
            </mesh>
        )
    }

    return (
        <mesh ref={meshRef} renderOrder={999}>
            <boxGeometry args={[width, thickness, depth]} />
            <meshBasicMaterial color={color} transparent opacity={0.5} depthTest={false} />
            <Edges color="white" depthTest={false} />
        </mesh>
    );
}

interface PartProps {
    isQuotationOpen?: boolean;
    isTopView?: boolean; // For Drawing Mode
    isInteractable?: boolean; // Enable animations
}

interface FrameProps extends PartProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  color: GlobalConfig['frameColor'];
}

export const FramePart: React.FC<FrameProps> = ({ position, rotation = [0,0,0], color, isQuotationOpen = false, isTopView }) => {
  const { FRAME_METAL_HEIGHT, FRAME_DEPTH, FRAME_THICKNESS, RUNG_LEVELS, FOOT_CAP_HEIGHT, ADJUSTER_HEIGHT, XBAR_POSITIONS } = DIMENSIONS;
  const baseColor = getFrameColor(color);
  const edgeColor = getEdgeColor(color);
  
  const matProps = usePartMaterial(baseColor, 'frame', isQuotationOpen, COLORS.HIGHLIGHT.frame);
  
  const zFront = FRAME_DEPTH / 2 - FRAME_THICKNESS / 2;
  const zBack = -FRAME_DEPTH / 2 + FRAME_THICKNESS / 2;
  const postY = ADJUSTER_HEIGHT + FOOT_CAP_HEIGHT + (FRAME_METAL_HEIGHT / 2);
  const FOOT_RADIUS = 1.15; 

  // --- TOP VIEW RENDER ---
  if (isTopView) {
      return (
          <group position={position} rotation={rotation}>
               <mesh position={[0, postY, zFront]}>
                   <boxGeometry args={[FRAME_THICKNESS, FRAME_METAL_HEIGHT, FRAME_THICKNESS]} />
                   <meshBasicMaterial color="#ffffff" />
                   <Edges color="black" threshold={15} />
               </mesh>
               <mesh position={[0, postY, zBack]}>
                   <boxGeometry args={[FRAME_THICKNESS, FRAME_METAL_HEIGHT, FRAME_THICKNESS]} />
                   <meshBasicMaterial color="#ffffff" />
                   <Edges color="black" threshold={15} />
               </mesh>
          </group>
      )
  }
  
  const PostMesh = ({ zPosition, isBack }: { zPosition: number, isBack: boolean }) => (
    <group position={[0, 0, zPosition]}>
        <mesh position={[0, postY, 0]} castShadow receiveShadow>
          <boxGeometry args={[FRAME_THICKNESS, FRAME_METAL_HEIGHT, FRAME_THICKNESS]} />
          <meshStandardMaterial {...matProps} roughness={0.5} />
          {!isQuotationOpen && <Edges color={edgeColor} threshold={45} />} 
        </mesh>
        {/* Foot Cap & Adjuster */}
        <mesh position={[0, ADJUSTER_HEIGHT + FOOT_CAP_HEIGHT / 2, 0]} castShadow>
             <boxGeometry args={[FRAME_THICKNESS + 0.05, FOOT_CAP_HEIGHT, FRAME_THICKNESS + 0.05]} />
             <meshStandardMaterial color={isQuotationOpen ? COLORS.HIGHLIGHT.frame : COLORS.FRAME_ACCENT.gold} metalness={isQuotationOpen ? 0 : 0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, ADJUSTER_HEIGHT / 2, 0]}>
             <cylinderGeometry args={[FOOT_RADIUS, FOOT_RADIUS, ADJUSTER_HEIGHT, 32]} />
             <meshStandardMaterial color={isQuotationOpen ? COLORS.HIGHLIGHT.frame : COLORS.FRAME_ACCENT.foot} />
        </mesh>
        
        {isBack && XBAR_POSITIONS.map((h, i) => (
             <mesh key={i} position={[0, h, FRAME_THICKNESS/2 + 0.01]} rotation={[Math.PI/2, 0, 0]}>
                <cylinderGeometry args={[0.3, 0.3, 0.2, 8]} />
                <meshStandardMaterial color={isQuotationOpen ? COLORS.HIGHLIGHT.frame : "#111"} />
            </mesh>
        ))}
    </group>
  );

  return (
    <group position={position} rotation={rotation}>
      <PostMesh zPosition={zFront} isBack={false} />
      <PostMesh zPosition={zBack} isBack={true} />
      {RUNG_LEVELS.map((y, i) => (
          <mesh key={i} position={[0, y, 0]} castShadow>
              <boxGeometry args={[FRAME_THICKNESS, FRAME_THICKNESS, FRAME_DEPTH]} />
              <meshStandardMaterial {...matProps} />
              {!isQuotationOpen && <Edges color={edgeColor} threshold={45} />}
          </mesh>
      ))}
    </group>
  );
};

export const LPostPart: React.FC<FrameProps> = ({ position, rotation = [0,0,0], color, isQuotationOpen = false, isTopView }) => {
    const { FRAME_METAL_HEIGHT, RUNG_LEVELS, ADJUSTER_HEIGHT, FOOT_CAP_HEIGHT, L_POST_SIZE, L_POST_THICKNESS, SHELF_THICKNESS, FRAME_THICKNESS } = DIMENSIONS;
    const baseColor = getFrameColor(color);
    const edgeColor = getEdgeColor(color);
    const matProps = usePartMaterial(baseColor, 'frame', isQuotationOpen, COLORS.HIGHLIGHT.lpost);
    
    const postHeight = FRAME_METAL_HEIGHT + ADJUSTER_HEIGHT + FOOT_CAP_HEIGHT;

    const shape = useMemo(() => {
        const s = new THREE.Shape();
        const size = L_POST_SIZE; 
        const thick = L_POST_THICKNESS; 
        s.moveTo(0, 0); 
        s.lineTo(0, size); 
        s.lineTo(thick, size); 
        s.lineTo(thick, thick); 
        s.lineTo(size, thick); 
        s.lineTo(size, 0); 
        s.lineTo(0, 0);
        return s;
    }, [L_POST_SIZE, L_POST_THICKNESS]);

    const FanBracket = () => (
        <mesh>
             <cylinderGeometry args={[4.0, 0.5, 1.0, 32, 1, false, 0, Math.PI/2]} />
             <meshStandardMaterial color={isQuotationOpen ? COLORS.HIGHLIGHT.lpost : CONNECTOR_COLOR} side={THREE.DoubleSide} />
        </mesh>
    );

    if (isTopView) {
        return (
             <group position={position} rotation={rotation}>
                <group rotation={[0, Math.PI, 0]}> 
                    <mesh position={[0, 0, 0]} rotation={[-Math.PI/2, 0, 0]}>
                        <extrudeGeometry args={[shape, { depth: postHeight, bevelEnabled: false }]} />
                        <meshBasicMaterial color="#ffffff" />
                        <Edges color="black" threshold={15} />
                    </mesh>
                </group>
            </group>
        )
    }

    return (
        <group position={position} rotation={rotation}>
            <group rotation={[0, Math.PI, 0]}> 
                <mesh position={[0, 0, 0]} rotation={[-Math.PI/2, 0, 0]} castShadow>
                    <extrudeGeometry args={[shape, { depth: postHeight, bevelEnabled: false }]} />
                    <meshStandardMaterial {...matProps} />
                    {!isQuotationOpen && <Edges color={edgeColor} threshold={45} />}
                </mesh>
                {RUNG_LEVELS.map((y, i) => {
                     const rungTop = y + (FRAME_THICKNESS/2);
                     const shelfBottom = rungTop - SHELF_THICKNESS;
                     return (
                        <group key={i} position={[0, shelfBottom - 0.5, 0]}>
                             <group rotation={[Math.PI, 0, 0]}> 
                                <FanBracket />
                             </group>
                        </group>
                    )
                })}
            </group>
        </group>
    );
};

export const CornerPostPart: React.FC<FrameProps> = () => null;

const SaddleBracket: React.FC<{ type: 'left' | 'right', isQuotationOpen?: boolean, shelfHighlightColor?: string, shelfColor?: GlobalConfig['shelfColor'] }> = ({ type, isQuotationOpen, shelfHighlightColor, shelfColor }) => {
    const { FRAME_THICKNESS, SHELF_THICKNESS, BRACKET_THICKNESS } = DIMENSIONS;
    
    let bracketColor = CONNECTOR_COLOR;
    if (isQuotationOpen) {
        bracketColor = shelfHighlightColor || COLORS.HIGHLIGHT.shelf_800;
    } else {
        bracketColor = shelfColor === 'white' ? '#ffffff' : '#1a1a1a';
    }
    
    const matProps = { color: bracketColor };

    const width = 2.5;
    const t = BRACKET_THICKNESS;
    const plateLen = 4.0;
    
    return (
        <group>
            <mesh position={[-plateLen/2, -t/2, 0]}>
                <boxGeometry args={[plateLen, t, width]} />
                <meshStandardMaterial {...matProps} />
            </mesh>
            <mesh position={[t/2, SHELF_THICKNESS/2, 0]}>
                <boxGeometry args={[t, SHELF_THICKNESS + t, width]} />
                <meshStandardMaterial {...matProps} />
            </mesh>
            <mesh position={[t + FRAME_THICKNESS/2, SHELF_THICKNESS + t/2, 0]}>
                <boxGeometry args={[FRAME_THICKNESS, t, width]} />
                <meshStandardMaterial {...matProps} />
            </mesh>
            <mesh position={[t + FRAME_THICKNESS + t/2, SHELF_THICKNESS - 0.5, 0]}>
                 <boxGeometry args={[t, 1.5, width]} />
                 <meshStandardMaterial {...matProps} />
            </mesh>
            <mesh position={[-1.5, -t - 0.05, 0.5]} rotation={[Math.PI/2, 0, 0]}>
                <cylinderGeometry args={[0.3, 0.3, 0.1, 16]} />
                <meshStandardMaterial {...matProps} />
            </mesh>
            <mesh position={[-2.5, -t - 0.05, -0.5]} rotation={[Math.PI/2, 0, 0]}>
                <cylinderGeometry args={[0.3, 0.3, 0.1, 16]} />
                <meshStandardMaterial {...matProps} />
            </mesh>
        </group>
    )
}

interface ShelfProps extends PartProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  width: number;
  color: GlobalConfig['shelfColor'];
  isGhost?: boolean;
  opacity?: number;
  swapBrackets?: boolean;
}

export const ShelfPart: React.FC<ShelfProps> = ({ position, rotation = [0,0,0], width, color, isGhost = false, opacity = 1, swapBrackets = false, isQuotationOpen = false, isTopView }) => {
  const { SHELF_THICKNESS, SHELF_DEPTH, FRAME_THICKNESS, BRACKET_THICKNESS } = DIMENSIONS;
  const gapWidth = width - FRAME_THICKNESS;
  const plateWidth = gapWidth - (BRACKET_THICKNESS * 2) - 0.05; 
  const shelfYLocal = (FRAME_THICKNESS / 2) - (SHELF_THICKNESS / 2);

  const baseColor = getShelfColor(color);
  const edgeColor = getEdgeColor(color);
  
  let highlightColor = COLORS.HIGHLIGHT.shelf_800; 
  if (width > 100) highlightColor = COLORS.HIGHLIGHT.shelf_1200;
  else if (width < 60) highlightColor = COLORS.HIGHLIGHT.shelf_400;

  const matProps = usePartMaterial(baseColor, 'shelf', isQuotationOpen, highlightColor);
  
  if (isGhost) {
      return (
        <group position={[position[0], position[1] + shelfYLocal, position[2]]} rotation={rotation}>
            <HighlightBox width={plateWidth} depth={SHELF_DEPTH} thickness={SHELF_THICKNESS} color="#facc15" />
            <HitBox args={[width, 20, 30]} />
        </group>
      )
  }

  if (isTopView) {
      return (
        <group position={[position[0], position[1], position[2]]} rotation={rotation}>
            <mesh position={[0, shelfYLocal, 0]}>
                <boxGeometry args={[plateWidth, SHELF_THICKNESS, SHELF_DEPTH]} />
                <meshBasicMaterial color="#ffffff" />
                <Edges color="black" threshold={15} />
            </mesh>
        </group>
      )
  }

  const shelfBottomY = (FRAME_THICKNESS / 2) - SHELF_THICKNESS;
  const zLeft = 15.0 - 6.25;
  const zRight = 15.0 - 3.75;
  const LeftType = swapBrackets ? 'right' : 'left';
  const RightType = swapBrackets ? 'left' : 'right';

  return (
    <group position={[position[0], position[1], position[2]]} rotation={rotation}>
        <mesh position={[0, shelfYLocal, 0]} castShadow receiveShadow>
            <boxGeometry args={[plateWidth, SHELF_THICKNESS, SHELF_DEPTH]} />
            <meshStandardMaterial {...matProps} transparent={opacity < 1} opacity={opacity} />
            {!isQuotationOpen && <Edges color={edgeColor} threshold={45} />}
        </mesh>
        <group position={[-plateWidth/2, shelfBottomY, -zLeft]} rotation={[0, Math.PI, 0]}><SaddleBracket type={LeftType} isQuotationOpen={isQuotationOpen} shelfHighlightColor={highlightColor} shelfColor={color} /></group>
        <group position={[-plateWidth/2, shelfBottomY, zLeft]} rotation={[0, Math.PI, 0]}><SaddleBracket type={LeftType} isQuotationOpen={isQuotationOpen} shelfHighlightColor={highlightColor} shelfColor={color}/></group>
        <group position={[plateWidth/2, shelfBottomY, -zRight]}><SaddleBracket type={RightType} isQuotationOpen={isQuotationOpen} shelfHighlightColor={highlightColor} shelfColor={color}/></group>
        <group position={[plateWidth/2, shelfBottomY, zRight]}><SaddleBracket type={RightType} isQuotationOpen={isQuotationOpen} shelfHighlightColor={highlightColor} shelfColor={color}/></group>
        <HitBox args={[width, 15, 30]} />
    </group>
  );
};

interface CornerShelfProps extends PartProps {
    position: [number, number, number];
    rotation?: [number, number, number];
    width: number;
    color: GlobalConfig['shelfColor'];
    isGhost?: boolean;
    opacity?: number;
}

export const CornerShelfPart: React.FC<CornerShelfProps> = ({ position, rotation = [0,0,0], width, color, isGhost, opacity = 1, isQuotationOpen = false, isTopView }) => {
    const { SHELF_THICKNESS, SHELF_DEPTH, FRAME_THICKNESS, FRAME_DEPTH } = DIMENSIONS;
    
    const shelfShape = useMemo(() => {
        const s = new THREE.Shape();
        const frameHalf = FRAME_THICKNESS / 2;
        
        const entryFrontX = frameHalf + 0.1;
        const entryFrontZ = FRAME_DEPTH / 2;
        
        const innerCornerX = 31.15;
        const innerCornerZ = 44.9;
        
        const farX = 61.25; 
        const farZ = -15.0;

        s.moveTo(entryFrontX, entryFrontZ);
        s.quadraticCurveTo(innerCornerX, entryFrontZ, innerCornerX, innerCornerZ);
        
        s.lineTo(farX, innerCornerZ);
        s.lineTo(farX, farZ);
        s.lineTo(entryFrontX, farZ);
        s.lineTo(entryFrontX, entryFrontZ);

        return s;
    }, [FRAME_THICKNESS, FRAME_DEPTH]);

    const extrudeSettings = { depth: SHELF_THICKNESS, bevelEnabled: false };
    const shelfTopY = FRAME_THICKNESS / 2;
    const shelfBottomY = (FRAME_THICKNESS / 2) - SHELF_THICKNESS;

    const baseColor = getShelfColor(color);
    const edgeColor = getEdgeColor(color);
    const matProps = usePartMaterial(baseColor, 'shelf', isQuotationOpen, COLORS.HIGHLIGHT.shelf_corner);

    if (isGhost) {
        return (
            <group position={[position[0], position[1], position[2]]} rotation={rotation}>
                 <group position={[0, shelfTopY, 0]}>
                     <mesh rotation={[Math.PI / 2, 0, 0]}>
                        <extrudeGeometry args={[shelfShape, extrudeSettings]} />
                        <meshBasicMaterial color="#facc15" transparent opacity={0.4} />
                    </mesh>
                 </group>
                 <HitBox args={[60, 20, 60]} position={[30, 0, 15]} />
            </group>
        );
    }

    if (isTopView) {
        return (
            <group position={[position[0], position[1], position[2]]} rotation={rotation}>
                 <group position={[0, shelfTopY, 0]}>
                     <mesh rotation={[Math.PI / 2, 0, 0]}>
                        <extrudeGeometry args={[shelfShape, extrudeSettings]} />
                        <meshBasicMaterial color="#ffffff" />
                        <Edges color="black" threshold={15} />
                    </mesh>
                 </group>
            </group>
        )
    }

    return (
        <group position={[position[0], position[1], position[2]]} rotation={rotation}>
             <group position={[0, shelfTopY, 0]}>
                 <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
                    <extrudeGeometry args={[shelfShape, extrudeSettings]} />
                    <meshStandardMaterial {...matProps} transparent={opacity < 1} opacity={opacity} />
                    {!isQuotationOpen && <Edges color={edgeColor} threshold={45} />}
                </mesh>
             </group>
             
             {/* Brackets */}
             <group position={[1.25, shelfBottomY, -8.75]} rotation={[0, Math.PI, 0]}><SaddleBracket type="left" isQuotationOpen={isQuotationOpen} shelfHighlightColor={COLORS.HIGHLIGHT.shelf_corner} shelfColor={color} /></group>
             <group position={[1.25, shelfBottomY, 8.75]} rotation={[0, Math.PI, 0]}><SaddleBracket type={isQuotationOpen ? "left" : "right"} isQuotationOpen={isQuotationOpen} shelfHighlightColor={COLORS.HIGHLIGHT.shelf_corner} shelfColor={color} /></group>
             
             <group position={[37.5, shelfBottomY, 44.9]} rotation={[0, -Math.PI/2, 0]}><SaddleBracket type="left" isQuotationOpen={isQuotationOpen} shelfHighlightColor={COLORS.HIGHLIGHT.shelf_corner} shelfColor={color} /></group>
             <group position={[55.0, shelfBottomY, 44.9]} rotation={[0, -Math.PI/2, 0]}><SaddleBracket type="left" isQuotationOpen={isQuotationOpen} shelfHighlightColor={COLORS.HIGHLIGHT.shelf_corner} shelfColor={color} /></group>
             
             <HitBox args={[60, 15, 60]} position={[30, 0, 15]} />
        </group>
    );
};

interface HangerProps extends PartProps {
    position: [number, number, number];
    rotation?: [number, number, number];
    width: number;
    color?: any;
    bayIndex?: number;
    isGhost?: boolean;
    isCorner?: boolean;
}

const HangerBracket: React.FC<{ isQuotationOpen?: boolean }> = ({ isQuotationOpen }) => {
    const { FRAME_THICKNESS } = DIMENSIONS;
    const color = isQuotationOpen ? COLORS.HIGHLIGHT.hanger : "#1a1a1a";
    const STRAP_WIDTH = 2.5; 
    const STRAP_THICK = 0.2; 
    const RUNG_SIZE = FRAME_THICKNESS; 
    const DROP_HEIGHT = 7.75; 
    return (
        <group>
             <mesh position={[RUNG_SIZE/2 + STRAP_THICK/2, -DROP_HEIGHT/2 + 0.5, 0]}>
                 <boxGeometry args={[STRAP_THICK, DROP_HEIGHT + 1, STRAP_WIDTH]} />
                 <meshStandardMaterial color={color} />
             </mesh>
             <mesh position={[0, RUNG_SIZE/2 + STRAP_THICK/2, 0]}>
                 <boxGeometry args={[RUNG_SIZE + STRAP_THICK*2, STRAP_THICK, STRAP_WIDTH]} />
                 <meshStandardMaterial color={color} />
             </mesh>
             <mesh position={[-RUNG_SIZE/2 - STRAP_THICK/2, RUNG_SIZE/2 - 1.0, 0]}>
                 <boxGeometry args={[STRAP_THICK, 2.0, STRAP_WIDTH]} />
                 <meshStandardMaterial color={color} />
             </mesh>
             <mesh position={[RUNG_SIZE/2 + STRAP_THICK + 0.5, -DROP_HEIGHT, 0]} rotation={[0,0,Math.PI/2]}>
                 <cylinderGeometry args={[1.3, 1.3, 1.2, 16]} />
                 <meshStandardMaterial color={color} />
             </mesh>
        </group>
    )
}

const CornerHangerShelfFix: React.FC<{ isQuotationOpen?: boolean }> = ({ isQuotationOpen }) => {
    const color = isQuotationOpen ? COLORS.HIGHLIGHT.hanger : CONNECTOR_COLOR;
    return (
         <group>
             <mesh position={[0, 4, 0]}>
                 <cylinderGeometry args={[0.5, 0.5, 8, 8]} />
                 <meshStandardMaterial color={color} />
             </mesh>
             <mesh position={[0, 0, 0]} rotation={[0,0,Math.PI/2]}>
                 <cylinderGeometry args={[1.3, 1.3, 1.0, 16]} />
                 <meshStandardMaterial color={color} />
             </mesh>
         </group>
    )
}

export const HangerPart: React.FC<HangerProps> = ({ position, rotation=[0,0,0], width, bayIndex, isGhost, isCorner = false, isQuotationOpen = false, isTopView }) => {
  const { FRAME_THICKNESS } = DIMENSIONS;
  const ROD_DIAMETER = 2.1; 
  const dropY = -7.75; 
  const baseColor = "#E0E0E0";
  const matProps: any = usePartMaterial(baseColor, 'hanger', isQuotationOpen, COLORS.HIGHLIGHT.hanger);
  if (!isQuotationOpen) {
      matProps.metalness = 0.9;
      matProps.roughness = 0.2;
  }
  const finalPos: [number, number, number] = [position[0], position[1], position[2]];
  const rodLength = width - 2.5; 

  if (isGhost) {
      return (
        <group position={[finalPos[0], finalPos[1] + dropY, finalPos[2]]} rotation={rotation}>
             {isCorner ? (
                <group position={[52.0/2, 0, 0]}>
                    <HighlightBox width={52.0} depth={ROD_DIAMETER} thickness={ROD_DIAMETER} isRound color="#ef4444" />
                     <HitBox args={[52, 20, 30]} />
                </group>
             ) : (
                <group>
                     <HighlightBox width={rodLength} depth={ROD_DIAMETER} thickness={ROD_DIAMETER} isRound color="#ef4444" />
                     <HitBox args={[rodLength, 20, 30]} />
                </group>
             )}
        </group>
      )
  }

  if (isTopView) {
      if (isCorner) {
          const cornerLen = 60.0; 
          return (
              <group position={[finalPos[0], finalPos[1] + dropY, finalPos[2]]} rotation={rotation}>
                   <mesh position={[cornerLen/2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                      <cylinderGeometry args={[ROD_DIAMETER / 2, ROD_DIAMETER / 2, cornerLen, 32]} />
                      <meshBasicMaterial color="#ffffff" />
                      <Edges color="black" />
                  </mesh>
              </group>
          )
      }
      return (
        <group position={[finalPos[0], finalPos[1] + dropY, finalPos[2]]} rotation={rotation}>
          <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[ROD_DIAMETER / 2, ROD_DIAMETER / 2, rodLength, 32]} />
            <meshBasicMaterial color="#ffffff" />
            <Edges color="black" />
          </mesh>
        </group>
      )
  }
  
  const leftX = -width / 2;
  const rightX = width / 2;
  return (
    <group position={finalPos} rotation={rotation}>
      <mesh position={[0, dropY, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[ROD_DIAMETER / 2, ROD_DIAMETER / 2, rodLength, 32]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
      <group position={[leftX, 0, 0]} rotation={[0, 0, 0]}><HangerBracket isQuotationOpen={isQuotationOpen} /></group>
      <group position={[rightX, 0, 0]} rotation={[0, Math.PI, 0]}><HangerBracket isQuotationOpen={isQuotationOpen} /></group>
      <HitBox args={[rodLength, 25, 30]} position={[0, dropY, 0]} />
    </group>
  );
};

interface XBarProps extends PartProps {
    position: [number, number, number];
    rotation?: [number, number, number];
    width: number;
    height: number;
    customWidth?: number;
    color?: GlobalConfig['frameColor'];
}
const XBarPressedEnd: React.FC<{ color: string }> = ({ color }) => {
    return (
        <group>
            <mesh scale={[1, 0.2, 1]}>
                <cylinderGeometry args={[0.55, 0.55, 3.5, 16]} />
                <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
            </mesh>
             <mesh position={[0, 0.15, 0]} rotation={[0,0,0]}>
                <cylinderGeometry args={[0.3, 0.3, 0.1, 12]} />
                <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} />
            </mesh>
        </group>
    )
}
const CenterRivet: React.FC = () => (
    <mesh position={[0,0,0]} rotation={[Math.PI/2, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.6, 16]} />
        <meshStandardMaterial color="#333" />
    </mesh>
)
export const XBarPart: React.FC<XBarProps> = ({ position, rotation=[0,0,0], width, height, customWidth, isQuotationOpen, isTopView, color: frameColor }) => {
    const barRadius = 0.5; 
    
    // Use Frame Color as base color if provided, else default grey
    const baseColor = frameColor ? getFrameColor(frameColor) : "#888888"; 

    if (isTopView) return null;
    const actualWidth = customWidth || width;
    const hyp = Math.sqrt(actualWidth * actualWidth + height * height);
    const angle = Math.atan2(height, actualWidth);
    
    const color = isQuotationOpen ? COLORS.HIGHLIGHT.xbar : baseColor;
    const matProps: any = usePartMaterial(color, 'xbar', !!isQuotationOpen, COLORS.HIGHLIGHT.xbar);
    
    if (!isQuotationOpen) {
        matProps.metalness = 0.5;
        matProps.roughness = 0.6;
    }
    const zOffset = 0.25;
    return (
        <group position={position} rotation={rotation}>
            <group position={[0, 0, -zOffset]} rotation={[0, 0, -angle]}>
                <mesh rotation={[0, 0, Math.PI/2]}>
                     <cylinderGeometry args={[barRadius, barRadius, hyp - 2, 12]} />
                     <meshStandardMaterial {...matProps} />
                </mesh>
                <group position={[-(hyp/2), 0, 0]} rotation={[0, 0, Math.PI/2]}><XBarPressedEnd color={color} /></group>
                <group position={[(hyp/2), 0, 0]} rotation={[0, 0, Math.PI/2]}><XBarPressedEnd color={color} /></group>
            </group>
            <group position={[0, 0, zOffset]} rotation={[0, 0, angle]}>
                <mesh rotation={[0, 0, Math.PI/2]}>
                     <cylinderGeometry args={[barRadius, barRadius, hyp - 2, 12]} />
                     <meshStandardMaterial {...matProps} />
                </mesh>
                <group position={[-(hyp/2), 0, 0]} rotation={[0, 0, Math.PI/2]}><XBarPressedEnd color={color} /></group>
                <group position={[(hyp/2), 0, 0]} rotation={[0, 0, Math.PI/2]}><XBarPressedEnd color={color} /></group>
            </group>
            <CenterRivet />
        </group>
    )
}

// ... DrawerPart, FabricDrawerPart, CabinetPart omitted for brevity (unchanged) ...
// Re-exporting DrawerPart, FabricDrawerPart, CabinetPart to ensure file integrity
interface DrawerProps extends PartProps {
    position: [number, number, number];
    rotation?: [number, number, number];
    width: number;
    color?: GlobalConfig['shelfColor'];
    isGhost?: boolean;
    opacity?: number;
    isInteractable?: boolean;
}

export const DrawerPart: React.FC<DrawerProps> = ({ position, rotation = [0,0,0], width, color, isGhost = false, opacity = 1, isQuotationOpen = false, isTopView, isInteractable = false }) => {
    const DRAWER_W = 80.0;
    const DRAWER_D = 32.0;
    const DRAWER_H = 43.7;
    const { FRAME_THICKNESS } = DIMENSIONS;
    const shelfTopY = (FRAME_THICKNESS / 2);
    const drawerCenterY = shelfTopY + (DRAWER_H / 2);
    const drawerCenterZ = 1.0;

    const baseColor = color ? getShelfColor(color) : "#8B5A2B";
    const edgeColor = color ? getEdgeColor(color) : "#444444";
    const matProps = usePartMaterial(baseColor, 'drawer', isQuotationOpen, COLORS.HIGHLIGHT.drawer);

    const [isOpen, setIsOpen] = useState(false);
    const bottomDrawerRef = useRef<THREE.Group>(null);

    useFrame((state, delta) => {
        if (!bottomDrawerRef.current) return;
        const targetZ = isOpen ? 20 : 0;
        bottomDrawerRef.current.position.z = THREE.MathUtils.damp(bottomDrawerRef.current.position.z, targetZ, 4, delta);
    });

    const handleClick = (e: any) => {
        if (isInteractable) {
            e.stopPropagation();
            setIsOpen(!isOpen);
        }
    };

    if (isGhost) {
        return (
            <group position={[position[0], position[1] + drawerCenterY, position[2] + drawerCenterZ]} rotation={rotation}>
                <HighlightBox width={DRAWER_W} depth={DRAWER_D} thickness={DRAWER_H} color="#f97316" />
                <HitBox args={[width, DRAWER_H, DRAWER_D]} />
            </group>
        )
    }

    if (isTopView) {
        return (
            <group position={[position[0], position[1], position[2]]} rotation={rotation}>
                <mesh position={[0, drawerCenterY, drawerCenterZ]}>
                    <boxGeometry args={[DRAWER_W, DRAWER_H, DRAWER_D]} />
                    <meshBasicMaterial color="#ffffff" />
                    <Edges color="black" threshold={15} />
                </mesh>
            </group>
        )
    }

    const drawerBodyH = DRAWER_H - 0.5; 
    return (
        <group position={[position[0], position[1], position[2]]} rotation={rotation} onClick={handleClick}>
            <group position={[0, drawerCenterY, drawerCenterZ]}>
                <mesh castShadow receiveShadow>
                    <boxGeometry args={[DRAWER_W - 0.2, drawerBodyH, DRAWER_D - 0.1]} />
                    <meshStandardMaterial {...matProps} />
                    {!isQuotationOpen && <Edges color={edgeColor} threshold={45} />}
                </mesh>
                <mesh position={[0, drawerBodyH/4, DRAWER_D/2 + 0.15]} castShadow>
                     <boxGeometry args={[DRAWER_W - 0.4, drawerBodyH/2 - 0.2, 0.2]} />
                     <meshStandardMaterial {...matProps} />
                     {!isQuotationOpen && <Edges color="#555" threshold={15} />} 
                </mesh>
                <mesh position={[0, drawerBodyH/4, DRAWER_D/2 + 0.35]} rotation={[Math.PI/2, 0, 0]}>
                    <cylinderGeometry args={[1.5, 1.5, 0.5, 32]} />
                    <meshStandardMaterial color="#222" />
                </mesh>
                <group ref={bottomDrawerRef}>
                    <mesh position={[0, -drawerBodyH/4, DRAWER_D/2 + 0.15]} castShadow>
                        <boxGeometry args={[DRAWER_W - 0.4, drawerBodyH/2 - 0.2, 0.2]} />
                        <meshStandardMaterial {...matProps} />
                        {!isQuotationOpen && <Edges color="#555" threshold={15} />}
                    </mesh>
                    <mesh position={[0, -drawerBodyH/4, DRAWER_D/2 + 0.35]} rotation={[Math.PI/2, 0, 0]}>
                        <cylinderGeometry args={[1.5, 1.5, 0.5, 32]} />
                        <meshStandardMaterial color="#222" />
                    </mesh>
                    <mesh position={[0, -drawerBodyH/4, DRAWER_D/2 - 15]} castShadow>
                         <boxGeometry args={[DRAWER_W - 2, drawerBodyH/2 - 2, 28]} />
                         <meshStandardMaterial color="#e5e5e5" />
                    </mesh>
                </group>
            </group>
            <HitBox args={[DRAWER_W, DRAWER_H, DRAWER_D]} position={[0, drawerCenterY, drawerCenterZ]} />
        </group>
    )
}

export const FabricDrawerPart: React.FC<DrawerProps> = ({ position, rotation = [0,0,0], width, isGhost = false, opacity = 1, isQuotationOpen = false, isTopView, isInteractable = false }) => {
    const { FRAME_THICKNESS } = DIMENSIONS;
    const is800 = width > 70;
    const innerWidth = width - 2.5;
    const DRAWER_D = 31.0;
    const DRAWER_H = 43.7; 
    const shelfTopY = (FRAME_THICKNESS / 2);
    const drawerCenterY = shelfTopY + (DRAWER_H / 2);

    const baseColor = COLORS.HIGHLIGHT.fabric_drawer; 
    const matProps = usePartMaterial(baseColor, 'fabric_drawer', isQuotationOpen, COLORS.HIGHLIGHT.fabric_drawer);
    if(!isQuotationOpen) {
        // @ts-ignore
        matProps.roughness = 0.9;
        // @ts-ignore
        matProps.metalness = 0.1;
    }

    const [isOpen, setIsOpen] = useState(false);
    const bottomRowRef = useRef<THREE.Group>(null);

    useFrame((state, delta) => {
        if (!bottomRowRef.current) return;
        const targetZ = isOpen ? 20 : 0;
        bottomRowRef.current.position.z = THREE.MathUtils.damp(bottomRowRef.current.position.z, targetZ, 4, delta);
    });

    const handleClick = (e: any) => {
        if (isInteractable) {
            e.stopPropagation();
            setIsOpen(!isOpen);
        }
    };

    if (isGhost) {
        return (
            <group position={[position[0], position[1] + drawerCenterY, position[2]]} rotation={rotation}>
                <HighlightBox width={innerWidth} depth={DRAWER_D} thickness={DRAWER_H} color="#64748b" />
            </group>
        )
    }

    if (isTopView) {
        return (
            <group position={[position[0], position[1], position[2]]} rotation={rotation}>
                 <mesh position={[0, drawerCenterY, 0]}>
                    <boxGeometry args={[innerWidth, DRAWER_H, DRAWER_D]} />
                    <meshBasicMaterial color="#e2e8f0" />
                    <Edges color="black" threshold={15} />
                </mesh>
            </group>
        )
    }

    const rows = 2;
    const cols = is800 ? 2 : 1;
    const boxH = (DRAWER_H - 0.5) / rows;
    const boxW = (innerWidth - 0.5) / cols;
    const staticBoxes = [];
    const animatedBoxes = [];
    
    for(let r=0; r<rows; r++) {
        for(let c=0; c<cols; c++) {
            const x = (c - (cols-1)/2) * boxW;
            const y = (r - (rows-1)/2) * boxH; 
            
            const boxGroup = (
                <group key={`${r}-${c}`} position={[x, y, 0]}>
                    <mesh castShadow receiveShadow>
                        <boxGeometry args={[boxW - 0.4, boxH - 0.4, DRAWER_D]} />
                        <meshStandardMaterial {...matProps} color="#94a3b8" /> 
                        {!isQuotationOpen && <Edges color="#475569" threshold={15} />} 
                    </mesh>
                    <mesh position={[0, 0, DRAWER_D/2 + 0.2]} rotation={[Math.PI/2, 0, 0]}>
                        <torusGeometry args={[1.5, 0.15, 8, 16]} />
                        <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} /> 
                    </mesh>
                    <mesh position={[0, 0, DRAWER_D/2 + 0.05]} rotation={[Math.PI/2, 0, 0]}>
                        <circleGeometry args={[1.2, 16]} />
                        <meshBasicMaterial color="#334155" /> 
                    </mesh>
                </group>
            );

            if (r === 0) {
                animatedBoxes.push(boxGroup);
            } else {
                staticBoxes.push(boxGroup);
            }
        }
    }

    return (
        <group position={[position[0], position[1], position[2]]} rotation={rotation} onClick={handleClick}>
            <group position={[0, drawerCenterY, 0]}>
               {staticBoxes}
               <group ref={bottomRowRef}>
                   {animatedBoxes}
               </group>
            </group>
            <HitBox args={[innerWidth, DRAWER_H, DRAWER_D]} position={[0, drawerCenterY, 0]} />
        </group>
    );
}

interface CabinetProps extends PartProps {
    position: [number, number, number];
    rotation?: [number, number, number];
    width: number;
    color: GlobalConfig['shelfColor'];
    isGhost?: boolean;
    hasDoor?: boolean;
    opacity?: number;
    isInteractable?: boolean;
}

export const CabinetPart: React.FC<CabinetProps> = ({ position, rotation = [0,0,0], width, color, isGhost = false, hasDoor = false, opacity = 1, isQuotationOpen = false, isTopView, isInteractable = false }) => {
    const CAB_W = 80.0;
    const CAB_H = 80.0; 
    const CAB_D_OPEN = 30.0;
    const CAB_D_DOOR = 32.0; 
    const BOARD_THICK = 1.8; 
    const finalY = CAB_H / 2;
    const baseColor = getShelfColor(color);
    const edgeColor = getEdgeColor(color);
    const matProps = usePartMaterial(baseColor, 'cabinet', isQuotationOpen, COLORS.HIGHLIGHT.cabinet);
    const finalPos: [number, number, number] = [position[0], finalY, 0];
    const [isOpen, setIsOpen] = useState(false);
    const rightDoorGroupRef = useRef<THREE.Group>(null);
    const leftDoorGroupRef = useRef<THREE.Group>(null);

    useFrame((state, delta) => {
        const targetRot = isOpen ? Math.PI / 4 : 0;
        if (rightDoorGroupRef.current) rightDoorGroupRef.current.rotation.y = THREE.MathUtils.damp(rightDoorGroupRef.current.rotation.y, targetRot, 4, delta);
        if (leftDoorGroupRef.current) leftDoorGroupRef.current.rotation.y = THREE.MathUtils.damp(leftDoorGroupRef.current.rotation.y, -targetRot, 4, delta);
    });

    const handleDoorClick = (e: any) => {
        if (isInteractable && hasDoor) {
            e.stopPropagation();
            setIsOpen(!isOpen);
        }
    }

    if (isGhost) {
        return (
            <group position={finalPos} rotation={rotation}>
                <HighlightBox width={CAB_W + 2} depth={hasDoor ? CAB_D_DOOR + 2 : CAB_D_OPEN + 2} thickness={CAB_H + 2} color="#10b981" />
                <HitBox args={[CAB_W, CAB_H, 40]} />
            </group>
        )
    }

    if (isTopView) {
        const currentDepth = hasDoor ? CAB_D_DOOR : CAB_D_OPEN;
        return (
            <group position={finalPos} rotation={rotation}>
                <mesh>
                    <boxGeometry args={[CAB_W, CAB_H, currentDepth]} />
                    <meshBasicMaterial color="#ffffff" />
                    <Edges color="black" threshold={15} />
                </mesh>
            </group>
        )
    }

    return (
        <group position={finalPos} rotation={rotation} onClick={handleDoorClick}>
            <mesh position={[0, 0, -CAB_D_OPEN/2 + BOARD_THICK/2]} castShadow receiveShadow>
                <boxGeometry args={[CAB_W, CAB_H, BOARD_THICK]} />
                <meshStandardMaterial {...matProps} />
                {!isQuotationOpen && <Edges color={edgeColor} threshold={45} />}
            </mesh>
            <mesh position={[-CAB_W/2 + BOARD_THICK/2, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[BOARD_THICK, CAB_H, CAB_D_OPEN]} />
                <meshStandardMaterial {...matProps} />
                {!isQuotationOpen && <Edges color={edgeColor} threshold={45} />}
            </mesh>
            <mesh position={[CAB_W/2 - BOARD_THICK/2, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[BOARD_THICK, CAB_H, CAB_D_OPEN]} />
                <meshStandardMaterial {...matProps} />
                {!isQuotationOpen && <Edges color={edgeColor} threshold={45} />}
            </mesh>
            <mesh position={[0, CAB_H/2 - BOARD_THICK/2, 0]} castShadow receiveShadow>
                <boxGeometry args={[CAB_W - (BOARD_THICK*2), BOARD_THICK, CAB_D_OPEN]} />
                <meshStandardMaterial {...matProps} />
                {!isQuotationOpen && <Edges color={edgeColor} threshold={45} />}
            </mesh>
            <mesh position={[0, -CAB_H/2 + BOARD_THICK/2, 0]} castShadow receiveShadow>
                <boxGeometry args={[CAB_W - (BOARD_THICK*2), BOARD_THICK, CAB_D_OPEN]} />
                <meshStandardMaterial {...matProps} />
                {!isQuotationOpen && <Edges color={edgeColor} threshold={45} />}
            </mesh>
            <mesh position={[0, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[CAB_W - (BOARD_THICK*2), BOARD_THICK, CAB_D_OPEN - 2]} />
                <meshStandardMaterial {...matProps} />
                {!isQuotationOpen && <Edges color={edgeColor} threshold={45} />}
            </mesh>
            {hasDoor && (
                <group position={[0, 0, CAB_D_OPEN/2 + BOARD_THICK/2]}>
                    <group position={[-CAB_W/2, 0, 0]} ref={leftDoorGroupRef}>
                        <group position={[CAB_W/4 + 0.1, 0, 0]}> 
                            <mesh castShadow receiveShadow>
                                <boxGeometry args={[CAB_W/2 - 0.2, CAB_H, BOARD_THICK]} />
                                <meshStandardMaterial {...matProps} />
                                {!isQuotationOpen && <Edges color={edgeColor} threshold={45} />}
                            </mesh>
                            <mesh position={[CAB_W/4 - 1.0, 5, BOARD_THICK/2 + 0.5]} rotation={[0,0,0]}>
                                <boxGeometry args={[0.8, 12, 1.0]} />
                                <meshStandardMaterial color="#1a1a1a" roughness={0.2} />
                            </mesh>
                        </group>
                    </group>
                    <group position={[CAB_W/2, 0, 0]} ref={rightDoorGroupRef}> 
                        <group position={[-CAB_W/4 - 0.1, 0, 0]}> 
                            <mesh castShadow receiveShadow>
                                <boxGeometry args={[CAB_W/2 - 0.2, CAB_H, BOARD_THICK]} />
                                <meshStandardMaterial {...matProps} />
                                {!isQuotationOpen && <Edges color={edgeColor} threshold={45} />}
                            </mesh>
                            <mesh position={[-CAB_W/4 + 1.0, 5, BOARD_THICK/2 + 0.5]} rotation={[0,0,0]}> 
                                <boxGeometry args={[0.8, 12, 1.0]} />
                                <meshStandardMaterial color="#1a1a1a" roughness={0.2} />
                            </mesh>
                        </group>
                    </group>
                    <mesh position={[0, 0, -0.5]}>
                         <boxGeometry args={[0.2, CAB_H-2, 0.1]} />
                         <meshBasicMaterial color="#111" />
                    </mesh>
                </group>
            )}
            <HitBox args={[CAB_W, CAB_H, CAB_D_DOOR]} />
        </group>
    )
}

interface MirrorProps extends PartProps {
    position: [number, number, number];
    rotation?: [number, number, number];
    width: number;
    color?: GlobalConfig['shelfColor'];
    isGhost?: boolean;
    opacity?: number;
    isInteractable?: boolean;
}

export const MirrorPart: React.FC<MirrorProps> = ({ position, rotation = [0,0,0], width, color, isGhost = false, opacity = 1, isQuotationOpen = false, isTopView, isInteractable = false }) => {
    const { RUNG_LEVELS, BASE_HEIGHT } = DIMENSIONS;
    const MIRROR_W = 40.0;
    
    const topHeight = RUNG_LEVELS[4] + 1.25; 
    const bottomHeight = BASE_HEIGHT;
    const MIRROR_H = topHeight - bottomHeight; 
    
    const MIRROR_THICK = 2.2; 
    const zOffset = 15.0 + (MIRROR_THICK / 2) + 0.5; 
    const yCenter = bottomHeight + MIRROR_H / 2; 

    // Silver Aluminum Color
    const SILVER_COLOR = "#e5e7eb"; // Silver/Light Gray
    const matProps = usePartMaterial(SILVER_COLOR, 'mirror', isQuotationOpen, COLORS.HIGHLIGHT.mirror);
    // Force silver if not in quotation highlight mode
    if (!isQuotationOpen) {
        // @ts-ignore
        matProps.color = SILVER_COLOR;
        // @ts-ignore
        matProps.metalness = 0.8;
        // @ts-ignore
        matProps.roughness = 0.3;
    }

    const [isOpen, setIsOpen] = useState(false);
    const doorGroupRef = useRef<THREE.Group>(null);

    useFrame((state, delta) => {
        if (!doorGroupRef.current) return;
        const targetRot = isOpen ? -70 * (Math.PI / 180) : 0;
        doorGroupRef.current.rotation.y = THREE.MathUtils.damp(doorGroupRef.current.rotation.y, targetRot, 4, delta);
    });

    const handleInteract = (e: any) => {
        if (isInteractable) {
            e.stopPropagation();
            setIsOpen(!isOpen);
        }
    };

    if (isGhost) {
        return (
            <group position={[position[0], yCenter, zOffset]} rotation={rotation}>
                <HighlightBox width={MIRROR_W} depth={MIRROR_THICK} thickness={MIRROR_H} color="#3b82f6" />
                <HitBox args={[MIRROR_W, MIRROR_H, 20]} />
            </group>
        )
    }

    if (isTopView) {
         return (
            <group position={[position[0], 0, zOffset]} rotation={rotation}>
                 <mesh>
                    <boxGeometry args={[MIRROR_W, MIRROR_H, MIRROR_THICK]} />
                    <meshBasicMaterial color="#a5f3fc" />
                    <Edges color="blue" />
                </mesh>
            </group>
         )
    }

    return (
        <group position={[position[0], yCenter, zOffset]} rotation={rotation} onClick={handleInteract}>
            <group position={[-MIRROR_W/2, 0, 0]} ref={doorGroupRef}>
                <group position={[MIRROR_W/2, 0, 0]}>
                    <mesh castShadow receiveShadow>
                        <boxGeometry args={[MIRROR_W, MIRROR_H, MIRROR_THICK]} />
                        <meshStandardMaterial {...matProps} />
                        {!isQuotationOpen && <Edges color="#999" threshold={45} />}
                    </mesh>
                    <mesh position={[0, 0, MIRROR_THICK/2 + 0.15]} castShadow>
                        <boxGeometry args={[MIRROR_W - 4, MIRROR_H - 4, 0.1]} />
                        <meshStandardMaterial 
                            color="#ffffff" 
                            metalness={0.9} 
                            roughness={0.1} 
                            envMapIntensity={1.5}
                        />
                    </mesh>
                    <mesh position={[MIRROR_W/2 - 4, 0, MIRROR_THICK/2 + 1]} castShadow>
                        <boxGeometry args={[0.5, 10, 1.5]} />
                        <meshStandardMaterial color={isQuotationOpen ? COLORS.HIGHLIGHT.mirror : "#d1d5db"} />
                    </mesh>
                </group>
            </group>
            <group position={[-MIRROR_W/2 - 0.2, 0, -0.5]}>
                <mesh position={[0, MIRROR_H/2 - 20, 0]}>
                     <cylinderGeometry args={[0.6, 0.6, 4, 8]} />
                     <meshStandardMaterial color="#888" />
                </mesh>
                <mesh position={[0, 0, 0]}>
                     <cylinderGeometry args={[0.6, 0.6, 4, 8]} />
                     <meshStandardMaterial color="#888" />
                </mesh>
                <mesh position={[0, -MIRROR_H/2 + 20, 0]}>
                     <cylinderGeometry args={[0.6, 0.6, 4, 8]} />
                     <meshStandardMaterial color="#888" />
                </mesh>
            </group>
             <HitBox args={[MIRROR_W, MIRROR_H, 10]} />
        </group>
    )
}

interface CurtainProps extends PartProps {
    position: [number, number, number];
    rotation?: [number, number, number];
    width: number;
    height: number;
    isGhost?: boolean;
    opacity?: number;
    isInteractable?: boolean;
}
export const CurtainPart: React.FC<CurtainProps> = ({ position, rotation = [0,0,0], width, height, isGhost = false, isInteractable = false, isQuotationOpen = false, isTopView }) => {
    // Curtain hangs from top. Position is usually passed as top level y.
    const ROD_D = 2.5;
    const yTop = position[1]; 
    
    // Front position: 3cm from shelf face.
    // Shelf Face Z = +15.0 (Half depth of 30).
    // Target Z = 15.0 + 3.0 = 18.0 (3cm gap)
    const curtainZ = 18.0;

    // Generate Pleated Shape in X-Z plane (top view)
    const fabricShape = useMemo(() => {
        const s = new THREE.Shape();
        const segments = 20; 
        const amplitude = 1.5; 
        // Wavy line along X
        s.moveTo(-width/2, 0);
        for(let i=0; i <= segments; i++) {
            const x = (i / segments) * width - width/2;
            const z = Math.sin((i / segments) * Math.PI * 4) * amplitude;
            s.lineTo(x, z);
        }
        // close shape with thickness
        for(let i=segments; i >= 0; i--) {
            const x = (i / segments) * width - width/2;
            const z = Math.sin((i / segments) * Math.PI * 4) * amplitude + 0.5; // + thickness
            s.lineTo(x, z);
        }
        return s;
    }, [width]);
    
    // Animation: Open means "Bunched" (revealing clothes), Closed means "Spread" (hiding clothes).
    // Default: Bunched (Open view) - TRUE
    const [isBunched, setIsBunched] = useState(true);
    const fabricRef = useRef<THREE.Group>(null);

    useFrame((state, delta) => {
        if (!fabricRef.current) return;
        // If bunched: scale small (0.2), move to side.
        // If spread: scale 1.0, move to center.
        const targetScaleX = isBunched ? 0.2 : 1;
        const targetPosX = isBunched ? -width/2 + (width * 0.2)/2 : 0;
        
        fabricRef.current.scale.x = THREE.MathUtils.damp(fabricRef.current.scale.x, targetScaleX, 4, delta);
        fabricRef.current.position.x = THREE.MathUtils.damp(fabricRef.current.position.x, targetPosX, 4, delta);
    });

    const handleClick = (e: any) => {
        if (isInteractable) {
            e.stopPropagation();
            setIsBunched(!isBunched);
        }
    }

    const matProps = usePartMaterial("#ffffff", 'curtain', isQuotationOpen, COLORS.HIGHLIGHT.curtain);
    // Add texture or color if not quotation
    if (!isQuotationOpen) {
        // @ts-ignore
        matProps.color = "#e5e7eb"; // Gray-200 for generic fabric
    }

    if (isGhost) {
         return (
           <group position={[position[0], yTop - height/2, position[2] + curtainZ]} rotation={rotation}>
               <HighlightBox width={width} depth={5} thickness={height} color="#a855f7" />
           </group>
       )
    }
    
    if (isTopView) {
        return (
             <group position={[position[0], position[1], position[2]]} rotation={rotation}>
                <mesh position={[0, yTop, curtainZ]} rotation={[0,0,Math.PI/2]}>
                    <cylinderGeometry args={[ROD_D/2, ROD_D/2, width, 16]} />
                    <meshBasicMaterial color="#ffffff" />
                    <Edges color="black" />
                </mesh>
             </group>
        )
    }

    return (
        <group position={[position[0], 0, position[2]]} rotation={rotation} onClick={handleClick}>
             {/* Rod */}
             <mesh position={[0, yTop, curtainZ]} rotation={[0,0,Math.PI/2]} castShadow>
                 <cylinderGeometry args={[ROD_D/2, ROD_D/2, width, 16]} />
                 <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
             </mesh>
             
             {/* Fabric Group */}
             <group position={[0, 0, curtainZ]} ref={fabricRef}>
                 <mesh position={[0, yTop, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
                     <extrudeGeometry args={[fabricShape, { depth: height, bevelEnabled: false }]} />
                     <meshStandardMaterial {...matProps} side={THREE.DoubleSide} />
                     {!isQuotationOpen && <Edges color="#d1d5db" threshold={30} />}
                 </mesh>
             </group>
        </group>
    )
}