// types.ts

export type ItemType = 'shelf' | 'hanger' | 'drawer' | 'fabric_drawer' | 'corner' | 'cabinet_800_open' | 'cabinet_800_door' | 'mirror' | 'curtain_400_1500' | 'curtain_400_2100' | 'curtain_800_1500' | 'curtain_800_2100';

export interface BayItem {
  id: string;
  type: ItemType;
  levelIndex: number; // 0 to 5 (mapping to the 6 Rungs)
}

export type BayType = 'normal' | 'corner';

export interface BayConfig {
  id: string;
  type: BayType;
  width: number; // 80, 60, 40. If corner, usually 60.
  hasXBar: boolean;
  items: BayItem[];
}

export interface GlobalConfig {
  frameColor: 'black' | 'white';
  shelfColor: 'acacia' | 'walnut' | 'white';
  bays: BayConfig[];
}

// Helper to calculate layout positions
export interface LayoutData {
  bay: BayConfig;
  position: [number, number, number];
  rotation: number; // in radians
  entryPoint: [number, number, number];
  exitPoint: [number, number, number];
}