import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrthographicCamera, Stage, OrbitControls } from '@react-three/drei';
import { FramePart, ShelfPart, CornerShelfPart, HangerPart, LPostPart, XBarPart, DrawerPart, FabricDrawerPart, CabinetPart, MirrorPart } from './Parts';
import { DIMENSIONS, COLORS } from '../constants';
import { X, Folder, FileText, Image as ImageIcon, ChevronRight, ChevronDown, Plus, Box, Shirt, Trash2, Receipt, MousePointer2, RotateCcw, Ruler, Maximize, Grid, DoorOpen, Blinds } from 'lucide-react';

// --- Types ---
type FileType = 'markdown' | 'image-gallery' | 'guide';

interface FileNode {
  id: string;
  name: string;
  type: FileType;
  content?: any;
}

interface FolderNode {
  id: string;
  name: string;
  children: (FolderNode | FileNode)[];
  isOpen?: boolean;
}

// --- Components ---

const PartViewer: React.FC<{ children: React.ReactNode, title: string, description: string }> = ({ children, title, description }) => {
    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow h-64">
            <div className="h-44 bg-gray-50 relative">
                <Canvas shadows dpr={[1, 2]}>
                    {/* Adjusted Camera for better fit */}
                    <OrthographicCamera makeDefault position={[40, 40, 40]} zoom={3.5} />
                    <ambientLight intensity={0.8} />
                    <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow />
                    <group position={[0, -5, 0]}>
                        <Stage intensity={0.5} environment="city" adjustCamera={false}>
                            {children}
                        </Stage>
                    </group>
                    <OrbitControls autoRotate autoRotateSpeed={2} enableZoom={false} enablePan={false} />
                </Canvas>
            </div>
            <div className="p-3 bg-white border-t border-gray-100 flex-1 flex flex-col justify-center">
                <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
                <p className="text-xs text-gray-500 mt-1 leading-snug line-clamp-2">{description}</p>
            </div>
        </div>
    );
};

// --- Data Structure ---

const DOC_STRUCTURE: FolderNode[] = [
    {
        id: 'user-guide',
        name: '사용 설명서 (User Guide)',
        isOpen: true,
        children: [
             { id: 'program-usage', name: '프로그램 사용법.md', type: 'guide' },
        ]
    },
    {
        id: 'docs',
        name: '기술 문서 (Documents)',
        isOpen: true,
        children: [
            { id: 'guide', name: '조립 가이드.md', type: 'markdown' },
            { id: 'option-rules', name: '옵션 부착 규칙.md', type: 'markdown' },
            { id: 'parts-list', name: '부품 리스트.md', type: 'markdown' }
        ]
    },
    {
        id: 'images',
        name: '부품 이미지 (ISO View)',
        isOpen: true,
        children: [
            { id: 'iso-gallery', name: '기본 부품 렌더링', type: 'image-gallery' },
            { id: 'option-gallery', name: '옵션 (서랍장 등)', type: 'image-gallery' }
        ]
    }
];

// --- Main Component ---

interface SystemManualProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SystemManual: React.FC<SystemManualProps> = ({ isOpen, onClose }) => {
    const [activeFileId, setActiveFileId] = useState<string>('program-usage');
    const [structure, setStructure] = useState<FolderNode[]>(DOC_STRUCTURE);

    if (!isOpen) return null;

    const toggleFolder = (folderId: string) => {
        setStructure(prev => prev.map(folder => 
            folder.id === folderId ? { ...folder, isOpen: !folder.isOpen } : folder
        ));
    };

    const dummyFrameColor = 'black';
    const dummyShelfColor = 'acacia';

