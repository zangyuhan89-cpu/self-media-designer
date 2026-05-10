import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { toPng } from 'html-to-image';
import {
  Type, Image as ImageIcon, Download, Trash2,
  Layers, Palette, Tag, User, BringToFront, SendToBack,
  AlignLeft, AlignCenter, AlignRight,
  Sparkles, Key, Save, FolderOpen
} from 'lucide-react';
import { cn } from './lib/utils';

// --- Types ---
type ElementType = 'text' | 'image' | 'sticker' | 'profileCard';

interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number | string;
  height: number | string;
  zIndex: number;
  
  // Specific properties
  content?: string; // Text content, Image URL, or Sticker string
  color?: string; // Font color
  bgColor?: string; // Background color for stickers
  fontSize?: number;
  textAlign?: 'left' | 'center' | 'right';
  
  // Profile Card specific
  profileFields?: {
    id: string;
    label: string;
    value: string;
  }[];
}

const DEFAULT_PRESET_BGS = [
  '#ffffff', // 白色 White
  '#f3f4f6', // 灰色 Gray
  '#fdf2f8', // 浅粉色 Light Pink
  '#eff6ff', // 浅蓝色 Light Blue
  '#f0fdf4', // 浅绿色 Light Green
  '#fefce8', // 浅黄色 Light Yellow
  '#faf5ff', // 浅紫色 Light Purple
  '#fff7ed', // 浅橙色 Light Orange
  '#ecfeff', // 浅青色 Light Cyan
  '#fef2f2', // 浅红色 Light Red
];

