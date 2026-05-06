import React, { useEffect, useMemo, useRef, useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  ClipboardCheck, 
  TrendingUp, 
  GitCompare,
  Plus,
  Search,
  Filter,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  RotateCcw,
  ArrowUpRight,
  ArrowDownRight,
  Volume2,
  X,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import ModelPreview from './components/ModelPreview';
import { MOCK_CHARACTERS } from './mockData';
import { Character, CharacterStatus, DevelopmentProgress, PerformanceData } from './types';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Legend
} from 'recharts';

// --- Components ---

interface SidebarItemProps {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
  key?: React.Key;
}

const SidebarItem = ({ icon: Icon, label, active, onClick }: SidebarItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all duration-200 group",
      active 
        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
    )}
  >
    <Icon size={20} className={cn(active ? "text-white" : "text-slate-400 group-hover:text-slate-600")} />
    <span className="font-medium">{label}</span>
  </button>
);

const StatCard = ({ label, value, subValue, icon: Icon, color, onClick }: { label: string, value: string | number, subValue?: string, icon: any, color: string, onClick?: () => void }) => (
  <div 
    className={cn(
      "bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-all duration-200",
      onClick && "cursor-pointer hover:shadow-md hover:border-indigo-100 group"
    )}
    onClick={onClick}
  >
    <div className="flex justify-between items-start mb-4">
      <div className={cn("p-2 rounded-xl transition-transform duration-200", color, onClick && "group-hover:scale-110")}>
        <Icon size={24} className="text-white" />
      </div>
      {subValue && (
        <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
          {subValue}
        </span>
      )}
    </div>
    <div className="text-2xl font-bold text-slate-900">{value}</div>
    <div className="text-sm text-slate-500 mt-1 flex items-center gap-1">
      {label}
      {onClick && <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />}
    </div>
  </div>
);

const isVideoAsset = (url?: string) => {
  if (!url) return false;
  const cleanUrl = url.split('?')[0].toLowerCase();
  return ['.mp4', '.webm', '.ogg', '.mov'].some(ext => cleanUrl.endsWith(ext));
};

const isModelAsset = (url?: string) => {
  if (!url) return false;
  const cleanUrl = url.split('?')[0].toLowerCase();
  return ['.glb', '.gltf'].some(ext => cleanUrl.endsWith(ext));
};