    const renderContent = () => {
        switch (activeFileId) {
            case 'program-usage':
                return (
                     <div className="prose prose-sm max-w-none text-gray-700 space-y-8 pb-10">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">프로그램 사용 방법</h1>
                            <p className="text-gray-500">누구나 쉽게 나만의 드레스룸을 설계할 수 있습니다. 아래 순서대로 따라해 보세요.</p>
                        </div>

                        {/* Step 1 */}
                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                                <span className="bg-gray-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                                기본 뼈대(프레임) 세우기
                            </h3>
                            <p className="mb-4">화면 하단 중앙의 버튼을 눌러 원하는 크기의 옷장 기둥을 세웁니다.</p>
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className="inline-flex items-center gap-1 px-3 py-2 bg-gray-800 text-white rounded-lg text-xs font-bold">
                                    <Plus size={14}/> 800 Frame
                                </span>
                                <span className="inline-flex items-center gap-1 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-bold">
                                    <Plus size={14}/> 400 Frame
                                </span>
                                <span className="inline-flex items-center gap-1 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-bold">
                                    <Plus size={14}/> Corner
                                </span>
                            </div>
                            <p className="text-xs text-gray-500">* 버튼을 누를 때마다 오른쪽으로 계속 연결됩니다.</p>
                        </div>

                        {/* Step 2 */}
                        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                            <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2 mb-4">
                                <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                                선반, 행거 및 옵션 설치
                            </h3>
                            <p className="mb-4">뼈대를 다 세웠다면, 이제 옷을 걸거나 물건을 올릴 부품을 설치해 봅시다.</p>
                            
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="bg-white p-2 rounded-lg border border-blue-200 text-blue-600 shadow-sm shrink-0">
                                        <Box size={24} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">옵션 메뉴 (서랍/수납장/커튼)</p>
                                        <p className="text-sm">
                                            박스 아이콘을 누르면 서랍장, 수납장, 거울, 커튼봉 세트를 선택할 수 있습니다.<br/>
                                            팝업 창은 화면 우측 하단(탑뷰 위치)에 나타납니다.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                                <span className="bg-gray-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
                                인터랙션 (가구 조작)
                            </h3>
                            <p className="mb-4 text-sm">설치 모드가 아닐 때 (마우스 커서가 기본 상태일 때), 가구를 클릭하여 동작을 확인할 수 있습니다.</p>
                            
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <li className="flex items-center gap-2 bg-white p-2 rounded border border-gray-200">
                                    <MousePointer2 size={18} className="text-blue-600" />
                                    <span><strong>서랍장 클릭:</strong> 서랍이 앞으로 열립니다.</span>
                                </li>
                                <li className="flex items-center gap-2 bg-white p-2 rounded border border-gray-200">
                                    <DoorOpen size={18} className="text-gray-700" />
                                    <span><strong>도어장/거울 클릭:</strong> 문이 회전하며 열립니다.</span>
                                </li>
                                <li className="flex items-center gap-2 bg-white p-2 rounded border border-gray-200">
                                    <Blinds size={18} className="text-purple-600" />
                                    <span><strong>커튼 클릭:</strong> 커튼이 좌측으로 걷힙니다.</span>
                                </li>
                            </ul>
                        </div>

                        {/* Step 4 */}
                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                                <span className="bg-gray-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">4</span>
                                견적 확인하기
                            </h3>
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm">
                                    <Receipt size={16} /> 견적서
                                </div>
                                <p>화면 오른쪽 상단의 견적서 버튼을 누르면 현재 구성된 제품의 상세 목록과 가격을 볼 수 있습니다.</p>
                            </div>
                        </div>

                     </div>
                );
            case 'guide':
                return (
                    <div className="prose prose-sm max-w-none text-gray-700">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">모던하임 조립 및 연결 가이드</h1>
                        
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-6">
                             <h4 className="text-yellow-800 font-bold flex items-center gap-2 mb-2">
                                 ⚠️ 구조적 안전을 위한 필수 사항
                             </h4>
                             <ul className="list-disc pl-5 text-yellow-700 text-sm space-y-1">
                                 <li>이 제품은 조립식이므로, 구조적 안전을 위해 <strong>선반은 최소 하부와 상부에 하나씩은 존재해야 합니다.</strong></li>
                                 <li>안정적인 사용을 위해 <strong>모듈당 3장 이상의 선반 설치를 권장</strong>합니다.</li>
                             </ul>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 mt-6">1. 서랍장 및 수납장 설치</h3>
                        <p>서랍장이나 수납장은 프레임에 견고하게 고정됩니다.</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li><strong>2단 서랍 / 패브릭 서랍:</strong> 하단(1단) 또는 중단(2단)에 설치 가능하며, 동시에 설치하여 적층할 수 있습니다. 설치 시 전용 상/하부 선반이 자동으로 포함됩니다.</li>
                            <li><strong>800 수납장 (오픈/도어):</strong> 하단에만 설치 가능하며, 높이가 높아 1~2단을 모두 차지합니다.</li>
                            <li><strong>교체 설치:</strong> 기존에 설치된 수납장 자리에 서랍장을 설치하면, 기존 제품은 자동으로 삭제되고 교체됩니다.</li>
                        </ul>

                        <h3 className="text-lg font-bold text-gray-900 mt-6">2. 전신 거울 (400 모듈 전용)</h3>
                        <p>400폭 모듈에만 설치 가능한 도어형 전신 거울입니다.</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li><strong>규격:</strong> 바닥부터 5번째 선반 높이까지 커버합니다.</li>
                            <li><strong>내부 활용:</strong> 도어 형태이므로 내부에 선반이나 패브릭 서랍장을 설치하여 수납 공간으로 활용할 수 있습니다.</li>
                        </ul>
                    </div>
                );
            case 'option-rules':
                return (
                    <div className="prose prose-sm max-w-none text-gray-700">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">옵션 부착 및 설치 규칙</h1>
                        <p className="text-gray-500 mb-6">모듈형 시스템 특성상 각 옵션의 규격과 간섭 여부에 따라 설치가 제한될 수 있습니다.</p>

                        <div className="space-y-6">
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <h3 className="font-bold text-gray-900 mb-2">커튼봉 세트 설치 규칙</h3>
                                <ul className="list-disc pl-5 space-y-1 text-sm">
                                    <li><strong>400 모듈:</strong> 400용 커튼봉만 설치 가능합니다.</li>
                                    <li><strong>800 / 1200 모듈:</strong> 800용 커튼봉만 설치 가능합니다.</li>
                                    <li><strong>설치 불가:</strong> 코너 모듈 및 전신 거울이 설치된 모듈에는 설치할 수 없습니다.</li>
                                    <li><strong>사이즈:</strong> 높이 1500mm(숏)와 2100mm(롱) 두 가지 옵션이 있습니다.</li>
                                </ul>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <h3 className="font-bold text-gray-900 mb-2">패브릭 서랍장 설치 규칙</h3>
                                <ul className="list-disc pl-5 space-y-1 text-sm">
                                    <li><strong>설치 가능 모듈:</strong> 400mm, 800mm 모듈 전용입니다. (1200mm 모듈 불가)</li>
                                    <li><strong>코너 모듈:</strong> 코너에는 서랍장을 설치할 수 없습니다.</li>
                                    <li><strong>설치 위치:</strong> 하단(1단) 또는 중단(2단)에 설치 가능하며, 동시에 설치하여 적층할 수 있습니다.</li>
                                </ul>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <h3 className="font-bold text-gray-900 mb-2">행거봉 설치 제한</h3>
                                <p className="text-sm mb-2">행거봉은 옷을 거는 공간이 필요하므로 아래의 경우 설치가 불가능합니다.</p>
                                <ul className="list-disc pl-5 space-y-1 text-sm text-red-600 font-medium">
                                    <li>서랍장이 설치된 위치 (옷이 서랍장에 걸림)</li>
                                    <li>오픈장 또는 도어장이 설치된 위치 (수납장 내부)</li>
                                    <li>최하단 (바닥)</li>
                                </ul>
                                <p className="text-sm mt-2 text-blue-600">
                                    * 단, 선반과는 동시에 설치가 가능합니다. (선반 아래에 행거봉 부착)
                                </p>
                            </div>
                        </div>
                    </div>
                );
            case 'parts-list':
                return (
                    <div className="prose prose-sm max-w-none text-gray-700">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">부품 리스트 (BOM)</h1>
                        <table className="min-w-full text-left text-sm whitespace-nowrap">
                          <thead className="uppercase tracking-wider border-b-2 border-gray-200">
                            <tr>
                              <th scope="col" className="px-2 py-4 border-x text-center">부품명</th>
                              <th scope="col" className="px-2 py-4 border-x text-center">규격 (mm)</th>
                              <th scope="col" className="px-6 py-4 border-x">설명</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-gray-100">
                              <td className="px-2 py-3 border-x font-medium">사다리형 프레임</td>
                              <td className="px-2 py-3 border-x text-center">2040 x 300 x 25</td>
                              <td className="px-6 py-3 border-x">기본 골조 (6단 렁)</td>
                            </tr>
                            <tr className="border-b border-gray-100 bg-gray-50">
                              <td className="px-2 py-3 border-x font-medium">선반 (직선)</td>
                              <td className="px-2 py-3 border-x text-center">W x 290 x 18</td>
                              <td className="px-6 py-3 border-x">직선 모듈용 선반 (400/800)</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                              <td className="px-2 py-3 border-x font-medium">코너 선반</td>
                              <td className="px-2 py-3 border-x text-center">600 x 600 x 18</td>
                              <td className="px-6 py-3 border-x">곡선형 안쪽 모서리 (프레임 포함 625)</td>
                            </tr>
                            <tr className="border-b border-gray-100 bg-gray-50">
                              <td className="px-2 py-3 border-x font-medium">L-포스트</td>
                              <td className="px-2 py-3 border-x text-center">40 x 40</td>
                              <td className="px-6 py-3 border-x">코너 지지용 5각 기둥</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                               <td className="px-2 py-3 border-x font-medium">전신 거울 도어</td>
                               <td className="px-2 py-3 border-x text-center">400 x 1700</td>
                               <td className="px-6 py-3 border-x">400 모듈 전용 거울 도어 (경첩 포함)</td>
                            </tr>
                            <tr className="border-b border-gray-100 bg-gray-50">
                               <td className="px-2 py-3 border-x font-medium">커튼봉 세트</td>
                               <td className="px-2 py-3 border-x text-center">400/800</td>
                               <td className="px-6 py-3 border-x">전용 브라켓 및 커튼 포함 (H: 1500/2100)</td>
                            </tr>
                          </tbody>
                        </table>
                    </div>
                );
            case 'iso-gallery':
                return (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                        <PartViewer title="사다리형 프레임" description="높이 2040mm. 후면 X-Bar 타공 포함.">
                            <FramePart position={[0, 0, 0]} color={dummyFrameColor} />
                        </PartViewer>

                        <PartViewer title="일반 선반" description="기본 선반. 지퍼식 브라켓 체결.">
                            <ShelfPart position={[0, 0, 0]} width={60} color={dummyShelfColor} />
                        </PartViewer>

                        <PartViewer title="코너 선반" description="600x600. L-Post 홈 가공.">
                            <CornerShelfPart position={[0, 0, 0]} width={62.5} color={dummyShelfColor} />
                        </PartViewer>

                        <PartViewer title="L-포스트" description="40mm L형 프로파일. 코너 안쪽 지지.">
                            <group rotation={[Math.PI/2, 0, 0]}>
                                <LPostPart position={[0, 0, 0]} color={dummyFrameColor} />
                            </group>
                        </PartViewer>

                        <PartViewer title="행거 (직선)" description="기본 행거봉 및 브라켓.">
                            <HangerPart position={[0, 0, 0]} width={60} bayIndex={0} />
                        </PartViewer>
                        
                        <PartViewer title="행거 (코너)" description="코너용 단축 행거봉.">
                            <HangerPart position={[0, 0, 0]} width={62.5} bayIndex={0} isCorner={true} />
                        </PartViewer>
                        
                        <PartViewer title="X-Bar" description="구조적 안정성을 위한 후면 지지대. Pressed Ends 적용.">
                            <group rotation={[Math.PI/2, 0, 0]}>
                                <XBarPart position={[0, 0, 0]} width={60} height={50} />
                            </group>
                        </PartViewer>
                    </div>
                );
            case 'option-gallery':
                 return (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                        <PartViewer title="800 목재 서랍장 (2단)" description="800 모듈 전용. 하단 설치 권장. 고급형 목재 마감.">
                            <DrawerPart position={[0, -20, 0]} width={80} color={dummyShelfColor} />
                        </PartViewer>

                        <PartViewer title="패브릭 서랍장 (4칸)" description="800 모듈 전용. 그레이 패브릭 마감.">
                             <FabricDrawerPart position={[0, -20, 0]} width={80} color={dummyShelfColor} />
                        </PartViewer>
                        
                        <PartViewer title="800 도어 수납장" description="800 모듈 하단 전용. 양문형 도어.">
                             <CabinetPart position={[0, -20, 0]} width={80} color={dummyShelfColor} hasDoor={true} />
                        </PartViewer>

                        <PartViewer title="400 전신 거울" description="400 모듈 전용. 프레임 부착형 도어.">
                             <MirrorPart position={[0, -20, 0]} width={40} color={dummyShelfColor} />
                        </PartViewer>
                    </div>
                 );
            default:
                return <div className="p-10 text-center text-gray-400">파일을 선택해주세요.</div>;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-6xl h-[85vh] rounded-2xl shadow-2xl flex overflow-hidden">
                
                {/* Sidebar (Explorer) */}
                <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
                    <div className="p-4 border-b border-gray-200">
                        <h2 className="font-bold text-gray-800 flex items-center gap-2">
                            <Folder size={18} className="text-blue-600" />
                            매뉴얼 (Manual)
                        </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {structure.map(folder => (
                            <div key={folder.id} className="mb-2">
                                <button 
                                    onClick={() => toggleFolder(folder.id)}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded text-left"
                                >
                                    {folder.isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    {folder.name}
                                </button>
                                
                                {folder.isOpen && (
                                    <div className="pl-6 mt-1 space-y-1">
                                        {folder.children.map((file) => (
                                            <button
                                                key={file.id}
                                                onClick={() => setActiveFileId(file.id)}
                                                className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded text-left transition-colors ${
                                                    activeFileId === file.id 
                                                    ? 'bg-blue-100 text-blue-700 font-medium' 
                                                    : 'text-gray-600 hover:bg-gray-100'
                                                }`}
                                            >
                                                {file.id === 'program-usage' 
                                                 ? <FileText size={14} className="text-orange-500"/> 
                                                 : (file as FileNode).type === 'markdown' ? <FileText size={14} /> : <ImageIcon size={14} />}
                                                {file.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col bg-white min-w-0">
                    <div className="h-14 border-b border-gray-100 flex items-center justify-between px-6 bg-white shrink-0">
                         <div className="flex items-center gap-2 text-sm text-gray-500">
                             <Folder size={14} />
                             <span>/</span>
                             <span className="font-medium text-gray-800">
                                 {DOC_STRUCTURE.flatMap(f => f.children).find(c => c.id === activeFileId)?.name || '파일 선택'}
                             </span>
                         </div>
                         <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-8 bg-white">
                        {renderContent()}
                    </div>
                </div>

            </div>
        </div>
    );
};