export default function App() {
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [canvasBg, setCanvasBg] = useState<string>('#ffffff');
  const [presetBgs, setPresetBgs] = useState<string[]>(DEFAULT_PRESET_BGS);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  // --- AI State ---
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('deepseek_api_key') || '');
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStyle, setAiStyle] = useState<'xiaohongshu' | 'douyin'>('xiaohongshu');

  useEffect(() => {
    localStorage.setItem('deepseek_api_key', apiKey);
  }, [apiKey]);

  const handleOptimizeText = async (elementId: string, originalText: string) => {
    if (!apiKey.trim()) {
      alert('请先在左侧工具栏底部点击钥匙图标，设置 DeepSeek API Key');
      return;
    }
    if (!originalText.trim()) {
      alert('请先输入文案内容');
      return;
    }

    setAiLoading(true);
    try {
      const styleLabel = aiStyle === 'xiaohongshu' ? '小红书' : '抖音';

      const systemPrompt = aiStyle === 'xiaohongshu'
        ? `你是一个资深时尚穿搭博主，专门为小红书撰写爆款服装文案。

写作要求：
1. 语言精致有分享感，像闺蜜推荐一样自然
2. 适当使用 emoji（✨💕👗🔥等）增强可读性
3. 从以下维度全面介绍：面料质感、版型剪裁、做工细节、设计亮点、搭配建议、穿着体验
4. 用词专业但不生硬，让读者感受到你对服装的深刻理解
5. 突出"为什么值得买"，制造种草冲动
6. 合理分段，每段不宜过长，善用小标题
7. 结尾加互动引导（如"姐妹们冲不冲？"）
8. 控制在200字以内

输出优化后的纯文案，不要加"优化结果："之类的前缀。`
        : `你是一个资深抖音带货文案写手，专门为服装类商品撰写爆款短视频口播文案。

写作要求：
1. 口语化、快节奏、有冲击力，"我妈都觉得好看"这类接地气的表达
2. 适当使用 emoji（🔥💯👏等）增强节奏感
3. 从以下维度全面介绍：面料质感、版型剪裁、做工细节、设计亮点、性价比、穿着体验
4. 善用短句和感叹，制造紧迫感和下单冲动
5. 突出核心卖点和差异化，一句话抓住用户
6. 加入"全网都在找""闺蜜追着要链接"这类社交传播话术
7. 结尾加行动号召（如"赶紧冲！""手慢无！"）
8. 控制在150字以内

输出优化后的纯文案，不要加"优化结果："之类的前缀。`;

      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `请将以下服装文案优化为${styleLabel}风格：\n\n${originalText}` }
          ],
          temperature: 0.8,
          max_tokens: 800,
        }),
      });

      const data = await response.json();

      if (data.choices && data.choices[0]) {
        const optimized = data.choices[0].message.content.trim();
        updateElement(elementId, { content: optimized });
      } else if (data.error) {
        alert('API 错误：' + data.error.message);
      } else {
        alert('AI 返回异常，请检查 API Key 是否有效');
      }
    } catch (err) {
      console.error('AI优化请求失败', err);
      alert('请求失败，请检查网络连接和 API Key 是否正确');
    } finally {
      setAiLoading(false);
    }
  };

  // --- Actions ---
  const addElement = (element: Partial<CanvasElement>) => {
    const newElement: CanvasElement = {
      id: Date.now().toString(),
      type: 'text',
      x: 50,
      y: 50,
      width: 'auto',
      height: 'auto',
      zIndex: elements.length + 1,
      ...element,
    };
    setElements([...elements, newElement]);
    setSelectedId(newElement.id);
  };

  const addText = () => {
    addElement({
      type: 'text',
      content: '双击修改文字',
      color: '#333333',
      fontSize: 24,
      textAlign: 'left',
      width: 200,
    });
  };

  const addImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Calculate initial size keeping aspect ratio, max width 200
          const scale = Math.min(200 / img.width, 1);
          addElement({
            type: 'image',
            content: event.target?.result as string,
            width: img.width * scale,
            height: img.height * scale,
          });
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const addSticker = () => {
    addElement({
      type: 'sticker',
      content: '自定义标签',
      color: '#ec4899', // pink-500
      bgColor: '#fce7f3', // pink-100
      width: 120,
      height: 40,
      fontSize: 14,
    });
  };

  const addProfileCard = () => {
    addElement({
      type: 'profileCard',
      width: 260,
      height: 'auto',
      profileFields: [
        { id: 'f1', label: '身高', value: '162cm' },
        { id: 'f2', label: '体重', value: '130斤' },
        { id: 'f3', label: '身型特点', value: '梨形' }
      ]
    });
  };

  const updateElement = (id: string, updates: Partial<CanvasElement>) => {
    setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const deleteElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const changeZIndex = (id: string, direction: 'up' | 'down') => {
    setElements(elements.map(el => {
      if (el.id === id) {
        return { ...el, zIndex: el.zIndex + (direction === 'up' ? 1 : -1) };
      }
      return el;
    }));
  };

  const clearAll = () => {
    if (elements.length === 0) return;
    if (confirm('确定要清空画布上的所有元素吗？')) {
      setElements([]);
      setSelectedId(null);
    }
  };

  const [savedTemplates, setSavedTemplates] = useState<{ name: string; elements: CanvasElement[]; bg: string }[]>(
    () => {
      try {
        return JSON.parse(localStorage.getItem('saved_templates') || '[]');
      } catch { return []; }
    }
  );
  const [showTemplates, setShowTemplates] = useState(false);

  const saveTemplate = () => {
    if (elements.length === 0) {
      alert('画布上没有任何元素，请先添加内容');
      return;
    }
    const name = prompt('请输入模板名称：', `我的模板${savedTemplates.length + 1}`);
    if (!name) return;
    const newTemplates = [...savedTemplates, { name, elements: JSON.parse(JSON.stringify(elements)), bg: canvasBg }];
    setSavedTemplates(newTemplates);
    localStorage.setItem('saved_templates', JSON.stringify(newTemplates));
    alert(`模板"${name}"已保存！`);
  };

  const loadTemplate = (index: number) => {
    const tpl = savedTemplates[index];
    if (!confirm(`加载模板"${tpl.name}"？当前画布内容将被替换。`)) return;
    setElements(JSON.parse(JSON.stringify(tpl.elements)));
    setCanvasBg(tpl.bg);
    setSelectedId(null);
    setShowTemplates(false);
  };

  const deleteTemplate = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTemplates = savedTemplates.filter((_, i) => i !== index);
    setSavedTemplates(newTemplates);
    localStorage.setItem('saved_templates', JSON.stringify(newTemplates));
  };

  // --- Export ---
  const handleExport = useCallback(async () => {
    if (canvasRef.current === null) return;
    try {
      setSelectedId(null); // Deselect before export to remove borders
      // await a short tick for UI to update
      await new Promise(r => setTimeout(r, 50)); 
      const dataUrl = await toPng(canvasRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `weipang-post-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export image', err);
      alert('导出图片失败，请重试');
    }
  }, [canvasRef]);

  // --- Render Helpers ---
  const selectedElement = elements.find(el => el.id === selectedId);

  return (
    <div className="flex h-screen bg-gray-50 flex-col font-sans overflow-hidden">
      {/* Top Header */}
      <header className="h-14 bg-white border-b border-pink-100 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-pink-400 to-rose-300 rounded-full flex items-center justify-center text-white font-bold shadow-sm">✿</div>
          <h1 className="font-semibold text-gray-800 text-lg tracking-wide">穿搭博主自媒体示意图</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-500 px-4 py-2 rounded-full text-sm font-medium transition-colors border border-gray-100 hover:border-red-200"
            title="清空画布"
          >
            <Trash2 size={16} />
            清空
          </button>
          <button
            onClick={saveTemplate}
            className="flex items-center gap-1.5 bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-500 px-4 py-2 rounded-full text-sm font-medium transition-colors border border-gray-100 hover:border-blue-200"
            title="保存模板"
          >
            <Save size={16} />
            保存
          </button>
          <button
            onClick={() => { setShowTemplates(!showTemplates); setSelectedId(null); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
              showTemplates
                ? 'bg-blue-50 text-blue-500 border-blue-200'
                : 'bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-500 border-gray-100 hover:border-blue-200'
            }`}
            title="加载模板"
          >
            <FolderOpen size={16} />
            加载
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-pink-400 hover:bg-pink-500 text-white px-5 py-2 rounded-full font-medium transition-transform active:scale-95 shadow-sm"
          >
            <Download size={18} />
            生成超清拼图
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Toolbar */}
        <aside className="w-20 bg-white/80 backdrop-blur-md border-r border-pink-100 flex flex-col items-center py-6 gap-6 shrink-0 z-10 shadow-sm">
          <ToolButton icon={<Type />} label="文字" onClick={addText} />
          
          <label className="flex flex-col items-center gap-1 cursor-pointer group">
            <div className="w-10 h-10 rounded-2xl bg-pink-50 group-hover:bg-pink-100 flex items-center justify-center text-pink-400 group-hover:text-pink-500 transition-colors shadow-sm">
              <ImageIcon size={20} />
            </div>
            <span className="text-[10px] text-gray-500 group-hover:text-pink-500 font-medium">传图</span>
            <input type="file" accept="image/*" className="hidden" onChange={addImage} />
          </label>
          
          <ToolButton icon={<Tag />} label="标签" onClick={addSticker} tooltip="添加自定义标签" />
          <ToolButton icon={<User />} label="档案卡" onClick={addProfileCard} tooltip="添加博主身型数据卡" />
          
          <div className="w-10 h-px bg-pink-100 my-2"></div>
          
          <ToolButton icon={<Palette />} label="背景" onClick={() => setSelectedId(null)} />

          <div className="w-10 h-px bg-pink-100 my-2"></div>

          <button
            onClick={() => { setShowApiSettings(!showApiSettings); setSelectedId(null); }}
            title="设置AI API Key"
            className="flex flex-col items-center gap-1 group w-full"
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors shadow-sm ${apiKey ? 'bg-green-50 text-green-500' : 'bg-amber-50 text-amber-500'}`}>
              <Key size={20} />
            </div>
            <span className="text-[10px] text-gray-500 group-hover:text-pink-500 font-medium">AI Key</span>
          </button>
        </aside>

        {/* Selected Element Properties / Secondary Toolbar */}
        <aside className="w-[300px] bg-white/80 backdrop-blur-md border-r border-pink-100 flex flex-col shrink-0 custom-scrollbar overflow-y-auto transform transition-all duration-300 shadow-sm">
          <div className="p-5 flex flex-col gap-6">
            {!selectedElement ? (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Palette size={16} className="text-gray-500" /> 画布背景色
                </h3>
                <div className="grid grid-cols-5 gap-2">
                  {presetBgs.map(color => (
                    <button
                      key={color}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110",
                        canvasBg === color ? "border-pink-500 ring-2 ring-pink-200" : "border-pink-50 shadow-sm"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setCanvasBg(color)}
                      title={color}
                    />
                  ))}
                  <div className="relative w-8 h-8 rounded-full border-2 border-pink-100 overflow-hidden shadow-sm hover:scale-110 transition-transform">
                     <input 
                      type="color" 
                      value={canvasBg}
                      onChange={(e) => setCanvasBg(e.target.value)}
                      className="absolute inset-[-10px] w-12 h-12 cursor-pointer"
                      title="自定义背景色"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      if (!presetBgs.includes(canvasBg)) {
                        setPresetBgs([...presetBgs, canvasBg]);
                      }
                    }}
                    className="w-8 h-8 rounded-full border border-dashed border-pink-300 text-pink-400 flex items-center justify-center hover:bg-pink-50 hover:text-pink-500 transition-colors tooltip tooltip-top"
                    title="收藏当前颜色"
                  >
                    +
                  </button>
                </div>
                {showApiSettings && (
                  <div className="space-y-3 bg-amber-50/50 border border-amber-200 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <Key size={14} className="text-amber-500" /> DeepSeek API Key
                    </h3>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-xxxxxxxxxxxxxxxx"
                      className="w-full px-3 py-2 bg-white border border-amber-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-amber-400 transition-colors font-mono"
                    />
                    <p className="text-[10px] text-gray-400 leading-relaxed">
                      Key 仅保存在本地浏览器，不会上传。获取地址：<a href="https://platform.deepseek.com/api_keys" target="_blank" className="text-amber-500 underline">platform.deepseek.com</a>
                    </p>
                  </div>
                )}
                {showTemplates && (
                  <div className="space-y-3 bg-blue-50/50 border border-blue-200 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <FolderOpen size={14} className="text-blue-500" /> 我的模板
                    </h3>
                    {savedTemplates.length === 0 ? (
                      <p className="text-xs text-gray-400">暂无保存的模板，点击顶部"保存"按钮保存当前画布</p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                        {savedTemplates.map((tpl, idx) => (
                          <div
                            key={idx}
                            onClick={() => loadTemplate(idx)}
                            className="flex items-center justify-between p-3 bg-white border border-blue-100 rounded-lg cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all group"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-700 truncate">{tpl.name}</p>
                              <p className="text-[10px] text-gray-400">{tpl.elements.length}个元素 · 背景{tpl.bg}</p>
                            </div>
                            <button
                              onClick={(e) => deleteTemplate(idx, e)}
                              className="text-gray-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-all"
                              title="删除模板"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                   <h3 className="text-sm font-semibold text-gray-800">元素属性</h3>
                   <button 
                     onClick={() => deleteElement(selectedElement.id)}
                     className="text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                     title="删除"
                   >
                     <Trash2 size={16} />
                   </button>
                </div>

                {/* Layer Controls */}
                <div className="space-y-2">
                   <label className="text-xs text-gray-500 font-medium">图层顺序</label>
                   <div className="flex bg-gray-100 p-1 rounded-lg">
                      <button 
                        onClick={() => changeZIndex(selectedElement.id, 'up')}
                        className="flex-1 flex justify-center py-1.5 hover:bg-white rounded shadow-sm text-gray-700 text-xs gap-1 items-center"
                      >
                        <BringToFront size={14}/> 上移
                      </button>
                      <button 
                        onClick={() => changeZIndex(selectedElement.id, 'down')}
                        className="flex-1 flex justify-center py-1.5 hover:bg-white rounded shadow-sm text-gray-700 text-xs gap-1 items-center"
                      >
                        <SendToBack size={14}/> 下移
                      </button>
                   </div>
                </div>

                {/* Text Specific Controls */}
                {selectedElement.type === 'text' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs text-gray-500 font-medium">字体大小</label>
                      <input 
                        type="range" 
                        min="12" max="100" 
                        value={selectedElement.fontSize || 24}
                        onChange={(e) => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) })}
                        className="w-full h-1.5 bg-pink-100 rounded-lg appearance-none cursor-pointer accent-pink-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-gray-500 font-medium">文字颜色</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          value={selectedElement.color || '#333333'}
                          onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                          className="w-8 h-8 rounded border-pink-100 cursor-pointer"
                        />
                        <span className="text-xs font-mono text-gray-500">{selectedElement.color || '#333333'}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-gray-500 font-medium">对齐方式</label>
                      <div className="flex bg-gray-100 p-1 rounded-lg">
                         <TextAlignBtn active={selectedElement.textAlign === 'left'} icon={<AlignLeft size={16}/>} onClick={() => updateElement(selectedElement.id, { textAlign: 'left'})}/>
                         <TextAlignBtn active={selectedElement.textAlign === 'center'} icon={<AlignCenter size={16}/>} onClick={() => updateElement(selectedElement.id, { textAlign: 'center'})}/>
                         <TextAlignBtn active={selectedElement.textAlign === 'right'} icon={<AlignRight size={16}/>} onClick={() => updateElement(selectedElement.id, { textAlign: 'right'})}/>
                      </div>
                    </div>

                    {/* AI 文案优化 */}
                    <div className="space-y-3 pt-3 border-t border-pink-100">
                      <label className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                        <Sparkles size={14} className="text-purple-500" /> AI 优化文案
                      </label>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setAiStyle('xiaohongshu')}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            aiStyle === 'xiaohongshu'
                              ? 'bg-pink-100 text-pink-600 shadow-sm'
                              : 'bg-gray-50 text-gray-500 hover:bg-pink-50 hover:text-pink-400'
                          }`}
                        >
                          小红书风格
                        </button>
                        <button
                          onClick={() => setAiStyle('douyin')}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            aiStyle === 'douyin'
                              ? 'bg-pink-100 text-pink-600 shadow-sm'
                              : 'bg-gray-50 text-gray-500 hover:bg-pink-50 hover:text-pink-400'
                          }`}
                        >
                          抖音风格
                        </button>
                      </div>
                      <button
                        onClick={() => handleOptimizeText(selectedElement.id, selectedElement.content || '')}
                        disabled={aiLoading}
                        className={`w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all active:scale-95 ${
                          aiLoading
                            ? 'bg-purple-200 text-purple-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-purple-400 to-pink-400 text-white hover:from-purple-500 hover:to-pink-500 shadow-sm'
                        }`}
                      >
                        {aiLoading ? (
                          <>
                            <span className="w-4 h-4 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin"></span>
                            AI优化中...
                          </>
                        ) : (
                          <>
                            <Sparkles size={16} />
                            一键AI优化文案
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}

                {/* Sticker Specific Controls */}
                {selectedElement.type === 'sticker' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs text-gray-500 font-medium">标签文字</label>
                      <input 
                        type="text" 
                        value={selectedElement.content || ''}
                        onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                        className="w-full px-3 py-2 bg-pink-50/50 border border-pink-100 rounded-md text-sm outline-none focus:ring-1 focus:ring-pink-400 focus:bg-white transition-colors"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs text-gray-500 font-medium">背景颜色</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            value={selectedElement.bgColor || '#fce7f3'}
                            onChange={(e) => updateElement(selectedElement.id, { bgColor: e.target.value })}
                            className="w-8 h-8 rounded border-pink-100 cursor-pointer"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-gray-500 font-medium">文字颜色</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            value={selectedElement.color || '#ec4899'}
                            onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                            className="w-8 h-8 rounded border-pink-100 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Profile Card Specific Controls */}
                {selectedElement.type === 'profileCard' && selectedElement.profileFields && (
                  <div className="space-y-4">
                    <label className="text-xs text-gray-500 font-medium flex justify-between items-center">
                      <span>档案卡内容 (自定义标题和数值)</span>
                    </label>
                    
                    <div className="space-y-3">
                      {selectedElement.profileFields.map((field, idx) => (
                        <div key={field.id} className="flex flex-col gap-1.5 p-3 bg-pink-50/50 border border-pink-100 rounded-xl relative group">
                           <button 
                             onClick={() => {
                               const newFields = [...selectedElement.profileFields!];
                               newFields.splice(idx, 1);
                               updateElement(selectedElement.id, { profileFields: newFields });
                             }}
                             className="absolute -top-2 -right-2 bg-white text-gray-400 hover:text-red-500 rounded-full shadow-sm p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                           >
                             <Trash2 size={12} />
                           </button>
                           <div className="flex gap-2">
                             <input 
                               type="text" 
                               value={field.label}
                               onChange={(e) => {
                                 const newFields = [...selectedElement.profileFields!];
                                 newFields[idx].label = e.target.value;
                                 updateElement(selectedElement.id, { profileFields: newFields });
                               }}
                               className="w-1/3 px-2 py-1 bg-white border border-pink-100 rounded text-xs outline-none focus:border-pink-300"
                               placeholder="标题"
                             />
                             <input 
                               type="text" 
                               value={field.value}
                               onChange={(e) => {
                                 const newFields = [...selectedElement.profileFields!];
                                 newFields[idx].value = e.target.value;
                                 updateElement(selectedElement.id, { profileFields: newFields });
                               }}
                               className="flex-1 px-2 py-1 bg-white border border-pink-100 rounded text-xs outline-none focus:border-pink-300"
                               placeholder="内容..."
                             />
                           </div>
                        </div>
                      ))}
                    </div>
                    
                    <button 
                      onClick={() => {
                        const newFields = [...selectedElement.profileFields!, { id: Date.now().toString(), label: '新标题', value: '新内容' }];
                        updateElement(selectedElement.id, { profileFields: newFields });
                      }}
                      className="w-full py-2 bg-pink-50 hover:bg-pink-100 text-pink-500 rounded-lg text-sm font-medium transition-colors border border-dashed border-pink-200"
                    >
                      + 新增内容
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Center Canvas Area */}
        <main 
          className="flex-1 bg-gray-200 relative overflow-auto flex items-center justify-center p-8 custom-scrollbar"
          onClick={() => setSelectedId(null)}
        >
          {/* Default Xiaohongshu Aspect Ratio Canvas 3:4 (450x600 as base, scaled via CSS) */}
          <div 
            ref={canvasRef}
            className="bg-white shadow-xl relative overflow-hidden transition-colors duration-200"
            style={{ 
              width: 450, 
              height: 600, 
              backgroundColor: canvasBg,
              // Adding a subtle grain texture for better aesthetic
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.04'/%3E%3C/svg%3E")`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {elements.map(el => (
              <Rnd
                key={el.id}
                default={{
                  x: el.x,
                  y: el.y,
                  width: el.width,
                  height: el.height,
                }}
                minWidth={50}
                minHeight={30}
                bounds="parent"
                onDragStop={(e, d) => updateElement(el.id, { x: d.x, y: d.y })}
                onResizeStop={(e, direction, ref, delta, position) => {
                  updateElement(el.id, {
                    width: ref.style.width,
                    height: ref.style.height,
                    ...position,
                  });
                }}
                className={cn(
                  "group",
                  selectedId === el.id && "ring-2 ring-pink-400 ring-offset-2"
                )}
                style={{ zIndex: el.zIndex }}
                onMouseDown={() => setSelectedId(el.id)}
                enableResizing={el.type !== 'profileCard'} // Profile cards Auto scale, but text, images, and stickers can resize
              >
                {/* Element Renderers */}
                {el.type === 'text' && (
                  <div
                    className="w-full h-full p-1 group-hover:bg-blue-50/20 transition-colors cursor-move"
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setEditingTextId(el.id);
                      setTimeout(() => {
                        const ta = document.querySelector(`[data-text-id="${el.id}"]`) as HTMLTextAreaElement;
                        ta?.focus();
                      }, 50);
                    }}
                  >
                     <textarea
                       data-text-id={el.id}
                       className="w-full h-full bg-transparent border-none outline-none resize-none font-medium leading-relaxed font-sans"
                       style={{
                         color: el.color,
                         fontSize: `${el.fontSize}px`,
                         textAlign: el.textAlign || 'left',
                         pointerEvents: editingTextId === el.id ? 'auto' : 'none',
                         cursor: editingTextId === el.id ? 'text' : 'move',
                       }}
                       value={el.content}
                       onChange={(e) => updateElement(el.id, { content: e.target.value })}
                       onBlur={() => setEditingTextId(null)}
                       onKeyDown={(e) => {
                         if (e.key === 'Escape') {
                           (e.target as HTMLTextAreaElement).blur();
                         }
                       }}
                       placeholder="双击编辑文字..."
                       readOnly={editingTextId !== el.id}
                     />
                  </div>
                )}
                
                {el.type === 'image' && (
                  <div className="w-full h-full relative group-hover:after:absolute group-hover:after:inset-0 group-hover:after:bg-pink-400/10">
                    <img 
                      src={el.content} 
                      alt="" 
                      className="w-full h-full object-cover rounded-xl pointer-events-none shadow-sm"
                      crossOrigin="anonymous" 
                    />
                  </div>
                )}

                {el.type === 'sticker' && (
                   <div 
                     className="w-full h-full flex items-center justify-center rounded-full font-bold shadow-sm border-2 border-white"
                     style={{
                       backgroundColor: el.bgColor || '#fce7f3',
                       color: el.color || '#ec4899',
                     }}
                   >
                     {/* Scale font size based on container height using CSS container queries if we wanted, or SVG text. Here let's just make it editable block. We used standard css styles. */}
                     <span style={{ fontSize: `${el.fontSize || 14}px`}} className="px-4 text-center truncate pointer-events-none">
                       {el.content}
                     </span>
                   </div>
                )}

                {el.type === 'profileCard' && el.profileFields && (
                  <div className="w-full h-full bg-white/90 backdrop-blur-md border-[3px] border-white p-4 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] pointer-events-none flex flex-col justify-center relative overflow-hidden">
                    <div className="flex flex-wrap gap-2 z-10 w-full justify-center">
                      {el.profileFields.map((field, idx) => (
                        <div 
                          key={field.id}
                          className={cn(
                            "bg-pink-50/70 rounded-2xl p-2 text-center border border-pink-100 min-w-[45%]",
                            idx === el.profileFields!.length - 1 && el.profileFields!.length % 2 !== 0 ? "w-full" : "flex-1"
                          )}
                        >
                           <p className="text-[11px] text-pink-400 font-medium mb-0.5">{field.label}</p>
                           <p className="font-bold text-gray-800 text-sm">{field.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </Rnd>
            ))}
          </div>
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #e5e7eb;
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
}

// --- Sub Components ---
function ToolButton({ icon, label, onClick, tooltip }: { icon: React.ReactNode, label: string, onClick: () => void, tooltip?: string }) {
  return (
    <button 
      onClick={onClick}
      title={tooltip}
      className="flex flex-col items-center gap-1 group w-full"
    >
      <div className="w-10 h-10 rounded-2xl bg-pink-50 group-hover:bg-pink-100 flex items-center justify-center text-pink-400 group-hover:text-pink-500 transition-colors shadow-sm">
        {icon}
      </div>
      <span className="text-[10px] text-gray-500 group-hover:text-pink-500 font-medium">{label}</span>
    </button>
  );
}

function TextAlignBtn({ active, icon, onClick }: { active: boolean, icon: React.ReactNode, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex-1 flex justify-center py-1.5 rounded items-center transition-colors",
        active ? "bg-white shadow-sm text-pink-500" : "text-gray-500 hover:text-gray-800"
      )}
    >
      {icon}
    </button>
  );
}

