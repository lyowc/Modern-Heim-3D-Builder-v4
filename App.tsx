import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Scene } from './components/Scene';
import { SystemManual } from './components/SystemManual';
import { GlobalConfig, BayConfig, BayItem, BayType } from './types';
import { DIMENSIONS, PRICES, COLORS } from './constants';
import { Trash2, Undo2, Redo2, Maximize, BookOpen, Plus, Receipt, X, Ruler, RotateCcw, Grid, Palette, Box, PackageOpen, DoorOpen, LayoutGrid, Archive, RectangleVertical, Blinds } from 'lucide-react';

// Custom Icons
const IconShelf = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="10" width="18" height="4" rx="1" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2"/>
  </svg>
)

const IconHanger = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4C13.1 4 14 4.9 14 6C14 7.1 13.1 8 12 8H4L12 16L20 8H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 3V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

// Start Empty
const DEFAULT_CONFIG: GlobalConfig = {
  frameColor: 'black',
  shelfColor: 'acacia',
  bays: []
};

const App: React.FC = () => {
  const [history, setHistory] = useState<GlobalConfig[]>([DEFAULT_CONFIG]);
  const [currentStep, setCurrentStep] = useState(0);
  const config = history[currentStep];

  const [selectedBayId, setSelectedBayId] = useState<string | null>(null);
  const [interactionMode, setInteractionMode] = useState<'none' | 'placing_shelf' | 'placing_hanger' | 'placing_drawer' | 'placing_fabric_drawer' | 'placing_cabinet_open' | 'placing_cabinet_door' | 'placing_mirror' | 'placing_curtain_400_1500' | 'placing_curtain_400_2100' | 'placing_curtain_800_1500' | 'placing_curtain_800_2100'>('none');
  
  // Auto-Fit Trigger State
  const [fitTrigger, setFitTrigger] = useState(0);

  // Manual Modal State
  const [isManualOpen, setIsManualOpen] = useState(false);
  
  // Quotation State
  const [isQuotationOpen, setIsQuotationOpen] = useState(false);
  
  // Color Picker State
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  
  // Option Menu State
  const [isOptionMenuOpen, setIsOptionMenuOpen] = useState(false);

  // Top View & Dimensions State
  const [showTopView, setShowTopView] = useState(true);
  const [showDimensions, setShowDimensions] = useState(false); // Default OFF

  // --- History Helper ---
  const updateConfig = (newConfig: GlobalConfig) => {
    const newHistory = history.slice(0, currentStep + 1);
    newHistory.push(newConfig);
    setHistory(newHistory);
    setCurrentStep(newHistory.length - 1);
  };

  const undo = () => {
    if (currentStep > 0) {
        const prevConfig = history[currentStep - 1];
        setCurrentStep(prev => prev - 1);
        setInteractionMode('none');
        if (selectedBayId && !prevConfig.bays.find(b => b.id === selectedBayId)) {
            setSelectedBayId(null);
        }
    }
  };

  const redo = () => {
    if (currentStep < history.length - 1) {
        setCurrentStep(prev => prev + 1);
        setInteractionMode('none');
        setSelectedBayId(null);
    }
  };

  const resetConfig = () => {
      if (window.confirm("모든 설정을 초기화 하시겠습니까?")) {
          const freshDefault = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
          setHistory([freshDefault]);
          setCurrentStep(0);
          
          setSelectedBayId(null);
          setInteractionMode('none');

          setTimeout(() => {
              setFitTrigger(prev => prev + 1);
          }, 10);
      }
  };

  const handleColorChange = (type: 'frame' | 'shelf', value: string) => {
      const newConfig = { ...config };
      if (type === 'frame') newConfig.frameColor = value as any;
      if (type === 'shelf') newConfig.shelfColor = value as any;
      updateConfig(newConfig);
  };

  const handleBackgroundClick = () => {
      if (interactionMode !== 'none') {
          toggleInteractionMode('none');
      }
      setSelectedBayId(null);
      if (isColorPickerOpen) setIsColorPickerOpen(false);
      // Option menu stays open unless explicitly closed or toggle button clicked, 
      // but logic below might close it if interaction mode clears.
      // Let's keep it open for better UX unless 'Escape' is pressed.
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) redo(); else undo();
      }
      if (e.key === 'Escape') {
          if (isManualOpen) setIsManualOpen(false);
          else if (isQuotationOpen) {
              setIsQuotationOpen(false);
              setTimeout(() => setFitTrigger(n => n + 1), 100); 
          }
          else if (isColorPickerOpen) setIsColorPickerOpen(false);
          else if (isOptionMenuOpen) {
              setIsOptionMenuOpen(false);
              setInteractionMode('none');
          }
          else {
              if (interactionMode !== 'none') toggleInteractionMode('none');
              setSelectedBayId(null);
          }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, history, isManualOpen, isQuotationOpen, interactionMode, isColorPickerOpen, isOptionMenuOpen]);


  // --- Handlers ---
  
  const toggleQuotation = () => {
      setIsQuotationOpen(prev => !prev);
      // Trigger fit so camera can adjust if quotation panel pushes model
      setTimeout(() => setFitTrigger(n => n + 1), 10);
  };

  const toggleInteractionMode = (mode: any) => {
      // Trigger fit only when STARTING a new placement mode from NONE.
      if (mode !== 'none' && interactionMode === 'none') {
          setFitTrigger(n => n + 1);
      }
      
      if (interactionMode === mode) {
          setInteractionMode('none');
      } else {
          setInteractionMode(mode);
      }
      // Close option menu if switching to shelf/hanger (basic items)
      if (mode === 'placing_shelf' || mode === 'placing_hanger') {
          setIsOptionMenuOpen(false);
      }
  };

  const handleOptionMenuToggle = () => {
      if (isOptionMenuOpen) {
          // Close
          setIsOptionMenuOpen(false);
          // Also clear interaction if it was an option
          if (interactionMode.includes('drawer') || interactionMode.includes('cabinet') || interactionMode.includes('mirror') || interactionMode.includes('curtain')) {
              setInteractionMode('none');
          }
      } else {
          // Open
          // Close other modes when opening option menu
          if (interactionMode === 'placing_shelf' || interactionMode === 'placing_hanger') {
              setInteractionMode('none');
          }
          setIsOptionMenuOpen(true);
      }
  };

  const handleOptionSelect = (mode: any) => {
      setFitTrigger(n => n + 1);
      setInteractionMode(mode);
      // Menu stays open
  };

  const addBay = useCallback((width: number, type: BayType = 'normal') => {
    const defaultLevels = [0, 2, 5];
    const defaultItems: BayItem[] = defaultLevels.map(levelIndex => ({
        id: `item-${Date.now()}-${Math.random()}`,
        type: type === 'corner' ? 'corner' : 'shelf',
        levelIndex
    }));

    const newBay: BayConfig = {
      id: `bay-${Date.now()}`,
      type: type,
      width: width,
      hasXBar: true, 
      items: defaultItems 
    };
    const newConfig = { ...config, bays: [...config.bays, newBay] };
    updateConfig(newConfig);
    setSelectedBayId(newBay.id);
    setInteractionMode('none');
    setFitTrigger(n => n + 1); 
  }, [config, currentStep]);

  const removeBay = useCallback((bayId: string) => {
    const remaining = config.bays.filter(b => b.id !== bayId);
    const newConfig = { ...config, bays: remaining };
    updateConfig(newConfig);
    if (selectedBayId === bayId) {
        setSelectedBayId(remaining.length > 0 ? remaining[remaining.length - 1].id : null);
    }
    setInteractionMode('none');
    setFitTrigger(n => n + 1); 
  }, [config, selectedBayId]);

  const handleItemPlace = useCallback((bayId: string, levelIndex: number) => {
      if (interactionMode === 'none') return;
      
      const targetBay = config.bays.find(b => b.id === bayId);
      if (!targetBay) return;

      // --- Validation Checks ---
      if (interactionMode === 'placing_hanger') {
          if (levelIndex === 0) {
              alert("최하단에는 행거를 설치할 수 없습니다.");
              return;
          }
          if (targetBay.type === 'corner') {
              const hasShelf = targetBay.items.some(i => i.levelIndex === levelIndex && i.type === 'corner');
              if (!hasShelf) {
                  alert("코너 행거는 선반이 설치된 층에만 설치할 수 있습니다.");
                  return;
              }
          }
          // Conflict Check
          const hasStorageAtLevel = targetBay.items.some(i => i.levelIndex === levelIndex && (i.type.includes('drawer') || i.type.includes('cabinet')));
          const hasTallCabinet = targetBay.items.some(i => i.levelIndex === 0 && (i.type === 'cabinet_800_open' || i.type === 'cabinet_800_door'));
          
          if (hasStorageAtLevel || (levelIndex === 1 && hasTallCabinet)) {
              alert("서랍장 또는 수납장이 설치된 위치에는 행거봉을 설치할 수 없습니다.");
              return;
          }
      }

      if (interactionMode === 'placing_drawer') {
          const is800 = targetBay.width > 80 && targetBay.width < 90;
          if (!is800) { 
             alert("800mm 목재 서랍장은 800폭 모듈에만 설치할 수 있습니다.");
             return;
          }
          if (levelIndex > 1) {
              alert("서랍장은 하단 1, 2단에만 설치할 수 있습니다.");
              return;
          }
      }
      if (interactionMode === 'placing_fabric_drawer') {
          const is800 = targetBay.width > 80 && targetBay.width < 90;
          const is400 = targetBay.width > 40 && targetBay.width < 50;
          if (!is800 && !is400) {
              alert("패브릭 서랍장은 400 또는 800 모듈에만 설치 가능합니다. (1200 불가)");
              return;
          }
          if (targetBay.type === 'corner') {
              alert("코너 모듈에는 서랍장을 설치할 수 없습니다.");
              return;
          }
           if (levelIndex > 1) {
              alert("서랍장은 하단 1, 2단에만 설치할 수 있습니다.");
              return;
          }
      }
      if (interactionMode === 'placing_cabinet_open' || interactionMode === 'placing_cabinet_door') {
          const is800 = targetBay.width > 80 && targetBay.width < 90;
          if (!is800) {
              alert("수납장은 800mm 모듈에만 설치할 수 있습니다.");
              return;
          }
          if (levelIndex !== 0) {
              alert("수납장은 바닥(최하단)에만 설치할 수 있습니다.");
              return;
          }
          if (targetBay.type === 'corner') {
              alert("코너 모듈에는 수납장을 설치할 수 없습니다.");
              return;
          }
      }
      if (interactionMode === 'placing_mirror') {
          const is400 = targetBay.width > 40 && targetBay.width < 50;
          if (!is400) {
              alert("전신 거울은 400mm 모듈에만 설치할 수 있습니다.");
              return;
          }
          if (targetBay.type === 'corner') {
              alert("코너 모듈에는 거울을 설치할 수 없습니다.");
              return;
          }
      }
      if (interactionMode.startsWith('placing_curtain')) {
          if (targetBay.type === 'corner') {
              alert("코너 모듈에는 커튼을 설치할 수 없습니다.");
              return;
          }
          // Check for Mirror
          const hasMirror = targetBay.items.some(i => i.type === 'mirror');
          if (hasMirror) {
              alert("전신 거울이 설치된 곳에는 커튼을 설치할 수 없습니다.");
              return;
          }
          
          const is400Bay = targetBay.width > 40 && targetBay.width < 50;
          const is800Bay = targetBay.width > 80 && targetBay.width < 90;
          const is1200Bay = targetBay.width > 100;
          
          if (interactionMode.includes('400')) {
              // 400 Curtain can ONLY be on 400 Bay.
              // Cannot be on 800 or 1200.
              if (!is400Bay) {
                  alert("400용 커튼봉 세트는 400 모듈에만 설치 가능합니다. (800, 1200 불가)");
                  return;
              }
          } else if (interactionMode.includes('800')) {
              // 800 Curtain can be on 800 or 1200.
              // Cannot be on 400.
              if (is400Bay) {
                  alert("800용 커튼봉 세트는 400 모듈에 설치할 수 없습니다.");
                  return;
              }
              if (!is800Bay && !is1200Bay) {
                  alert("800용 커튼봉 세트는 800 또는 1200 모듈에만 설치 가능합니다.");
                  return;
              }
          }
      }
      
      let targetType: any = 'shelf';
      if (interactionMode === 'placing_shelf') targetType = (targetBay.type === 'corner' ? 'corner' : 'shelf');
      else if (interactionMode === 'placing_hanger') targetType = 'hanger';
      else if (interactionMode === 'placing_drawer') targetType = 'drawer';
      else if (interactionMode === 'placing_fabric_drawer') targetType = 'fabric_drawer';
      else if (interactionMode === 'placing_cabinet_open') targetType = 'cabinet_800_open';
      else if (interactionMode === 'placing_cabinet_door') targetType = 'cabinet_800_door';
      else if (interactionMode === 'placing_mirror') targetType = 'mirror';
      else if (interactionMode.startsWith('placing_curtain')) {
          if (interactionMode === 'placing_curtain_400_1500') targetType = 'curtain_400_1500';
          if (interactionMode === 'placing_curtain_400_2100') targetType = 'curtain_400_2100';
          if (interactionMode === 'placing_curtain_800_1500') targetType = 'curtain_800_1500';
          if (interactionMode === 'placing_curtain_800_2100') targetType = 'curtain_800_2100';
      }
      
      const updatedBays = config.bays.map(b => {
          if (b.id !== bayId) return b;
          
          let newItems = [...b.items];
          
          const existingItem = newItems.find(i => i.levelIndex === levelIndex && i.type === targetType);
          if (existingItem) {
              newItems = newItems.filter(i => i.id !== existingItem.id);
              return { ...b, items: newItems };
          }

          if (targetType === 'drawer' || targetType === 'fabric_drawer') {
              newItems = newItems.filter(i => i.levelIndex !== levelIndex || i.type !== 'hanger');
              if (levelIndex <= 1) { 
                  newItems = newItems.filter(i => i.type !== 'cabinet_800_open' && i.type !== 'cabinet_800_door');
              }
              const conflictingDrawers = newItems.filter(i => i.levelIndex === levelIndex && (i.type === 'drawer' || i.type === 'fabric_drawer'));
              conflictingDrawers.forEach(cd => {
                  newItems = newItems.filter(i => i.id !== cd.id);
              });

          } else if (targetType === 'cabinet_800_open' || targetType === 'cabinet_800_door') {
              newItems = newItems.filter(i => i.levelIndex > 1); 
              
          } else if (targetType === 'mirror') {
              newItems = newItems.filter(i => i.type !== 'mirror');
          } else if (targetType.startsWith('curtain')) {
              newItems = newItems.filter(i => !i.type.startsWith('curtain'));
          } else if (targetType === 'shelf' || targetType === 'corner') {
              const conflictingStorage = newItems.filter(i => i.levelIndex === levelIndex && (i.type.includes('drawer') || i.type.includes('cabinet')));
              if (conflictingStorage.length > 0) {
                  conflictingStorage.forEach(cs => {
                      newItems = newItems.filter(i => i.id !== cs.id);
                  });
              }
          }

          newItems.push({ id: `item-${Date.now()}-${Math.random()}`, type: targetType, levelIndex });

          if (targetType === 'drawer' || targetType === 'fabric_drawer') {
              if (levelIndex > 0) {
                  const hasShelfBelow = newItems.some(i => i.levelIndex === levelIndex && i.type === 'shelf'); 
                  if (!hasShelfBelow) {
                      newItems.push({ id: `item-auto-shelf-b-${Date.now()}`, type: 'shelf', levelIndex: levelIndex });
                  }
              } else {
                  const hasShelfAt0 = newItems.some(i => i.levelIndex === 0 && i.type === 'shelf');
                  if (!hasShelfAt0) {
                       newItems.push({ id: `item-auto-shelf-b-${Date.now()}`, type: 'shelf', levelIndex: 0 });
                  }
              }

              const topLevel = levelIndex + 1; 
              if (topLevel < DIMENSIONS.RUNG_LEVELS.length) {
                  const hasShelfAbove = newItems.some(i => i.levelIndex === topLevel && i.type === 'shelf');
                  if (!hasShelfAbove) {
                      newItems.push({ id: `item-auto-shelf-a-${Date.now()}`, type: 'shelf', levelIndex: topLevel });
                  }
              }
          }

          return { ...b, items: newItems };
      });

      updateConfig({ ...config, bays: updatedBays });
      
  }, [config, interactionMode]);


  const handleBayClick = (id: string) => {
      setSelectedBayId(id);
  };

  // --- BOM Calculation ---
  const bom = useMemo(() => {
      const counts: Record<string, { count: number, price: number, name: string, type: string, width?: number }> = {};
      
      const addCount = (key: string, name: string, price: number, type: string, width?: number) => {
          if (!counts[key]) counts[key] = { count: 0, price, name, type, width };
          counts[key].count++;
      };

      const frameColorName = config.frameColor === 'black' ? '블랙' : '화이트';
      const shelfColorName = config.shelfColor === 'acacia' ? '아카시아' : (config.shelfColor === 'walnut' ? '월넛' : '화이트');

      let mirrorCount = 0;
      config.bays.forEach(bay => {
          if (bay.items.some(i => i.type === 'mirror')) {
              mirrorCount++;
          }
      });

      let standardFrameCount = config.bays.length + 1;
      if (mirrorCount > 0) {
          standardFrameCount -= mirrorCount;
          addCount('frame_mirror', `사다리형 프레임 (거울부착용) [${frameColorName}]`, PRICES.FRAME, 'frame');
          counts['frame_mirror'].count = mirrorCount;
      }

      if (standardFrameCount > 0) {
          addCount('frame', `사다리형 프레임 (2040) [${frameColorName}]`, PRICES.FRAME, 'frame');
          counts['frame'].count = standardFrameCount; 
      }

      config.bays.forEach(bay => {
          if (bay.type === 'corner') {
              addCount('lpost', `L-포스트 (코너 기둥) [${frameColorName}]`, PRICES.L_POST, 'lpost');
          }

          if (bay.hasXBar) {
              if (bay.type === 'corner') {
                   addCount('xbar-corner', 'X-바 세트 (코너용)', PRICES.XBAR_SET_CORNER, 'xbar', 59);
              } else if (bay.width > 100) {
                   addCount('xbar-1200', 'X-바 세트 (1200용)', PRICES.XBAR_SET_1200, 'xbar', 120);
              } else if (bay.width > 60) {
                   addCount('xbar-800', 'X-바 세트 (800용)', PRICES.XBAR_SET_800, 'xbar', 80);
              } else {
                   addCount('xbar-400', 'X-바 세트 (400용)', PRICES.XBAR_SET_400, 'xbar', 40);
              }
          }

          bay.items.forEach(item => {
              if (item.type === 'shelf') {
                  if (bay.width > 100) addCount('shelf-1200', `선반 (1200) [${shelfColorName}]`, PRICES.SHELF_1200, 'shelf', 120);
                  else if (bay.width > 60) addCount('shelf-800', `선반 (800) [${shelfColorName}]`, PRICES.SHELF_800, 'shelf', 80);
                  else addCount('shelf-400', `선반 (400) [${shelfColorName}]`, PRICES.SHELF_400, 'shelf', 40);
              } else if (item.type === 'corner') {
                  addCount('shelf-corner', `코너 선반 (600) [${shelfColorName}]`, PRICES.SHELF_CORNER, 'shelf', 59);
              } else if (item.type === 'hanger') {
                   if (bay.type === 'corner') addCount('hanger-corner', '행거봉 (코너용)', PRICES.HANGER_CORNER, 'hanger', 59);
                   else if (bay.width > 100) addCount('hanger-1200', '행거봉 (1200용)', PRICES.HANGER_1200, 'hanger', 120);
                   else if (bay.width > 60) addCount('hanger-800', '행거봉 (800용)', PRICES.HANGER_800, 'hanger', 80);
                   else addCount('hanger-400', '행거봉 (400용)', PRICES.HANGER_400, 'hanger', 40);
              } else if (item.type === 'drawer') {
                   addCount('drawer-800', `2단 서랍장 (800) [${shelfColorName}]`, PRICES.DRAWER_800, 'drawer', 80);
              } else if (item.type === 'fabric_drawer') {
                  if (bay.width > 60) {
                      addCount('fabric-drawer-800', `패브릭 서랍장 4칸 (800) [그레이]`, PRICES.FABRIC_DRAWER_800, 'fabric_drawer', 80);
                  } else {
                      addCount('fabric-drawer-400', `패브릭 서랍장 2칸 (400) [그레이]`, PRICES.FABRIC_DRAWER_400, 'fabric_drawer', 40);
                  }
              } else if (item.type === 'cabinet_800_open') {
                  addCount('cabinet_open', `800 오픈 수납장 [${shelfColorName}]`, PRICES.CABINET_800_OPEN, 'cabinet', 80);
              } else if (item.type === 'cabinet_800_door') {
                  addCount('cabinet_door', `800 도어 수납장 [${shelfColorName}]`, PRICES.CABINET_800_DOOR, 'cabinet', 80);
              } else if (item.type === 'mirror') {
                  addCount('mirror_400', `400 전신 거울 도어 [${shelfColorName}]`, PRICES.MIRROR_400, 'mirror', 40);
              } else if (item.type.startsWith('curtain')) {
                  if (item.type.includes('400')) {
                      addCount(item.type, `커튼봉 세트 400용 (${item.type.includes('2100') ? '2100' : '1500'})`, PRICES.CURTAIN_400, 'curtain', 40);
                  } else {
                      addCount(item.type, `커튼봉 세트 800용 (${item.type.includes('2100') ? '2100' : '1500'})`, PRICES.CURTAIN_800, 'curtain', 80);
                  }
              }
          });
      });

      const items = Object.values(counts);
      const subtotal = items.reduce((sum, item) => sum + (item.count * item.price), 0);
      const vat = subtotal * 0.1;
      const shipping = subtotal * 0.1;
      const total = subtotal + vat + shipping;

      return { items, subtotal, vat, shipping, total };
  }, [config]);

  // Reusable Modules Group
  const ModuleControls = ({ isMobile = false }) => (
    <div className={`bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-lg border border-white/50 flex flex-wrap items-center gap-2 ${isMobile ? 'justify-center w-full' : ''}`}>
        <button onClick={() => addBay(DIMENSIONS.BAY_WIDTH_400, 'normal')} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 flex items-center gap-2 font-medium text-sm transition-transform active:scale-95" title="400mm 모듈 추가">
            <Plus size={16} /> 400
        </button>
        <button onClick={() => addBay(DIMENSIONS.BAY_WIDTH_800, 'normal')} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 flex items-center gap-2 font-medium text-sm transition-transform active:scale-95" title="800mm 모듈 추가">
            <Plus size={16} /> 800
        </button>
        <button onClick={() => addBay(DIMENSIONS.BAY_WIDTH_1200, 'normal')} className="px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 flex items-center gap-2 font-medium text-sm transition-transform active:scale-95" title="1200mm 모듈 추가">
            <Plus size={16} /> 1200
        </button>
        <button onClick={() => addBay(DIMENSIONS.BAY_WIDTH_CORNER, 'corner')} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 flex items-center gap-2 font-medium text-sm transition-transform active:scale-95" title="코너(Corner) 추가">
            <Plus size={16} /> 코너
        </button>
    </div>
  );

  // Reusable Item Controls
  const ItemControls = ({ isMobile = false }) => (
    <div className={`bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-lg border border-white/50 flex items-center gap-2 ${isMobile ? 'justify-center w-full' : ''} relative`}>
        <button 
            onClick={() => toggleInteractionMode('placing_shelf')}
            className={`p-3 rounded-xl transition-all ${interactionMode === 'placing_shelf' ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500' : 'hover:bg-gray-100 text-gray-700'}`}
            title="선반(Shelf) 추가 모드"
        >
            <IconShelf />
        </button>
        <button 
            onClick={() => toggleInteractionMode('placing_hanger')}
            className={`p-3 rounded-xl transition-all ${interactionMode === 'placing_hanger' ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500' : 'hover:bg-gray-100 text-gray-700'}`}
            title="행거(Hanger) 추가 모드"
        >
            <IconHanger />
        </button>
        
        {/* Option Button */}
        <button 
            onClick={handleOptionMenuToggle}
            className={`p-3 rounded-xl transition-all ${isOptionMenuOpen || interactionMode.includes('drawer') || interactionMode.includes('cabinet') || interactionMode.includes('mirror') || interactionMode.includes('curtain') ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500' : 'hover:bg-gray-100 text-gray-700'}`}
            title="옵션(Option) 추가"
        >
            <Box size={24} />
        </button>
        
        {/* On Mobile, Trash is integrated into this row if selected */}
        {isMobile && selectedBayId && (
             <div className="w-px h-8 bg-gray-300 mx-1"></div>
        )}
        {isMobile && selectedBayId && (
            <button 
                onClick={() => removeBay(selectedBayId)}
                className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                title="선택된 모듈 삭제"
            >
                <Trash2 size={20} />
            </button>
        )}
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-gray-100 text-gray-800 font-sans overflow-hidden relative">
      <div className="absolute inset-0 z-0">
        <Scene 
            config={config} 
            previewModelUrl={null} 
            selectedBayId={selectedBayId}
            onBayClick={handleBayClick}
            interactionMode={interactionMode}
            setInteractionMode={(mode) => toggleInteractionMode(mode)}
            onItemPlace={handleItemPlace}
            onAddBay={addBay}
            onRemoveBay={removeBay}
            triggerFit={fitTrigger}
            onBackgroundClick={handleBackgroundClick}
            isQuotationOpen={isQuotationOpen}
            isManualOpen={isManualOpen}
            showDimensions={showDimensions}
            isTopView={false} 
        />
      </div>
      
      {/* ... Headers, Controls, Modals etc ... */}
      <div className="absolute top-0 left-0 w-full p-4 md:p-6 z-10 pointer-events-none flex justify-between items-start">
          <div className="pointer-events-auto">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Modern Heim</h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">Modular Dressroom Builder</p>
          </div>
          
          <div className="hidden md:block absolute top-6 left-1/2 -translate-x-1/2 pointer-events-auto">
             <div className="bg-white/80 backdrop-blur p-1.5 rounded-xl shadow-sm border border-white/50 flex gap-1">
                <button onClick={undo} disabled={currentStep === 0} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 text-gray-700" title="실행 취소 (Undo)">
                    <Undo2 size={20} />
                </button>
                <div className="w-px bg-gray-300 my-1"></div>
                <button onClick={redo} disabled={currentStep === history.length - 1} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 text-gray-700" title="다시 실행 (Redo)">
                    <Redo2 size={20} />
                </button>
            </div>
          </div>

          <div className="flex gap-2 pointer-events-auto items-center relative">
             <div className="md:hidden flex bg-white/80 backdrop-blur p-1 rounded-xl shadow-sm border border-white/50 mr-1">
                <button onClick={undo} disabled={currentStep === 0} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 text-gray-700">
                    <Undo2 size={18} />
                </button>
                <button onClick={redo} disabled={currentStep === history.length - 1} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 text-gray-700">
                    <Redo2 size={18} />
                </button>
             </div>

             <button
                onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                className={`px-3 py-2 md:px-4 md:py-2 rounded-xl shadow-sm border border-white/50 flex items-center gap-2 font-medium transition-all text-sm md:text-base ${isColorPickerOpen ? 'bg-indigo-600 text-white' : 'bg-white/80 hover:bg-gray-50 text-gray-700'}`}
                title="색상 변경"
             >
                 <Palette size={18} />
                 <span className="hidden md:inline">색상 변경</span>
             </button>

             {isColorPickerOpen && (
                 <div className="absolute top-14 right-32 z-40 w-64 bg-white/90 backdrop-blur-md shadow-xl rounded-2xl border border-white/60 p-4 animate-in fade-in slide-in-from-top-2">
                     <div className="space-y-4">
                         <div>
                             <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">프레임 컬러</h4>
                             <div className="flex gap-3">
                                 <button onClick={() => handleColorChange('frame', 'black')} className={`w-8 h-8 rounded-full bg-gray-900 border-2 transition-all ${config.frameColor === 'black' ? 'border-blue-500 scale-110 ring-2 ring-blue-200' : 'border-gray-200 hover:scale-105'}`} title="블랙" />
                                 <button onClick={() => handleColorChange('frame', 'white')} className={`w-8 h-8 rounded-full bg-white border-2 transition-all ${config.frameColor === 'white' ? 'border-blue-500 scale-110 ring-2 ring-blue-200' : 'border-gray-200 hover:scale-105'}`} title="화이트" />
                             </div>
                         </div>
                         <div className="h-px bg-gray-200"></div>
                         <div>
                             <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">선반 컬러</h4>
                             <div className="flex gap-3">
                                 <button onClick={() => handleColorChange('shelf', 'white')} className={`relative w-10 h-10 rounded-full bg-white border-2 transition-all ${config.shelfColor === 'white' ? 'border-blue-500 scale-110 ring-2 ring-blue-200' : 'border-gray-200 hover:scale-105'}`} title="화이트">
                                     {config.shelfColor === 'white' && <div className="absolute inset-0 flex items-center justify-center text-blue-500"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div></div>}
                                 </button>
                                 <button onClick={() => handleColorChange('shelf', 'acacia')} className={`relative w-10 h-10 rounded-full border-2 transition-all ${config.shelfColor === 'acacia' ? 'border-blue-500 scale-110 ring-2 ring-blue-200' : 'border-gray-200 hover:scale-105'}`} style={{ backgroundColor: '#8B5A2B' }} title="아카시아">
                                     {config.shelfColor === 'acacia' && <div className="absolute inset-0 flex items-center justify-center text-blue-500"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div></div>}
                                 </button>
                                 <button onClick={() => handleColorChange('shelf', 'walnut')} className={`relative w-10 h-10 rounded-full border-2 transition-all ${config.shelfColor === 'walnut' ? 'border-blue-500 scale-110 ring-2 ring-blue-200' : 'border-gray-200 hover:scale-105'}`} style={{ backgroundColor: '#3E2723' }} title="월넛">
                                     {config.shelfColor === 'walnut' && <div className="absolute inset-0 flex items-center justify-center text-white"><div className="w-1.5 h-1.5 bg-white rounded-full"></div></div>}
                                 </button>
                             </div>
                         </div>
                     </div>
                 </div>
             )}

             <button 
                onClick={toggleQuotation}
                className={`px-3 py-2 md:px-4 md:py-2 rounded-xl shadow-sm border border-white/50 flex items-center gap-2 font-medium transition-all text-sm md:text-base ${isQuotationOpen ? 'bg-blue-600 text-white' : 'bg-white/80 hover:bg-gray-50 text-gray-700'}`}
                title="견적서 확인"
             >
                <Receipt size={18} />
                <span className="hidden md:inline">견적서</span>
             </button>
          </div>
      </div>

      <div className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 z-20 gap-3 pointer-events-auto">
         <ModuleControls />
         <ItemControls />
         {selectedBayId && (
            <div className="bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-lg border border-white/50 flex items-center animate-in fade-in slide-in-from-bottom-4">
                <button 
                    onClick={() => removeBay(selectedBayId)}
                    className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                    title="선택된 모듈 삭제"
                >
                    <Trash2 size={20} />
                </button>
            </div>
        )}
      </div>

      <div className="md:hidden absolute bottom-6 left-0 w-full px-4 z-20 flex flex-col gap-3 pointer-events-auto items-center">
         <ModuleControls isMobile={true} />
         <ItemControls isMobile={true} />
      </div>

      <div className="absolute bottom-36 md:bottom-8 left-4 md:left-8 z-20 flex flex-col gap-2 pointer-events-auto">
         <button 
            onClick={() => {
                setShowDimensions(!showDimensions);
                setFitTrigger(n => n + 1);
            }}
            className={`p-3 rounded-full shadow-lg border transition-all active:scale-95 flex items-center justify-center group ${showDimensions ? 'bg-blue-600 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
            title="치수(Size) 표시 켜기/끄기"
         >
             <Ruler size={24} />
         </button>

         <button 
            onClick={() => setFitTrigger(n => n + 1)}
            className="p-3 bg-white text-gray-700 rounded-full shadow-lg hover:bg-gray-50 border border-gray-200 transition-all active:scale-95 flex items-center justify-center group"
            title="화면 맞춤 (Auto Fit)"
         >
             <Maximize size={24} className="group-hover:scale-110 transition-transform" />
         </button>

         <button 
            onClick={() => setShowTopView(!showTopView)}
            className={`p-3 rounded-full shadow-lg border transition-all active:scale-95 flex items-center justify-center group ${showTopView ? 'bg-gray-800 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
            title="탑뷰 (위에서 보기) 켜기/끄기"
         >
             <Grid size={24} />
         </button>
         
         <button 
            onClick={resetConfig}
            className="p-3 bg-white text-red-600 rounded-full shadow-lg hover:bg-red-50 border border-red-100 transition-all active:scale-95 flex items-center justify-center group"
            title="초기화 (Reset)"
         >
             <RotateCcw size={24} />
         </button>

         <button 
            onClick={() => setIsManualOpen(true)}
            className="p-3 bg-white text-blue-700 rounded-full shadow-lg hover:bg-blue-50 border border-blue-100 transition-all active:scale-95 flex items-center justify-center group"
            title="사용 설명서 (Manual)"
         >
            <BookOpen size={24} />
         </button>
      </div>

      {/* Top View or Option Menu Container - Bottom Right */}
      <div className="absolute bottom-8 right-8 z-20 pointer-events-auto">
          {isOptionMenuOpen ? (
              <div className="w-80 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 p-4 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex justify-between items-center mb-3">
                      <h4 className="font-bold text-gray-800 flex items-center gap-2">
                          <Box size={18} className="text-indigo-600"/> 옵션 선택
                      </h4>
                      <button onClick={() => setIsOptionMenuOpen(false)} className="p-1 hover:bg-gray-100 rounded-full text-gray-500"><X size={16}/></button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                      <button 
                          onClick={() => handleOptionSelect('placing_drawer')}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl gap-2 transition-colors ${interactionMode === 'placing_drawer' ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500 shadow-inner' : 'hover:bg-gray-50 text-gray-600 border border-gray-100'}`}
                      >
                          <Archive size={20} />
                          <span className="text-xs font-medium text-center">800 2단 서랍</span>
                      </button>
                       <button 
                          onClick={() => handleOptionSelect('placing_fabric_drawer')}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl gap-2 transition-colors ${interactionMode === 'placing_fabric_drawer' ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500 shadow-inner' : 'hover:bg-gray-50 text-gray-600 border border-gray-100'}`}
                      >
                          <LayoutGrid size={20} />
                          <span className="text-xs font-medium text-center">패브릭 서랍</span>
                      </button>
                      <button 
                          onClick={() => handleOptionSelect('placing_cabinet_open')}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl gap-2 transition-colors ${interactionMode === 'placing_cabinet_open' ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500 shadow-inner' : 'hover:bg-gray-50 text-gray-600 border border-gray-100'}`}
                      >
                          <PackageOpen size={20} />
                          <span className="text-xs font-medium text-center">800 오픈 수납</span>
                      </button>
                      <button 
                          onClick={() => handleOptionSelect('placing_cabinet_door')}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl gap-2 transition-colors ${interactionMode === 'placing_cabinet_door' ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500 shadow-inner' : 'hover:bg-gray-50 text-gray-600 border border-gray-100'}`}
                      >
                          <DoorOpen size={20} />
                          <span className="text-xs font-medium text-center">800 도어 수납</span>
                      </button>
                      <button 
                          onClick={() => handleOptionSelect('placing_mirror')}
                          className={`col-span-2 flex flex-row items-center justify-center p-3 rounded-xl gap-2 transition-colors ${interactionMode === 'placing_mirror' ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500 shadow-inner' : 'hover:bg-gray-50 text-gray-600 border border-gray-100'}`}
                      >
                          <RectangleVertical size={20} />
                          <span className="text-xs font-medium text-center">400 전신 거울</span>
                      </button>
                  </div>

                  {/* Curtain Group */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-[10px] font-bold text-gray-400 mb-2 text-center uppercase tracking-wider">커튼봉 세트</p>
                      <div className="grid grid-cols-2 gap-2">
                          <button 
                              onClick={() => handleOptionSelect('placing_curtain_400_1500')}
                              className={`flex flex-col items-center justify-center p-2 rounded-lg gap-1 transition-colors ${interactionMode === 'placing_curtain_400_1500' ? 'bg-purple-100 text-purple-700 ring-1 ring-purple-500' : 'hover:bg-gray-50 text-gray-600 border border-gray-100'}`}
                          >
                              <Blinds size={16} />
                              <span className="text-[10px] font-medium text-center">400 (Short)</span>
                          </button>
                          <button 
                              onClick={() => handleOptionSelect('placing_curtain_400_2100')}
                              className={`flex flex-col items-center justify-center p-2 rounded-lg gap-1 transition-colors ${interactionMode === 'placing_curtain_400_2100' ? 'bg-purple-100 text-purple-700 ring-1 ring-purple-500' : 'hover:bg-gray-50 text-gray-600 border border-gray-100'}`}
                          >
                              <Blinds size={16} />
                              <span className="text-[10px] font-medium text-center">400 (Long)</span>
                          </button>
                          <button 
                              onClick={() => handleOptionSelect('placing_curtain_800_1500')}
                              className={`flex flex-col items-center justify-center p-2 rounded-lg gap-1 transition-colors ${interactionMode === 'placing_curtain_800_1500' ? 'bg-purple-100 text-purple-700 ring-1 ring-purple-500' : 'hover:bg-gray-50 text-gray-600 border border-gray-100'}`}
                          >
                              <Blinds size={16} />
                              <span className="text-[10px] font-medium text-center">800 (Short)</span>
                          </button>
                          <button 
                              onClick={() => handleOptionSelect('placing_curtain_800_2100')}
                              className={`flex flex-col items-center justify-center p-2 rounded-lg gap-1 transition-colors ${interactionMode === 'placing_curtain_800_2100' ? 'bg-purple-100 text-purple-700 ring-1 ring-purple-500' : 'hover:bg-gray-50 text-gray-600 border border-gray-100'}`}
                          >
                              <Blinds size={16} />
                              <span className="text-[10px] font-medium text-center">800 (Long)</span>
                          </button>
                      </div>
                  </div>
              </div>
          ) : showTopView ? (
              <div className="hidden md:flex w-72 h-72 bg-white/90 backdrop-blur rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex-col animate-in fade-in slide-in-from-right-4">
                  <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex justify-between items-center text-xs font-semibold text-gray-500 uppercase relative">
                      <span>TOP VIEW</span>
                  </div>
                  <div className="flex-1 relative">
                      <Scene 
                          config={config} 
                          previewModelUrl={null} 
                          selectedBayId={null}
                          onBayClick={() => {}}
                          interactionMode="none"
                          setInteractionMode={() => {}}
                          onItemPlace={() => {}}
                          onAddBay={() => {}}
                          onRemoveBay={() => {}}
                          triggerFit={fitTrigger}
                          isTopView={true}
                          isQuotationOpen={false}
                          isManualOpen={false}
                          showDimensions={true}
                          onBackgroundClick={() => {}}
                      />
                  </div>
              </div>
          ) : null}
      </div>

      {isQuotationOpen && (
          <div className="absolute top-20 right-4 md:right-8 z-30 w-full md:w-96 bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-200 animate-in fade-in slide-in-from-top-4 flex flex-col max-h-[70vh]">
              {/* ... Quotation UI ... */}
              <div className="p-4 bg-gray-900 text-white flex justify-between items-center">
                  <h3 className="font-bold flex items-center gap-2"><Receipt size={18}/> 견적서 (Estimate)</h3>
                  <button onClick={toggleQuotation} className="hover:bg-gray-700 p-1 rounded"><X size={18}/></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                  <table className="w-full text-sm">
                      <thead>
                          <tr className="border-b border-gray-200 text-left text-gray-500">
                              <th className="pb-2 font-medium w-1/2">품목</th>
                              <th className="pb-2 text-center font-medium w-1/6">수량</th>
                              <th className="pb-2 text-right font-medium w-1/3">금액</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          {bom.items.map((item, idx) => {
                              let dotColor = COLORS.HIGHLIGHT.default;
                              if (item.type === 'frame') dotColor = COLORS.HIGHLIGHT.frame;
                              else if (item.type === 'lpost') dotColor = COLORS.HIGHLIGHT.lpost;
                              else if (item.type === 'hanger') dotColor = COLORS.HIGHLIGHT.hanger;
                              else if (item.type === 'xbar') dotColor = COLORS.HIGHLIGHT.xbar;
                              else if (item.type === 'drawer') dotColor = COLORS.HIGHLIGHT.drawer;
                              else if (item.type === 'fabric_drawer') dotColor = COLORS.HIGHLIGHT.fabric_drawer;
                              else if (item.type === 'cabinet') dotColor = COLORS.HIGHLIGHT.cabinet;
                              else if (item.type === 'mirror') dotColor = COLORS.HIGHLIGHT.mirror;
                              else if (item.type === 'curtain') dotColor = COLORS.HIGHLIGHT.curtain;
                              else if (item.type === 'shelf') {
                                  if (item.width === 120) dotColor = COLORS.HIGHLIGHT.shelf_1200;
                                  else if (item.width === 80) dotColor = COLORS.HIGHLIGHT.shelf_800;
                                  else if (item.width === 40) dotColor = COLORS.HIGHLIGHT.shelf_400;
                                  else if (item.width === 59) dotColor = COLORS.HIGHLIGHT.shelf_corner;
                              }

                              return (
                                <tr key={idx} className="group hover:bg-gray-50 transition-colors">
                                    <td className="py-3 flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: dotColor }}></div>
                                        <span className="truncate" title={item.name}>{item.name}</span>
                                    </td>
                                    <td className="py-3 text-center">{item.count}</td>
                                    <td className="py-3 text-right text-gray-700">{item.price.toLocaleString()}</td>
                                </tr>
                              );
                          })}
                      </tbody>
                  </table>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-500">
                      <span>소계 (Subtotal)</span>
                      <span>₩{bom.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                      <span>부가세 (VAT 10%)</span>
                      <span>₩{bom.vat.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                      <span>배송비 (Shipping 10%)</span>
                      <span>₩{bom.shipping.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg text-gray-900 pt-2 border-t border-gray-200">
                      <span>총 합계</span>
                      <span className="text-blue-600">₩{bom.total.toLocaleString()}</span>
                  </div>
              </div>
          </div>
      )}

      <SystemManual isOpen={isManualOpen} onClose={() => setIsManualOpen(false)} />

    </div>
  );
};

export default App;