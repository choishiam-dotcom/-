
import React from 'react';
import { Library, LayoutDashboard, Sparkles, PieChart, Settings, Plus } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onAddBook: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onAddBook }) => {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: '대시보드' },
    { id: 'library', icon: Library, label: '내 서재' },
    { id: 'ai-center', icon: Sparkles, label: 'AI 추천' },
    { id: 'stats', icon: PieChart, label: '통계' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-stone-200 h-screen sticky top-0 flex flex-col hidden md:flex">
      <div className="p-8">
        <h1 className="text-2xl font-serif font-bold text-stone-800 flex items-center gap-2">
          <Library className="w-8 h-8 text-stone-900" />
          Luna
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                  ? 'bg-stone-900 text-white shadow-lg' 
                  : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-stone-100">
        <button 
          onClick={onAddBook}
          className="w-full flex items-center justify-center gap-2 bg-amber-100 text-amber-900 py-3 rounded-xl font-bold hover:bg-amber-200 transition-colors"
        >
          <Plus className="w-5 h-5" />
          책 추가하기
        </button>
      </div>

      <div className="p-6 text-stone-400 text-xs text-center">
        © 2024 Luna Library
      </div>
    </aside>
  );
};

export default Sidebar;
