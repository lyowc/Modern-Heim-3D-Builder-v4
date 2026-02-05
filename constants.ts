
// constants.ts

// All units in cm
export const DIMENSIONS = {
  // Frame Specs
  FRAME_METAL_HEIGHT: 204, // 2040mm main metal frame
  FRAME_DEPTH: 30,   // 300mm depth
  FRAME_THICKNESS: 2.5, // 25mm square tube
  
  FOOT_CAP_HEIGHT: 5.0, // 50mm gold cap
  ADJUSTER_HEIGHT: 1.0, // 10mm adjuster (Total = 204 + 5 + 1 = 210cm)
  
  // Total height from floor to bottom of metal frame
  BASE_HEIGHT: 6.0, // 1.0 + 5.0
  
  // Shelf Specs
  SHELF_THICKNESS: 1.8, // 18mm
  SHELF_DEPTH: 30.0, // 300mm (Matches Frame Depth)
  
  BRACKET_THICKNESS: 0.1, // 1mm bracket thickness
  
  // Corner Specs
  // Outer Size: 62.5cm
  // Shelf Plate Size: ~45cm linear + Corner
  CORNER_OUTER_SIZE: 62.5, 
  L_POST_SIZE: 4.0, // 40mm outer width
  L_POST_THICKNESS: 1.0, // 10mm thickness
  
  // Available Bay Widths (Module center-to-center nominal or shelf plate width)
  BAY_WIDTH_1200: 122.5,
  BAY_WIDTH_800: 82.5, 
  BAY_WIDTH_600: 62.5, 
  BAY_WIDTH_400: 42.5, 
  BAY_WIDTH_CORNER: 62.5, // Used as nominal identifier

  // X-Bar Specs
  XBAR_DIAMETER: 1.0, // 10mm round pipe
  
  // Rung Levels (Height from the floor to the CENTER of the rung in cm)
  // Base 6.0 + Rung Positions
  RUNG_LEVELS: [
    6.0 + 5.25,    // Level 0: 11.25 cm
    6.0 + 50.75,   // Level 1: 56.75 cm
    6.0 + 96.25,   // Level 2: 102.25 cm
    6.0 + 131.75,  // Level 3: 137.75 cm
    6.0 + 167.25,  // Level 4: 173.25 cm
    6.0 + 202.75   // Level 5: 208.75 cm (Top Flush)
  ],

  // X-Bar Mounting Heights (Center of the void between rungs)
  XBAR_POSITIONS: [
    (6.0 + 5.25 + 6.0 + 50.75) / 2,     // ~34 cm
    (6.0 + 131.75 + 6.0 + 167.25) / 2   // ~155.5 cm
  ]
};

export const COLORS = {
  FRAME: {
    black: '#1a1a1a',
    white: '#f5f5f5',
  },
  FRAME_ACCENT: {
    gold: '#D4AF37', // For the foot cap
    foot: '#111111'  // Adjuster
  },
  SHELF: {
    acacia: '#543A27', // Much Darker/Deep Brown
    walnut: '#2E221F', // Almost Black/Dark Chocolate
    white: '#ffffff',  // White
  },
  BRACKET: '#1a1a1a', // Black hardware
  HIGHLIGHT: {
      frame: '#3b82f6', // Blue (Ladder Frame)
      lpost: '#06b6d4', // Cyan (Corner Post)
      
      shelf_1200: '#0d9488', // Teal
      shelf_800: '#22c55e', // Green
      shelf_400: '#86efac', // Light Green
      shelf_corner: '#a855f7', // Purple
      
      hanger: '#ef4444', // Red
      xbar: '#eab308', // Yellow
      
      drawer: '#f97316', // Orange for Drawer
      fabric_drawer: '#64748b', // Slate for Fabric Drawer
      cabinet: '#10b981', // Emerald for Cabinet
      mirror: '#3b82f6', // Blue for Mirror
      curtain: '#a855f7', // Purple for Curtain
      
      default: '#9ca3af' // Dimmed gray
  }
};

export const PRICES = {
    FRAME: 55000,
    L_POST: 35000,
    
    SHELF_1200: 38000,
    SHELF_800: 28000,
    SHELF_400: 19000,
    SHELF_CORNER: 42000,
    
    HANGER_1200: 16000,
    HANGER_800: 12000,
    HANGER_400: 9000,
    HANGER_CORNER: 11000,
    
    XBAR_SET_1200: 18000,
    XBAR_SET_800: 15000, 
    XBAR_SET_400: 15000, 
    XBAR_SET_CORNER: 25000,
    
    DRAWER_800: 95000, // 800 Wood Drawer
    
    FABRIC_DRAWER_800: 65000, // 800 Fabric (4-box) - Estimated
    FABRIC_DRAWER_400: 38000,  // 400 Fabric (2-box) - Estimated
    
    CABINET_800_OPEN: 110000,
    CABINET_800_DOOR: 150000,
    
    MIRROR_400: 85000,
    
    CURTAIN_400: 35000, // Estimated Base
    CURTAIN_800: 45000  // Estimated Base
};