const AddCharacterModal = ({ isOpen, onClose, onAdd }: { isOpen: boolean, onClose: () => void, onAdd: (char: Character) => void }) => {
  const [formData, setFormData] = useState({
    name: '',
    company: '米哈游' as Character['company'],
    game: '',
    version: 'v1.0',
    rarity: 'SSR' as Character['rarity'],
    position: '',
    weaponType: '',
    worldview: '',
    background: '',
    sellingPoints: '',
    assets: { portrait: '', conceptArt: '', modelPreview: '', pvUrl: '' }
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newChar: Character = {
      id: Math.random().toString(36).substr(2, 9),
      ...formData,
      tags: [],
      personality: '',
      status: '立项中',
      createTime: new Date().toISOString().split('T')[0],
      progress: {
        concept: false,
        illustration: false,
        modeling: false,
        skills: false,
        stats: false,
        voice: false,
        pv: false,
        config: false,
        marketing: false
      },
      overallProgress: 0,
      currentStage: '立项准备',
      nextMilestone: '设定评审',
      isDelayed: false,
      riskNote: '新立项角色，暂无风险。'
    };
    onAdd(newChar);
    onClose();
    setFormData({
      name: '',
      company: '米哈游',
      game: '',
      version: 'v1.0',
      rarity: 'SSR',
      position: '',
      weaponType: '',
      worldview: '',
      background: '',
      sellingPoints: '',
      assets: { portrait: '', conceptArt: '', modelPreview: '', pvUrl: '' }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
      >
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">新角色立项</h2>
            <p className="text-sm text-slate-500 mt-0.5">填写基础信息以开启新的角色开发流程。</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">角色名称</label>
              <input 
                required
                type="text" 
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="例如：雷电将军"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">所属游戏</label>
              <select 
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={formData.game}
                onChange={e => setFormData({...formData, game: e.target.value})}
              >
                <option value="">请选择游戏</option>
                <option value="原神">原神</option>
                <option value="绝区零">绝区零</option>
                <option value="崩坏：星穹铁道">崩坏：星穹铁道</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">稀有度</label>
              <select 
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={formData.rarity}
                onChange={e => setFormData({...formData, rarity: e.target.value as any})}
              >
                <option value="SSR">SSR</option>
                <option value="SR">SR</option>
                <option value="R">R</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">版本号</label>
              <input 
                type="text" 
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={formData.version}
                onChange={e => setFormData({...formData, version: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">角色定位</label>
              <input 
                type="text" 
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="例如：主C / 辅助"
                value={formData.position}
                onChange={e => setFormData({...formData, position: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">武器类型</label>
              <input 
                type="text" 
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="例如：单手剑"
                value={formData.weaponType}
                onChange={e => setFormData({...formData, weaponType: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">世界观设定</label>
            <textarea 
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
              placeholder="描述角色在世界观中的地位..."
              value={formData.worldview}
              onChange={e => setFormData({...formData, worldview: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">核心卖点</label>
            <textarea 
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
              placeholder="角色的独特之处是什么？"
              value={formData.sellingPoints}
              onChange={e => setFormData({...formData, sellingPoints: e.target.value})}
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">素材资源 (URL)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">角色头像</label>
                <input 
                  value={formData.assets.portrait}
                  onChange={e => setFormData({...formData, assets: { ...formData.assets, portrait: e.target.value }})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-xs"
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">角色原画</label>
                <input 
                  value={formData.assets.conceptArt}
                  onChange={e => setFormData({...formData, assets: { ...formData.assets, conceptArt: e.target.value }})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-xs"
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">3D 建模预览</label>
                <input 
                  value={formData.assets.modelPreview}
                  onChange={e => setFormData({...formData, assets: { ...formData.assets, modelPreview: e.target.value }})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-xs"
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">PV 视频/封面</label>
                <input 
                  value={formData.assets.pvUrl}
                  onChange={e => setFormData({...formData, assets: { ...formData.assets, pvUrl: e.target.value }})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-xs"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
        </form>

        <div className="px-8 py-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-white transition-all"
          >
            取消
          </button>
          <button 
            onClick={handleSubmit}
            className="px-8 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
          >
            确认立项
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- Pages ---

const Dashboard = ({ characters, onNavigate }: { characters: Character[], onNavigate: (page: string, id?: string) => void }) => {
  const stats = useMemo(() => ({
    total: characters.length,
    developing: characters.filter(c => c.status === '开发中').length,
    pending: characters.filter(c => c.status === '待上线').length,
    launched: characters.filter(c => c.status === '已上线').length,
    reworking: characters.filter(c => c.reworkStages && c.reworkStages.length > 0).length,
    delayed: characters.filter(c => c.isDelayed).length,
  }), [characters]);

  const recentCharacters = characters.slice(0, 4);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">系统概览</h1>
        <p className="text-slate-500 mt-1">欢迎回来，这是当前所有角色的整体进度与表现。</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="角色总数" value={stats.total} icon={Users} color="bg-blue-500" onClick={() => onNavigate('角色管理')} />
        <StatCard label="开发中" value={stats.developing} subValue={stats.reworking > 0 ? `${stats.reworking} 个返工中` : undefined} icon={Clock} color="bg-amber-500" onClick={() => onNavigate('开发进度')} />
        <StatCard label="待上线" value={stats.pending} subValue={stats.delayed > 0 ? `${stats.delayed} 个延期风险` : undefined} icon={ClipboardCheck} color="bg-indigo-500" onClick={() => onNavigate('上线检查')} />
        <StatCard label="已上线" value={stats.launched} icon={CheckCircle2} color="bg-emerald-500" onClick={() => onNavigate('数据分析')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-900">最近角色动态</h2>
              <button onClick={() => onNavigate('角色管理')} className="text-sm text-indigo-600 font-medium hover:underline">查看全部</button>
            </div>
            <div className="space-y-4">
              {recentCharacters.map(char => (
                <div key={char.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-50 hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => onNavigate('角色详情', char.id)}>
                  <div className="flex items-center gap-4">
                    {char.assets?.portrait ? (
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                        <img src={char.assets.portrait} alt={char.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    ) : (
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg",
                        char.rarity === 'SSR' ? "bg-amber-100 text-amber-600" : "bg-purple-100 text-purple-600"
                      )}>
                        {char.name[0]}
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-slate-900">{char.name}</div>
                      <div className="text-xs text-slate-500">{char.game} · {char.version}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      {char.reworkStages && char.reworkStages.length > 0 ? (
                        <div className="text-xs font-bold text-amber-600 flex items-center gap-1 justify-end">
                          <RotateCcw size={12} className="animate-spin-slow" /> 返工中
                        </div>
                      ) : (
                        <div className="text-sm font-medium text-slate-900">{char.status}</div>
                      )}
                      <div className="text-xs text-slate-400">{char.overallProgress}% 进度</div>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-6">进度提醒</h2>
            <div className="space-y-4">
              {characters.filter(c => c.reworkStages && c.reworkStages.length > 0).map(char => (
                <div 
                  key={char.id} 
                  className="flex gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100 cursor-pointer hover:bg-amber-100 transition-colors group"
                  onClick={() => onNavigate('角色详情', char.id)}
                >
                  <RotateCcw size={20} className="text-amber-500 shrink-0 animate-spin-slow" />
                  <div>
                    <div className="text-sm font-bold text-amber-900 flex items-center gap-1">
                      {char.name} 正在返工
                      <ChevronRight size={14} className="text-amber-300 group-hover:text-amber-500 transition-colors" />
                    </div>
                    <div className="text-xs text-amber-700 mt-1">返工环节: {char.reworkStages?.map(s => {
                      const names: Record<string, string> = {
                        concept: '设定', illustration: '原画', modeling: '建模',
                        skills: '技能', stats: '数值', voice: '配音',
                        pv: 'PV', config: '配置', marketing: '宣发'
                      };
                      return names[s] || s;
                    }).join(', ')}</div>
                    <div className="text-[10px] text-amber-600 mt-1 font-medium flex items-center gap-2">
                      <span>当前: {char.currentStage}</span>
                      <span className="w-1 h-1 rounded-full bg-amber-300" />
                      <span>进度: {char.overallProgress}%</span>
                    </div>
                  </div>
                </div>
              ))}
              {characters.filter(c => c.isDelayed).map(char => (
                <div 
                  key={char.id} 
                  className="flex gap-3 p-3 rounded-xl bg-red-50 border border-red-100 cursor-pointer hover:bg-red-100 transition-colors group"
                  onClick={() => onNavigate('角色详情', char.id)}
                >
                  <AlertCircle size={20} className="text-red-500 shrink-0" />
                  <div>
                    <div className="text-sm font-bold text-red-900 flex items-center gap-1">
                      {char.name} 进度延期
                      <ChevronRight size={14} className="text-red-300 group-hover:text-red-500 transition-colors" />
                    </div>
                    <div className="text-xs text-red-700 mt-1">{char.riskNote}</div>
                  </div>
                </div>
              ))}
              {characters.filter(c => c.status === '待上线').map(char => (
                <div 
                  key={char.id} 
                  className="flex gap-3 p-3 rounded-xl bg-indigo-50 border border-indigo-100 cursor-pointer hover:bg-indigo-100 transition-colors group"
                  onClick={() => onNavigate('角色详情', char.id)}
                >
                  <ClipboardCheck size={20} className="text-indigo-500 shrink-0" />
                  <div>
                    <div className="text-sm font-bold text-indigo-900 flex items-center gap-1">
                      {char.name} 等待上线检查
                      <ChevronRight size={14} className="text-indigo-300 group-hover:text-indigo-500 transition-colors" />
                    </div>
                    <div className="text-xs text-indigo-700 mt-1">预计上线: {char.launchTime || '待定'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CharacterList = ({ characters, onNavigate, onAddClick }: { characters: Character[], onNavigate: (page: string, id?: string) => void, onAddClick: () => void }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('全部状态');
  const [gameFilter, setGameFilter] = useState<string>('全部游戏');

  const filtered = characters.filter(c => {
    const matchesSearch = c.name.includes(search) || c.game.includes(search);
    const matchesStatus = statusFilter === '全部状态' || c.status === statusFilter;
    const matchesGame = gameFilter === '全部游戏' || c.game === gameFilter;
    return matchesSearch && matchesStatus && matchesGame;
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">角色管理</h1>
          <p className="text-slate-500 mt-1">管理所有角色立项与基础信息。</p>
        </div>
        <button 
          onClick={onAddClick}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
        >
          <Plus size={20} />
          <span>角色立项</span>
        </button>
      </header>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="搜索角色名、游戏..." 
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-400" />
            <select 
              className="bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-medium text-slate-600 focus:ring-2 focus:ring-indigo-500"
              value={gameFilter}
              onChange={e => setGameFilter(e.target.value)}
            >
              <option>全部游戏</option>
              <option>原神</option>
              <option>绝区零</option>
              <option>崩坏：星穹铁道</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <select 
              className="bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-medium text-slate-600 focus:ring-2 focus:ring-indigo-500"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option>全部状态</option>
              <option>立项中</option>
              <option>开发中</option>
              <option>待上线</option>
              <option>已上线</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map(char => (
          <motion.div 
            layout
            key={char.id} 
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onNavigate('角色详情', char.id)}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={cn(
                  "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                  char.rarity === 'SSR' ? "bg-amber-100 text-amber-700" : "bg-purple-100 text-purple-700"
                )}>
                  {char.rarity}
                </div>
                <div className={cn(
                  "px-2 py-1 rounded-full text-[10px] font-medium",
                  char.status === '已上线' ? "bg-emerald-100 text-emerald-700" : 
                  char.status === '待上线' ? "bg-indigo-100 text-indigo-700" :
                  char.status === '开发中' ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"
                )}>
                  {char.status}
                </div>
              </div>
              <div className="flex items-center gap-4">
                {char.assets?.portrait && (
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 shrink-0">
                    <img src={char.assets.portrait} alt={char.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{char.name}</h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {char.game} · {char.version}
                  </p>
                </div>
              </div>
              
              <div className="mt-6 space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">开发进度</span>
                  <span className="font-medium text-slate-700">{char.overallProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      char.overallProgress === 100 ? "bg-emerald-500" : "bg-indigo-500"
                    )} 
                    style={{ width: `${char.overallProgress}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <span className="text-xs text-slate-400">创建于 {char.createTime}</span>
              <span className="text-xs font-medium text-indigo-600 flex items-center gap-1">
                详情 <ChevronRight size={14} />
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const SubmissionModal = ({ isOpen, onClose, stage, character, onToggleStatus }: { isOpen: boolean, onClose: () => void, stage: string, character: Character, onToggleStatus: () => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!isOpen) return null;

  const isCompleted = stage ? character.progress[stage as keyof DevelopmentProgress] : false;

  const getStageContent = () => {
    switch (stage) {
      case 'concept': return { title: '设定', content: character.worldview + '\n\n' + character.background, type: 'text' };
      case 'illustration': return { title: '原画', content: character.assets?.conceptArt || 'https://picsum.photos/seed/character_art/1200/800', type: 'image' };
      case 'modeling': {
        const modelContent = character.assets?.modelPreview || 'https://picsum.photos/seed/modeling/1200/800';
        return { title: '建模', content: modelContent, type: isModelAsset(modelContent) ? 'model' : 'image' };
      }
      case 'skills': return { title: '技能', content: '技能动作模组与特效表现已完成初步验收，目前正在进行打击感调优。', type: 'text' };
      case 'stats': return { title: '数值', content: '基础属性、成长曲线及技能倍率已录入测试服，正在进行多场景模拟测试。', type: 'text' };
      case 'voice': return { title: '配音', content: '中/日/英三语配音已完成录制与后期处理，音频资源已导入引擎。', type: 'text' };
      case 'pv': {
        const pvContent = character.assets?.pvUrl || 'https://picsum.photos/seed/pv_thumbnail/1200/675';
        return { title: 'PV', content: pvContent, type: isVideoAsset(pvContent) ? 'video' : 'image' };
      }
      case 'config': return { title: '配置', content: '角色 ID、卡池关联、多语言文本等配置项已就绪，等待最终热更测试。', type: 'text' };
      case 'marketing': return { title: '宣发', content: '立绘切图、社交媒体海报、版本前瞻素材已打包，计划于下周一开始预热。', type: 'text' };
      default: return { title: '提交内容', content: '暂无详细内容。', type: 'text' };
    }
  };

  const { title, content, type } = getStageContent();
  const characterName = character.name;

  // Initialize edited content if not set
  if (isEditing && !editedContent) {
    setEditedContent(content);
  }

  const handleSave = () => {
    // In a real app, we would save this to a database
    setIsEditing(false);
    setEditedContent('');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden"
      >
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              isCompleted ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
            )}>
              {isCompleted ? <CheckCircle2 size={24} /> : <Clock size={24} />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{characterName} - {title}内容</h2>
              <p className="text-sm text-slate-500 mt-0.5">状态: <span className={cn("font-bold", isCompleted ? "text-emerald-600" : "text-amber-600")}>{isCompleted ? '已完成' : '进行中/待处理'}</span></p>
            </div>
          </div>
          <button onClick={() => { setIsEditing(false); onClose(); }} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-8">
          {type === 'image' ? (
            <div 
              className="rounded-2xl overflow-hidden border border-slate-100 shadow-inner bg-slate-50 aspect-video flex items-center justify-center relative group cursor-zoom-in"
              onClick={() => setIsFullscreen(true)}
            >
              <img src={content} alt={title} className="w-full h-full object-contain bg-slate-100/50" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="bg-white text-slate-900 px-6 py-2.5 rounded-xl font-bold text-sm shadow-xl flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-all">
                  <Search size={16} /> 点击查看全画立绘
                </div>
              </div>
            </div>
          ) : type === 'model' ? (
            <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-inner bg-slate-50 aspect-video">
              <ModelPreview src={content} interactive className="h-full w-full" />
            </div>
          ) : type === 'video' ? (
            <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-inner bg-black aspect-video">
              <video
                src={content}
                controls
                preload="metadata"
                className="w-full h-full"
              />
            </div>
          ) : (
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 min-h-[200px] flex flex-col justify-between">
              {isEditing ? (
                <textarea 
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full h-40 bg-white border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none text-slate-700"
                  placeholder="请输入修改内容..."
                />
              ) : (
                <p className="text-slate-700 leading-relaxed text-lg">{content}</p>
              )}
              <div className="mt-8 flex items-center gap-2 text-xs text-slate-400">
                <Clock size={14} />
                最后更新于 2024-03-25 10:30
              </div>
            </div>
          )}
        </div>

        <div className="px-8 py-6 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex gap-3">
            {!isEditing ? (
              <>
                <button 
                  onClick={() => {
                    onToggleStatus();
                    onClose();
                  }}
                  className={cn(
                    "px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2",
                    isCompleted 
                      ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100" 
                      : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100"
                  )}
                >
                  {isCompleted ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                  {isCompleted ? '申请返工' : '标记为已完成'}
                </button>
                {type === 'text' && (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-white transition-all"
                  >
                    修改内容
                  </button>
                )}
              </>
            ) : (
              <>
                <button 
                  onClick={handleSave}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  保存修改
                </button>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-white transition-all"
                >
                  取消
                </button>
              </>
            )}
          </div>
          <button 
            onClick={() => { setIsEditing(false); onClose(); }}
            className="px-8 py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
          >
            关闭预览
          </button>
        </div>
      </motion.div>

      {/* Fullscreen Image Overlay */}
      {isFullscreen && type === 'image' && (
        <div 
          className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setIsFullscreen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative max-w-full max-h-full"
          >
            <img 
              src={content} 
              alt={title} 
              className="max-w-full max-h-screen object-contain shadow-2xl rounded-lg"
              referrerPolicy="no-referrer" 
            />
            <button 
              onClick={(e) => { e.stopPropagation(); setIsFullscreen(false); }}
              className="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors flex items-center gap-2 font-bold"
            >
              <X size={24} /> 关闭大图
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const EditCharacterModal = ({ isOpen, onClose, character, onUpdate }: { isOpen: boolean, onClose: () => void, character: Character, onAdd?: (char: Character) => void, onUpdate: (id: string, updates: Partial<Character>) => void }) => {
  const [formData, setFormData] = useState({
    name: character.name,
    company: character.company,
    game: character.game,
    version: character.version,
    rarity: character.rarity,
    position: character.position,
    weaponType: character.weaponType,
    worldview: character.worldview,
    background: character.background,
    sellingPoints: character.sellingPoints,
    currentStage: character.currentStage,
    nextMilestone: character.nextMilestone,
    riskNote: character.riskNote,
    isDelayed: character.isDelayed,
    assets: character.assets || {}
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(character.id, formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
      >
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">编辑角色信息</h2>
            <p className="text-sm text-slate-500 mt-0.5">修改角色基础设定与开发状态</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">角色名称</label>
              <input 
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">所属游戏</label>
              <select 
                required
                value={formData.game}
                onChange={e => setFormData({...formData, game: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              >
                <option value="原神">原神</option>
                <option value="绝区零">绝区零</option>
                <option value="崩坏：星穹铁道">崩坏：星穹铁道</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">版本号</label>
              <input 
                value={formData.version}
                onChange={e => setFormData({...formData, version: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">稀有度</label>
              <select 
                value={formData.rarity}
                onChange={e => setFormData({...formData, rarity: e.target.value as any})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              >
                <option value="SSR">SSR</option>
                <option value="SR">SR</option>
                <option value="R">R</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">定位</label>
              <input 
                value={formData.position}
                onChange={e => setFormData({...formData, position: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">世界观设定</label>
            <textarea 
              value={formData.worldview}
              onChange={e => setFormData({...formData, worldview: e.target.value})}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-24 resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">人设背景</label>
            <textarea 
              value={formData.background}
              onChange={e => setFormData({...formData, background: e.target.value})}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-24 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">当前阶段</label>
              <input 
                value={formData.currentStage}
                onChange={e => setFormData({...formData, currentStage: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">下个节点</label>
              <input 
                value={formData.nextMilestone}
                onChange={e => setFormData({...formData, nextMilestone: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <input 
              type="checkbox"
              id="isDelayedEdit"
              checked={formData.isDelayed}
              onChange={e => setFormData({...formData, isDelayed: e.target.checked})}
              className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="isDelayedEdit" className="text-sm font-bold text-slate-700">项目进度延迟风险</label>
            {formData.isDelayed && (
              <input 
                placeholder="风险备注..."
                value={formData.riskNote}
                onChange={e => setFormData({...formData, riskNote: e.target.value})}
                className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500"
              />
            )}
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">素材资源 (URL)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">角色头像</label>
                <input 
                  value={formData.assets?.portrait || ''}
                  onChange={e => setFormData({...formData, assets: { ...formData.assets, portrait: e.target.value }})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-xs"
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">角色原画</label>
                <input 
                  value={formData.assets?.conceptArt || ''}
                  onChange={e => setFormData({...formData, assets: { ...formData.assets, conceptArt: e.target.value }})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-xs"
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">3D 建模预览</label>
                <input 
                  value={formData.assets?.modelPreview || ''}
                  onChange={e => setFormData({...formData, assets: { ...formData.assets, modelPreview: e.target.value }})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-xs"
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">PV 视频/封面</label>
                <input 
                  value={formData.assets?.pvUrl || ''}
                  onChange={e => setFormData({...formData, assets: { ...formData.assets, pvUrl: e.target.value }})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-xs"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
        </form>

        <div className="px-8 py-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-white transition-all">取消</button>
          <button onClick={handleSubmit} className="px-8 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">保存修改</button>
        </div>
      </motion.div>
    </div>
  );
};

const CharacterDetail = ({ character, onNavigate, onUpdateCharacter, initialStage }: { character: Character, onNavigate: (page: string, id?: string, stage?: string) => void, onUpdateCharacter: (id: string, updates: Partial<Character>) => void, initialStage?: string | null }) => {
  const [viewingStage, setViewingStage] = useState<string | null>(initialStage || null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  React.useEffect(() => {
    if (initialStage) {
      setViewingStage(initialStage);
    }
  }, [initialStage]);

  if (!character) return <div>未找到角色</div>;

  const handleToggleStatus = () => {
    if (!viewingStage) return;
    const isCurrentlyCompleted = character.progress[viewingStage as keyof DevelopmentProgress];
    const newProgress = { ...character.progress, [viewingStage]: !isCurrentlyCompleted };
    
    // Calculate overall progress
    const completedCount = Object.values(newProgress).filter(Boolean).length;
    const totalCount = Object.keys(newProgress).length;
    const overallProgress = Math.round((completedCount / totalCount) * 100);
    
    // Manage rework stages
    let newReworkStages = [...(character.reworkStages || [])];
    if (isCurrentlyCompleted) {
      // Marking as rework
      if (!newReworkStages.includes(viewingStage)) {
        newReworkStages.push(viewingStage);
      }
    } else {
      // Marking as completed (clearing rework)
      newReworkStages = newReworkStages.filter(s => s !== viewingStage);
    }

    // Determine currentStage and nextMilestone
    const STAGE_NAMES: Record<string, string> = {
      concept: '设定',
      illustration: '原画',
      modeling: '建模',
      skills: '技能',
      stats: '数值',
      voice: '配音',
      pv: 'PV',
      config: '配置',
      marketing: '宣发'
    };
    const STAGE_ORDER = ['concept', 'illustration', 'modeling', 'skills', 'stats', 'voice', 'pv', 'config', 'marketing'];

    let currentStage = character.currentStage;
    let nextMilestone = character.nextMilestone;
    let status = character.status;

    if (isCurrentlyCompleted) {
      // If we just marked a stage for rework
      currentStage = `${STAGE_NAMES[viewingStage]}返工中`;
      nextMilestone = `${STAGE_NAMES[viewingStage]}重新评审`;
      if (status === '已上线' || status === '待上线') {
        status = '开发中';
      }
    } else {
      // If we just completed a stage
      const nextStageIndex = STAGE_ORDER.indexOf(viewingStage) + 1;
      if (nextStageIndex < STAGE_ORDER.length) {
        const nextStage = STAGE_ORDER[nextStageIndex];
        currentStage = `${STAGE_NAMES[nextStage]}进行中`;
        nextMilestone = `${STAGE_NAMES[nextStage]}评审`;
      } else {
        currentStage = '开发完成';
        nextMilestone = '上线准备';
        status = '待上线';
      }
    }

    onUpdateCharacter(character.id, { 
      progress: newProgress,
      reworkStages: newReworkStages,
      overallProgress,
      currentStage,
      nextMilestone,
      status
    });
  };

  return (
    <div className="space-y-8">
      <SubmissionModal 
        isOpen={!!viewingStage} 
        onClose={() => setViewingStage(null)} 
        stage={viewingStage || ''} 
        character={character}
        onToggleStatus={handleToggleStatus}
      />
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('角色管理')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronRight size={24} className="rotate-180 text-slate-400" />
          </button>
          <div className="flex items-center gap-5">
            {character.assets?.portrait && (
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-lg bg-slate-100">
                <img src={character.assets.portrait} alt={character.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{character.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-slate-500 font-medium">{character.game} · {character.version}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className={cn(
                  "font-bold",
                  character.rarity === 'SSR' ? "text-amber-500" : "text-purple-500"
                )}>{character.rarity}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
          >
            编辑信息
          </button>
          <button className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-colors">导出报告</button>
        </div>
      </header>

      <EditCharacterModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        character={character} 
        onUpdate={onUpdateCharacter} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Info & Design */}
        <div className="lg:col-span-2 space-y-8">
          {/* Basic Info & Design Section */}
          <div 
            onClick={() => setIsEditModalOpen(true)}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden cursor-pointer hover:border-indigo-200 hover:shadow-md transition-all group relative"
          >
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                点击修改 <ChevronRight size={12} />
              </div>
            </div>
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="font-bold text-slate-900">基础设定与设计</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">定位与武器</label>
                  <p className="text-slate-900 font-medium mt-1">{character.position} · {character.weaponType}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">性格标签</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {character.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md">{tag}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">核心卖点</label>
                  <p className="text-slate-700 text-sm mt-1 leading-relaxed">{character.sellingPoints}</p>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">世界观设定</label>
                  <p className="text-slate-700 text-sm mt-1 leading-relaxed">{character.worldview}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">人设背景</label>
                  <p className="text-slate-700 text-sm mt-1 leading-relaxed">{character.background}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Media Assets Section */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="font-bold text-slate-900">角色立绘与素材预览</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">角色原画</span>
                  <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-50 border border-slate-100 group relative cursor-pointer" onClick={() => setViewingStage('illustration')}>
                    <img src={character.assets?.conceptArt || 'https://picsum.photos/seed/art/800/1200'} alt="原画" className="w-full h-full object-cover transition-transform group-hover:scale-110" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-bold bg-black/40 px-3 py-1.5 rounded-lg backdrop-blur-sm">查看详情</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">3D 建模预览</span>
                  <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-50 border border-slate-100 group relative cursor-pointer" onClick={() => setViewingStage('modeling')}>
                    {isModelAsset(character.assets?.modelPreview) ? (
                      <ModelPreview src={character.assets!.modelPreview!} className="h-full w-full transition-transform group-hover:scale-110" />
                    ) : (
                      <img src={character.assets?.modelPreview || 'https://picsum.photos/seed/model/800/1200'} alt="建模" className="w-full h-full object-cover transition-transform group-hover:scale-110" referrerPolicy="no-referrer" />
                    )}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-bold bg-black/40 px-3 py-1.5 rounded-lg backdrop-blur-sm">查看详情</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PV 预告片</span>
                  <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-50 border border-slate-100 group relative cursor-pointer" onClick={() => setViewingStage('pv')}>
                    {isVideoAsset(character.assets?.pvUrl) ? (
                      <video
                        src={character.assets?.pvUrl}
                        muted
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      />
                    ) : (
                      <img src={character.assets?.pvUrl || 'https://picsum.photos/seed/pv/800/1200'} alt="PV" className="w-full h-full object-cover transition-transform group-hover:scale-110" referrerPolicy="no-referrer" />
                    )}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-bold bg-black/40 px-3 py-1.5 rounded-lg backdrop-blur-sm">查看详情</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Development Progress Section */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-4 flex justify-between items-center">
              <h2 className="font-bold text-slate-900">开发进度详情</h2>
              <span className="text-sm font-bold text-indigo-600">{character.overallProgress}%</span>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {Object.entries(character.progress).map(([key, value]) => {
                  const isReworking = character.reworkStages?.includes(key);
                  return (
                    <div 
                      key={key} 
                      onClick={() => setViewingStage(key)}
                      className={cn(
                        "p-3 rounded-xl border flex flex-col items-center gap-2 text-center transition-all cursor-pointer group",
                        value ? "bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100" : 
                        isReworking ? "bg-red-50 border-red-100 text-red-600 hover:bg-red-100" :
                        "bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100"
                      )}
                    >
                      <div className="relative">
                        {value ? <CheckCircle2 size={20} /> : isReworking ? <RotateCcw size={20} className="animate-spin-slow" /> : <Clock size={20} />}
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="text-xs font-bold capitalize">
                        {key === 'concept' ? '设定' : 
                         key === 'illustration' ? '原画' : 
                         key === 'modeling' ? '建模' : 
                         key === 'skills' ? '技能' : 
                         key === 'stats' ? '数值' : 
                         key === 'voice' ? '配音' : 
                         key === 'pv' ? 'PV' : 
                         key === 'config' ? '配置' : '宣发'}
                      </span>
                      <div className="text-[10px] opacity-60">
                        {value ? '已完成' : isReworking ? '返工中' : '未开始'}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div 
                onClick={() => setIsEditModalOpen(true)}
                className="mt-8 p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-white hover:border-indigo-100 transition-all group relative"
              >
                <div className="absolute -top-3 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">点击修改状态</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase">当前阶段</div>
                  <div className="text-slate-900 font-bold">{character.currentStage}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase">下个节点</div>
                  <div className="text-slate-900 font-bold">{character.nextMilestone}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase">风险提示</div>
                  <div className={cn("font-bold", character.isDelayed ? "text-red-500" : "text-emerald-500")}>
                    {character.isDelayed ? character.riskNote : '正常推进'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Performance & Review */}
        <div className="space-y-8">
          {character.status === '已上线' && character.performance && (
            <div 
              onClick={() => onNavigate('数据分析')}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden cursor-pointer hover:border-indigo-200 hover:shadow-md transition-all group relative"
            >
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                  查看详情 <ChevronRight size={10} />
                </div>
              </div>
              <div className="border-b border-slate-100 px-6 py-4">
                <h2 className="font-bold text-slate-900">上线后表现</h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                    <div className="text-[10px] font-bold text-indigo-400 uppercase">首日流水</div>
                    <div className="text-lg font-bold text-indigo-900">¥{(character.performance.firstDayRevenue / 10000).toFixed(0)}w</div>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                    <div className="text-[10px] font-bold text-amber-400 uppercase">热度峰值</div>
                    <div className="text-lg font-bold text-amber-900">{character.performance.peakPopularity}</div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">首周流水</span>
                    <span className="text-sm font-bold text-slate-900">¥{(character.performance.firstWeekRevenue / 10000).toFixed(0)}w</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">最高排名</span>
                    <span className="text-sm font-bold text-slate-900">No.{character.performance.rank}</span>
                  </div>
                </div>

                {character.review && (
                  <div className="mt-6 p-4 rounded-xl bg-slate-900 text-white">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">复盘总结</span>
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full",
                        character.review.tag === '表现优秀' ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-700 text-slate-300"
                      )}>{character.review.tag}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed italic">"{character.review.summary}"</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-bold text-slate-900 mb-4">操作日志</h2>
            <div className="space-y-4">
              {[
                { time: '2024-03-20 14:20', user: '张三', action: '更新了开发进度' },
                { time: '2024-03-18 09:15', user: '李四', action: '上传了新版原画' },
                { time: '2024-03-15 11:00', user: '王五', action: '确认了技能数值' },
              ].map((log, i) => (
                <div key={i} className="flex gap-3 text-xs">
                  <div className="w-1 h-full bg-slate-100 rounded-full shrink-0" />
                  <div>
                    <div className="text-slate-400">{log.time}</div>
                    <div className="text-slate-700 mt-0.5"><span className="font-bold">{log.user}</span> {log.action}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DevelopmentProgressPage = ({ characters, onNavigate }: { characters: Character[], onNavigate: (page: string, id?: string) => void }) => {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">开发进度看板</h1>
        <p className="text-slate-500 mt-1">统一查看所有在研角色的进度与风险。</p>
      </header>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">角色名称</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">当前阶段</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">进度百分比</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">下个节点</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">状态</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">备注</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {characters.filter(c => c.status !== '已上线').map(char => (
                <tr 
                  key={char.id} 
                  onClick={() => onNavigate('角色详情', char.id)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                      {char.name}
                      <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-all text-indigo-400" />
                    </div>
                    <div className="text-xs text-slate-400">{char.game}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{char.currentStage}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${char.overallProgress}%` }} />
                      </div>
                      <span className="text-xs font-bold text-slate-700">{char.overallProgress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{char.nextMilestone}</td>
                  <td className="px-6 py-4">
                    {char.reworkStages && char.reworkStages.length > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
                        <RotateCcw size={12} className="animate-spin-slow" /> 正在返工
                      </span>
                    ) : char.isDelayed ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                        <AlertCircle size={12} /> 延期风险
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                        <CheckCircle2 size={12} /> 正常推进
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400 max-w-[200px] truncate">{char.riskNote}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const LaunchChecklist = ({ characters, onUpdateCharacter, onNavigate }: { characters: Character[], onUpdateCharacter: (id: string, updates: Partial<Character>) => void, onNavigate: (page: string, id?: string, stage?: string) => void }) => {
  const [selectedId, setSelectedId] = useState(characters.find(c => c.status === '待上线')?.id || characters[0].id);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const char = characters.find(c => c.id === selectedId)!;

  const STAGE_NAMES: Record<string, string> = {
    concept: '设定',
    illustration: '原画',
    modeling: '建模',
    skills: '技能',
    stats: '数值',
    voice: '配音',
    pv: 'PV',
    config: '配置',
    marketing: '宣发'
  };

  const checklistItems = [
    { label: '设定是否完成', key: 'concept' },
    { label: '原画是否完成', key: 'illustration' },
    { label: '建模是否完成', key: 'modeling' },
    { label: '技能方案是否确认', key: 'skills' },
    { label: '数值是否确认', key: 'stats' },
    { label: '配音是否完成', key: 'voice' },
    { label: 'PV是否完成', key: 'pv' },
    { label: '卡池信息是否配置', key: 'config' },
    { label: '宣发素材是否齐备', key: 'marketing' },
  ];

  const completedCount = Object.values(char.progress).filter(Boolean).length;
  const passRate = Math.round((completedCount / checklistItems.length) * 100);

  const handleToggleItem = (key: string) => {
    const isCurrentlyCompleted = char.progress[key as keyof DevelopmentProgress];
    const newProgress = { ...char.progress, [key]: !isCurrentlyCompleted };
    
    const newCompletedCount = Object.values(newProgress).filter(Boolean).length;
    const overallProgress = Math.round((newCompletedCount / checklistItems.length) * 100);

    // Business logic for status and stages
    const STAGE_ORDER = ['concept', 'illustration', 'modeling', 'skills', 'stats', 'voice', 'pv', 'config', 'marketing'];
    let currentStage = char.currentStage;
    let nextMilestone = char.nextMilestone;
    let status = char.status;
    let newReworkStages = [...(char.reworkStages || [])];

    if (isCurrentlyCompleted) {
      // Marking as rework
      if (!newReworkStages.includes(key)) {
        newReworkStages.push(key);
      }
      currentStage = `${STAGE_NAMES[key]}返工中`;
      nextMilestone = `${STAGE_NAMES[key]}重新评审`;
      status = '开发中';
    } else {
      // Marking as completed
      newReworkStages = newReworkStages.filter(s => s !== key);
      const nextStageIndex = STAGE_ORDER.indexOf(key) + 1;
      if (nextStageIndex < STAGE_ORDER.length) {
        const nextStage = STAGE_ORDER[nextStageIndex];
        currentStage = `${STAGE_NAMES[nextStage]}进行中`;
        nextMilestone = `${STAGE_NAMES[nextStage]}评审`;
      } else {
        currentStage = '开发完成';
        nextMilestone = '上线准备';
        status = '待上线';
      }
    }

    onUpdateCharacter(char.id, { 
      progress: newProgress,
      reworkStages: newReworkStages,
      overallProgress,
      currentStage,
      nextMilestone,
      status
    });
  };

  const handleSave = () => {
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 2000);
  };

  const handleLaunch = () => {
    if (passRate < 100) return;
    
    const performance: PerformanceData = {
      firstDayRevenue: 12000000,
      firstThreeDaysRevenue: 28000000,
      firstWeekRevenue: 45000000,
      peakPopularity: 9200,
      rank: 2,
      revenueTrend: Array.from({ length: 7 }, (_, i) => ({
        date: `Day ${i + 1}`,
        value: 10000000 + Math.random() * 5000000
      })),
      popularityTrend: Array.from({ length: 7 }, (_, i) => ({
        date: `Day ${i + 1}`,
        value: 8000 + Math.random() * 2000
      }))
    };

    onUpdateCharacter(char.id, {
      status: '已上线',
      launchTime: new Date().toISOString().split('T')[0],
      performance,
      review: {
        summary: '该角色上线后表现强劲，首周流水超出预期，社区讨论度极高。',
        tag: '表现优秀'
      }
    });
    
    onNavigate('数据分析', char.id);
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">上线检查</h1>
          <p className="text-slate-500 mt-1">上线前最后确认，确保角色品质与合规。</p>
        </div>
        <AnimatePresence>
          {showSaveSuccess && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg flex items-center gap-2"
            >
              <CheckCircle2 size={16} /> 进度已保存
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-2">待检查角色</h2>
          <div className="space-y-2">
            {characters.filter(c => c.status === '待上线' || c.status === '开发中').map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={cn(
                  "w-full text-left p-3 rounded-2xl border transition-all flex items-center gap-3",
                  selectedId === c.id 
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100" 
                    : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50"
                )}
              >
                {c.assets?.portrait && (
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/20 shrink-0">
                    <img src={c.assets.portrait} alt={c.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-bold truncate">{c.name}</div>
                  <div className={cn("text-[10px] mt-0.5 truncate", selectedId === c.id ? "text-indigo-100" : "text-slate-400")}>
                    {c.game} · {c.version}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{char.name} 上线检查清单</h2>
                <p className="text-slate-500 text-sm mt-1">当前通过率: {passRate}%</p>
              </div>
              <div className={cn(
                "px-4 py-2 rounded-xl font-bold",
                passRate === 100 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              )}>
                {passRate === 100 ? '准许上线' : '暂不满足上线条件'}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {checklistItems.map((item, i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-50 bg-slate-50/50 group"
                >
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleToggleItem(item.key)}
                      className="w-5 h-5 rounded border border-slate-300 flex items-center justify-center hover:border-indigo-500 transition-colors"
                    >
                      {char.progress[item.key as keyof typeof char.progress] && <div className="w-3 h-3 bg-indigo-600 rounded-sm" />}
                    </button>
                    <span className="text-slate-700 font-medium">{item.label}</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {char.progress[item.key as keyof typeof char.progress] ? (
                      <div className="flex items-center gap-1 text-emerald-600 font-bold text-sm">
                        <CheckCircle2 size={18} /> 已完成
                      </div>
                    ) : char.reworkStages?.includes(item.key) ? (
                      <div className="flex items-center gap-1 text-red-500 font-bold text-sm">
                        <RotateCcw size={18} className="animate-spin-slow" /> 返工中
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-slate-400 font-bold text-sm">
                        <Clock size={18} /> 未完成
                      </div>
                    )}
                    
                    <button 
                      onClick={() => onNavigate('角色详情', char.id, item.key)}
                      className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      title="查看详情"
                    >
                      <ExternalLink size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={handleSave}
                className="px-6 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
              >
                保存进度
              </button>
              <button 
                disabled={passRate < 100}
                onClick={handleLaunch}
                className={cn(
                  "px-6 py-2 rounded-xl font-medium shadow-lg transition-all",
                  passRate === 100 
                    ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100" 
                    : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                )}
              >
                确认上线
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DataAnalysis = ({ characters }: { characters: Character[] }) => {
  const launched = characters.filter(c => c.status === '已上线' && c.performance);
  const [selectedId, setSelectedId] = useState(launched[0]?.id);
  const [companyFilter, setCompanyFilter] = useState<'全部' | '米哈游' | '鹰角网络' | '库洛游戏'>('全部');
  
  const filteredLaunched = launched.filter(c => companyFilter === '全部' || c.company === companyFilter);
  const char = launched.find(c => c.id === selectedId) || filteredLaunched[0];

  const companyStats = useMemo(() => {
    const companies = ['米哈游', '鹰角网络', '库洛游戏'] as const;
    return companies.map(company => {
      const companyChars = launched.filter(c => c.company === company);
      const avgRevenue = companyChars.length > 0 
        ? companyChars.reduce((acc, c) => acc + c.performance!.firstWeekRevenue, 0) / companyChars.length 
        : 0;
      const avgPopularity = companyChars.length > 0 
        ? companyChars.reduce((acc, c) => acc + c.performance!.peakPopularity, 0) / companyChars.length 
        : 0;
      return {
        name: company,
        avgRevenue: avgRevenue / 10000,
        avgPopularity,
        count: companyChars.length
      };
    });
  }, [launched]);

  if (!char) return <div className="p-12 text-center text-slate-500 bg-white rounded-3xl border border-dashed border-slate-200">暂无上线数据</div>;

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">数据分析</h1>
          <p className="text-slate-500 mt-1">横向对比各厂商角色表现，洞察市场趋势。</p>
        </div>
      </header>

      {/* Company Overview Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-900">厂商平均表现对比</h2>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500" /> 平均首周流水(w)</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500" /> 平均热度峰值</div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={companyStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#f59e0b', fontSize: 12}} domain={[0, 100]} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                />
                <Bar yAxisId="left" dataKey="avgRevenue" name="平均首周流水(w)" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
                <Bar yAxisId="right" dataKey="avgPopularity" name="平均热度峰值" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          {companyStats.map(stat => (
            <div key={stat.name} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-100 transition-all">
              <div>
                <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{stat.name}</div>
                <div className="text-xs text-slate-400 mt-0.5">已收录 {stat.count} 个角色数据</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-black text-slate-900">¥{stat.avgRevenue.toFixed(0)}w</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">平均首周流水</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="sticky top-0 z-20 py-3 bg-slate-50/90 backdrop-blur-md -mx-4 px-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 mb-4 shadow-sm transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
          <div>
            <h2 className="font-bold text-slate-900 leading-none">个体角色深度分析</h2>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-bold">Individual Character Insights</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-200/40 p-1 rounded-xl border border-slate-200/50">
            {(['全部', '米哈游', '鹰角网络', '库洛游戏'] as const).map(lib => (
              <button
                key={lib}
                onClick={() => setCompanyFilter(lib)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-200",
                  companyFilter === lib 
                    ? "bg-white text-indigo-600 shadow-md scale-105" 
                    : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                )}
              >
                {lib}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {char.assets?.portrait && (
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                <img src={char.assets.portrait} alt={char.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            )}
            <div className="relative group">
              <select 
                className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2 pr-10 text-sm font-bold text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none min-w-[220px] cursor-pointer hover:border-indigo-300 transition-colors"
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
              >
                {filteredLaunched.map(c => <option key={c.id} value={c.id}>{c.name} ({c.game})</option>)}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-indigo-500 transition-colors">
                <ChevronRight size={16} className="rotate-90" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp size={80} />
          </div>
          <div className="text-xs font-bold text-slate-400 uppercase mb-1">首周总流水</div>
          <div className="text-4xl font-black text-slate-900">¥{(char.performance!.firstWeekRevenue / 10000).toFixed(0)}w</div>
          <div className="flex items-center gap-1 text-emerald-500 text-xs mt-3 font-bold">
            <ArrowUpRight size={14} /> 超过 85% 的同类角色
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users size={80} />
          </div>
          <div className="text-xs font-bold text-slate-400 uppercase mb-1">热度峰值</div>
          <div className="text-4xl font-black text-slate-900">{char.performance!.peakPopularity}</div>
          <div className="flex items-center gap-1 text-emerald-500 text-xs mt-3 font-bold">
            <ArrowUpRight size={14} /> 历史最高热度前 5
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <BarChart3 size={80} />
          </div>
          <div className="text-xs font-bold text-slate-400 uppercase mb-1">畅销榜最高排名</div>
          <div className="text-4xl font-black text-slate-900">No.{char.performance!.rank}</div>
          <div className="flex items-center gap-1 text-slate-400 text-xs mt-3 font-bold">
            保持在榜首 3 天
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-slate-900">{char.name} 流水趋势</h2>
            <div className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full uppercase tracking-widest">{char.game}</div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={char.performance!.revenueTrend}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-slate-900">{char.name} 热度趋势</h2>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-xs font-bold text-slate-500">实时热度指数</span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={char.performance!.popularityTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                />
                <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={4} dot={{r: 6, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 8, strokeWidth: 0}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const ComparisonReview = ({ characters }: { characters: Character[] }) => {
  const launched = characters.filter(c => c.status === '已上线' && c.performance);
  const [compIds, setCompIds] = useState<string[]>([launched[0]?.id, launched[1]?.id].filter(Boolean));
  const [companyFilter, setCompanyFilter] = useState<'全部' | '米哈游' | '鹰角网络' | '库洛游戏'>('全部');

  const filteredLaunched = launched.filter(c => companyFilter === '全部' || c.company === companyFilter);

  const toggleChar = (id: string) => {
    if (compIds.includes(id)) {
      setCompIds(compIds.filter(cid => cid !== id));
    } else if (compIds.length < 3) {
      setCompIds([...compIds, id]);
    }
  };

  const selectedChars = launched.filter(c => compIds.includes(c.id));

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">对比与复盘</h1>
          <p className="text-slate-500 mt-1">横向对比角色表现，沉淀开发经验。</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {(['全部', '米哈游', '鹰角网络', '库洛游戏'] as const).map(lib => (
            <button
              key={lib}
              onClick={() => setCompanyFilter(lib)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-sm font-bold transition-all",
                companyFilter === lib ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {lib}
            </button>
          ))}
        </div>
      </header>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">选择对比角色 (最多3个)</h2>
        <div className="flex flex-wrap gap-3">
          {filteredLaunched.map(c => (
            <button
              key={c.id}
              onClick={() => toggleChar(c.id)}
              className={cn(
                "px-4 py-2 rounded-xl border font-medium transition-all flex items-center gap-2",
                compIds.includes(c.id) 
                  ? "bg-indigo-600 border-indigo-600 text-white" 
                  : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300"
              )}
            >
              {c.assets?.portrait && (
                <div className="w-5 h-5 rounded-full overflow-hidden shrink-0">
                  <img src={c.assets.portrait} alt={c.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              )}
              {c.name}
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-md",
                compIds.includes(c.id) ? "bg-indigo-500 text-indigo-100" : "bg-slate-100 text-slate-400"
              )}>{c.game}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">核心指标对比</h2>
          </div>
          <div className="p-6">
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={selectedChars.map(c => ({
                  name: c.name,
                  '首日流水(w)': c.performance!.firstDayRevenue / 10000,
                  '首周流水(w)': c.performance!.firstWeekRevenue / 10000,
                  '热度': c.performance!.peakPopularity
                }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#f59e0b'}} domain={[0, 100]} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none'}} />
                  <Legend iconType="circle" />
                  <Bar yAxisId="left" dataKey="首日流水(w)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="left" dataKey="首周流水(w)" fill="#818cf8" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="热度" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-2">复盘总结</h2>
          {selectedChars.map(c => (
            <div key={c.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  {c.assets?.portrait && (
                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-100">
                      <img src={c.assets.portrait} alt={c.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  )}
                  <h3 className="font-bold text-slate-900">{c.name}</h3>
                </div>
                <span className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full font-bold",
                  c.review?.tag === '表现优秀' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                )}>{c.review?.tag}</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed italic">"{c.review?.summary}"</p>
              <div className="mt-4 pt-4 border-t border-slate-50 flex flex-wrap gap-2">
                {c.tags.map(t => <span key={t} className="text-[10px] text-slate-400">#{t}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Main Layout ---

export default function App() {
  const [activePage, setActivePage] = useState('首页');
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [characters, setCharacters] = useState<Character[]>(MOCK_CHARACTERS);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const syncState = () => {
      setIsAudioPlaying(!audio.paused && !audio.ended);
    };

    const tryAutoPlay = async () => {
      try {
        audio.volume = 0.55;
        audio.currentTime = 0;
        await audio.play();
      } catch {
        // Autoplay may be blocked until the first user gesture.
      } finally {
        syncState();
      }
    };

    const playOnFirstGesture = () => {
      void tryAutoPlay();
    };

    void tryAutoPlay();
    audio.addEventListener('play', syncState);
    audio.addEventListener('pause', syncState);
    audio.addEventListener('ended', syncState);
    window.addEventListener('pointerdown', playOnFirstGesture, { once: true });
    window.addEventListener('keydown', playOnFirstGesture, { once: true });

    return () => {
      audio.removeEventListener('play', syncState);
      audio.removeEventListener('pause', syncState);
      audio.removeEventListener('ended', syncState);
      window.removeEventListener('pointerdown', playOnFirstGesture);
      window.removeEventListener('keydown', playOnFirstGesture);
    };
  }, []);

  const playAudioOnce = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      audio.pause();
      audio.currentTime = 0;
      await audio.play();
      setIsAudioPlaying(true);
    } catch {
      setIsAudioPlaying(false);
    }
  };

  const navigate = (page: string, id?: string, stage?: string) => {
    setActivePage(page);
    if (id) setSelectedCharId(id);
    if (stage) setSelectedStage(stage);
    else setSelectedStage(null);
  };

  const handleAddCharacter = (newChar: Character) => {
    setCharacters([newChar, ...characters]);
    navigate('角色管理');
  };

  const handleUpdateCharacter = (id: string, updates: Partial<Character>) => {
    setCharacters(characters.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const renderPage = () => {
    const mihoyoCharacters = characters.filter(c => c.company === '米哈游');
    
    switch (activePage) {
      case '首页': return <Dashboard characters={mihoyoCharacters} onNavigate={navigate} />;
      case '角色管理': return <CharacterList characters={mihoyoCharacters} onNavigate={navigate} onAddClick={() => setIsAddModalOpen(true)} />;
      case '角色详情': 
        const char = characters.find(c => c.id === selectedCharId);
        return char ? <CharacterDetail character={char} onNavigate={navigate} onUpdateCharacter={handleUpdateCharacter} initialStage={selectedStage} /> : <Dashboard characters={mihoyoCharacters} onNavigate={navigate} />;
      case '开发进度': return <DevelopmentProgressPage characters={mihoyoCharacters} onNavigate={navigate} />;
      case '上线检查': return <LaunchChecklist characters={mihoyoCharacters} onUpdateCharacter={handleUpdateCharacter} onNavigate={navigate} />;
      case '数据分析': return <DataAnalysis characters={characters} />;
      case '对比复盘': return <ComparisonReview characters={characters} />;
      default: return <Dashboard characters={mihoyoCharacters} onNavigate={navigate} />;
    }
  };

  const menuItems = [
    { label: '首页', icon: LayoutDashboard },
    { label: '角色管理', icon: Users },
    { label: '开发进度', icon: BarChart3 },
    { label: '上线检查', icon: ClipboardCheck },
    { label: '数据分析', icon: TrendingUp },
    { label: '对比复盘', icon: GitCompare },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <audio
        ref={audioRef}
        src="https://jthwds.oss-cn-hangzhou.aliyuncs.com/characters/intro.mp3"
        preload="auto"
        className="hidden"
      />
      <AddCharacterModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAdd={handleAddCharacter} 
      />
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full z-20">
        <div className="p-6">
          <div className="flex items-center gap-3 text-indigo-600">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <TrendingUp size={20} />
            </div>
            <span className="text-xl font-black tracking-tight">YuanShenNB</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 mt-4">
          {menuItems.map(item => (
            <SidebarItem 
              key={item.label}
              icon={item.icon}
              label={item.label}
              active={activePage === item.label || (activePage === '角色详情' && item.label === '角色管理')}
              onClick={() => navigate(item.label)}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
            <div className="w-8 h-8 rounded-full bg-slate-200" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-slate-900 truncate">Admin User</div>
              <div className="text-xs text-slate-400 truncate">zhangsier134@gmail.com</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage + (selectedCharId || '')}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <button
        type="button"
        onClick={() => void playAudioOnce()}
        className="fixed bottom-6 right-6 z-[80] flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-xl shadow-indigo-200 transition-all hover:bg-indigo-700"
      >
        <Volume2 size={18} />
        {isAudioPlaying ? '重新播放音乐' : '播放音乐'}
      </button>
    </div>
  );
}
