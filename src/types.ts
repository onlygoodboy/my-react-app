export type CharacterStatus = '立项中' | '开发中' | '待上线' | '已上线';
export type Rarity = 'SSR' | 'SR' | 'R';

export interface DevelopmentProgress {
  concept: boolean;
  illustration: boolean;
  modeling: boolean;
  skills: boolean;
  stats: boolean;
  voice: boolean;
  pv: boolean;
  config: boolean;
  marketing: boolean;
}

export interface AICharacterDraft {
  name: string;
  company?: string;
  game?: string;
  version?: string;
  rarity?: Rarity;
  position?: string;
  weaponType?: string;
  tags?: string[];
  worldview?: string;
  background?: string;
  personality?: string;
  sellingPoints?: string;
  assets?: {
    portrait?: string;
    conceptArt?: string;
    modelPreview?: string;
    pvUrl?: string;
  };
  progress?: Partial<DevelopmentProgress>;
  overallProgress?: number;
  currentStage?: string;
  nextMilestone?: string;
  riskNote?: string;
  performance?: Partial<PerformanceData>;
}

export interface AIAnalysisResult {
  summary: string;
  highlights: string[];
  recommendations: string[];
}

export interface AIAssistantResponse {
  intent: 'general' | 'create_character' | 'analyze_performance';
  reply: string;
  characterDraft?: AICharacterDraft;
  analysis?: AIAnalysisResult;
}

export interface PerformanceData {
  firstDayRevenue: number;
  firstThreeDaysRevenue: number;
  firstWeekRevenue: number;
  peakPopularity: number;
  rank: number;
  revenueTrend: { date: string; value: number }[];
  popularityTrend: { date: string; value: number }[];
}

export interface Character {
  id: string;
  name: string;
  company: '米哈游' | '鹰角网络' | '库洛游戏';
  game: string;
  version: string;
  rarity: Rarity;
  position: string;
  weaponType: string;
  tags: string[];
  status: CharacterStatus;
  createTime: string;
  launchTime?: string;
  
  // Design
  worldview: string;
  background: string;
  personality: string;
  sellingPoints: string;
  
  // Progress
  progress: DevelopmentProgress;
  reworkStages?: string[]; // Track stages that are currently being reworked
  overallProgress: number;
  currentStage: string;
  nextMilestone: string;
  isDelayed: boolean;
  riskNote: string;
  
  // Assets
  assets?: {
    portrait?: string;
    conceptArt?: string;
    modelPreview?: string;
    pvUrl?: string;
  };
  
  // Performance
  performance?: PerformanceData;
  review?: {
    summary: string;
    tag: '表现优秀' | '热度高转化一般' | '表现稳定' | '表现偏弱';
  };
}
