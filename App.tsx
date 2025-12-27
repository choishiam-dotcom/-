
import React, { useState, useEffect, useMemo } from 'react';
import { Book, ReadingStatus, BookNote } from './types';
import { getBooks, saveBooks } from './store/localStore';
import Sidebar from './components/Sidebar';
import BookCard from './components/BookCard';
import { 
  Plus, Search, Filter, X, 
  MessageSquare, BookOpen, Trash2, 
  Save, Calendar, Sparkles, Star, 
  CheckCircle2, TrendingUp, Info,
  Library
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, PieChart as RePieChart, Pie
} from 'recharts';
import { searchBookInfo, getBookRecommendation, analyzeReadingNote } from './services/geminiService';

const App: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  // Form states for adding/editing
  const [newBook, setNewBook] = useState<Partial<Book>>({
    title: '',
    author: '',
    status: ReadingStatus.WANT_TO_READ,
    category: '기타',
    rating: 0,
    notes: [],
    currentPage: 0,
    totalPage: 300
  });

  useEffect(() => {
    setBooks(getBooks());
  }, []);

  useEffect(() => {
    if (books.length > 0) saveBooks(books);
  }, [books]);

  const handleAddBook = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newBook.title || !newBook.author) return;

    const bookToAdd: Book = {
      id: Date.now().toString(),
      title: newBook.title || '',
      author: newBook.author || '',
      coverUrl: `https://picsum.photos/seed/${Math.random()}/400/600`,
      status: newBook.status || ReadingStatus.WANT_TO_READ,
      category: newBook.category || '기타',
      rating: newBook.rating || 0,
      summary: newBook.summary || '',
      notes: [],
      currentPage: newBook.currentPage || 0,
      totalPage: newBook.totalPage || 300,
    };

    setBooks(prev => [...prev, bookToAdd]);
    setIsAddModalOpen(false);
    setNewBook({
      title: '',
      author: '',
      status: ReadingStatus.WANT_TO_READ,
      category: '기타',
      rating: 0,
      notes: [],
      currentPage: 0,
      totalPage: 300
    });
  };

  const updateBook = (updatedBook: Book) => {
    setBooks(prev => prev.map(b => b.id === updatedBook.id ? updatedBook : b));
    setSelectedBook(updatedBook);
  };

  const deleteBook = (id: string) => {
    if (confirm('이 책을 삭제하시겠습니까?')) {
      setBooks(prev => prev.filter(b => b.id !== id));
      setSelectedBook(null);
    }
  };

  const handleSearchBookAI = async () => {
    if (!newBook.title) return;
    setAiLoading(true);
    try {
      const info = await searchBookInfo(newBook.title);
      setNewBook(prev => ({
        ...prev,
        title: info.title,
        author: info.author,
        category: info.category,
        summary: info.summary,
        totalPage: info.totalPage
      }));
    } catch (error) {
      console.error(error);
      alert('AI 검색에 실패했습니다. 직접 입력해주세요.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleGetRecommendations = async () => {
    setAiLoading(true);
    try {
      // Fix for Error: Argument of type 'unknown[]' is not assignable to parameter of type 'string[]'.
      const genres = Array.from(new Set(books.map(b => b.category))) as string[];
      const recent = books.slice(-3).map(b => b.title);
      const recs = await getBookRecommendation(genres, recent);
      setRecommendations(recs);
    } catch (error) {
      console.error(error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAnalyzeNote = async (noteContent: string, book: Book) => {
    setAiLoading(true);
    try {
      const insight = await analyzeReadingNote(noteContent, book.title);
      alert(`AI Insight: ${insight}`);
    } catch (error) {
      console.error(error);
    } finally {
      setAiLoading(false);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = books.length;
    const completed = books.filter(b => b.status === ReadingStatus.COMPLETED).length;
    const reading = books.filter(b => b.status === ReadingStatus.READING).length;
    const want = books.filter(b => b.status === ReadingStatus.WANT_TO_READ).length;
    
    // Group by category for chart
    const categories: Record<string, number> = {};
    books.forEach(b => {
      categories[b.category] = (categories[b.category] || 0) + 1;
    });
    const categoryData = Object.entries(categories).map(([name, value]) => ({ name, value }));

    const statusData = [
      { name: '읽는 중', value: reading },
      { name: '완독', value: completed },
      { name: '대기', value: want },
    ];

    return { total, completed, reading, categoryData, statusData };
  }, [books]);

  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-[#fcfbf7]">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onAddBook={() => setIsAddModalOpen(true)} 
      />

      <main className="flex-1 px-6 md:px-12 py-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-serif font-bold text-stone-800">
              {activeTab === 'dashboard' ? '오늘의 서재' : 
               activeTab === 'library' ? '나의 서재' : 
               activeTab === 'ai-center' ? 'AI 추천 센터' : '독서 통계'}
            </h2>
            <p className="text-stone-500 mt-1">당신의 독서 여정을 기록하고 확장하세요.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input 
                type="text" 
                placeholder="책 제목, 작가 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-stone-200 w-64"
              />
            </div>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <section className="space-y-8 animate-in fade-in duration-500">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: '전체 책', value: stats.total, icon: Library, color: 'text-stone-600' },
                { label: '읽는 중', value: stats.reading, icon: BookOpen, color: 'text-blue-600' },
                { label: '완독', value: stats.completed, icon: CheckCircle2, color: 'text-green-600' },
                { label: '올해의 목표', value: '12 / 50', icon: TrendingUp, color: 'text-amber-600' },
              ].map((item, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-4">
                  <div className={`p-3 rounded-xl bg-stone-50 ${item.color}`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">{item.label}</p>
                    <p className="text-2xl font-bold text-stone-800">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-serif font-bold text-stone-800">지금 읽고 있는 책</h3>
                  <button onClick={() => setActiveTab('library')} className="text-xs text-stone-500 hover:text-stone-800 font-bold">전체보기</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {books.filter(b => b.status === ReadingStatus.READING).length > 0 ? (
                    books.filter(b => b.status === ReadingStatus.READING).slice(0, 2).map(book => (
                      <BookCard key={book.id} book={book} onClick={setSelectedBook} />
                    ))
                  ) : (
                    <div className="col-span-2 py-12 bg-white rounded-2xl border-2 border-dashed border-stone-100 flex flex-col items-center justify-center text-stone-400">
                      <BookOpen className="w-12 h-12 mb-2 opacity-20" />
                      <p>지금 읽고 있는 책이 없습니다.</p>
                      <button onClick={() => setIsAddModalOpen(true)} className="mt-4 text-sm font-bold text-amber-600 hover:underline">책 추가하기</button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-serif font-bold text-stone-800 mb-4">AI 한마디</h3>
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl shadow-sm border border-amber-100 relative overflow-hidden">
                  <Sparkles className="w-12 h-12 absolute -right-2 -bottom-2 text-amber-200 opacity-50" />
                  <p className="text-stone-700 italic relative z-10">
                    "독서는 단순한 지식의 습득이 아니라, 다른 영혼과의 만남입니다. 오늘 한 페이지 더 읽어보는 건 어떨까요?"
                  </p>
                  <p className="text-stone-400 text-xs mt-4 text-right">— Luna AI Assistant</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'library' && (
          <section className="animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-wrap gap-4 mb-8">
              {['전체', '읽는 중', '완독', '읽고 싶은 책'].map(filter => (
                <button 
                  key={filter}
                  className="px-6 py-2 rounded-full border border-stone-200 bg-white text-sm font-medium text-stone-600 hover:bg-stone-50 active:bg-stone-100"
                >
                  {filter}
                </button>
              ))}
              <div className="flex-1"></div>
              <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 bg-stone-900 text-white px-6 py-2 rounded-full shadow-lg hover:bg-stone-800 transition-colors">
                <Plus className="w-4 h-4" />
                새로운 책 추가
              </button>
            </div>

            {filteredBooks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredBooks.map(book => (
                  <BookCard key={book.id} book={book} onClick={setSelectedBook} />
                ))}
              </div>
            ) : (
              <div className="py-32 flex flex-col items-center justify-center text-stone-400">
                <Library className="w-16 h-16 mb-4 opacity-10" />
                <p className="text-lg">서재가 비어있습니다.</p>
                <button onClick={() => setIsAddModalOpen(true)} className="mt-4 px-8 py-2 bg-amber-500 text-white rounded-full font-bold shadow-md hover:bg-amber-600">첫 번째 책 등록하기</button>
              </div>
            )}
          </section>
        )}

        {activeTab === 'ai-center' && (
          <section className="animate-in zoom-in-95 duration-500 max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-amber-100 rounded-2xl">
                  <Sparkles className="w-8 h-8 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-serif font-bold text-stone-800">지능형 독서 추천</h3>
                  <p className="text-stone-500">당신의 취향을 분석하여 다음 읽을 책을 제안합니다.</p>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-stone-100 rounded-2xl">
                {recommendations.length > 0 ? (
                  <div className="w-full grid grid-cols-1 gap-6 px-8">
                    {recommendations.map((rec, i) => (
                      <div key={i} className="flex gap-6 p-4 rounded-xl bg-stone-50 border border-stone-100">
                        <div className="w-16 h-24 bg-stone-200 rounded-md shrink-0 flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-stone-400" />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-stone-800">{rec.title}</h4>
                          <p className="text-stone-500 text-sm">{rec.author}</p>
                          <p className="text-stone-600 text-sm mt-2 italic">"{rec.reason}"</p>
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={handleGetRecommendations}
                      disabled={aiLoading}
                      className="mt-4 w-full py-4 bg-amber-100 text-amber-700 font-bold rounded-xl hover:bg-amber-200 disabled:opacity-50 transition-all"
                    >
                      {aiLoading ? '분석 중...' : '다른 추천 받기'}
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-stone-400 mb-6 text-center">
                      등록된 책이 많을수록 더 정확한 추천이 가능합니다.<br/>
                      지금 추천을 생성해볼까요?
                    </p>
                    <button 
                      onClick={handleGetRecommendations}
                      disabled={aiLoading}
                      className="flex items-center gap-2 bg-stone-900 text-white px-8 py-4 rounded-full shadow-xl hover:scale-105 transition-transform disabled:opacity-50"
                    >
                      {aiLoading ? (
                        <>추천 생성 중...</>
                      ) : (
                        <><Sparkles className="w-5 h-5" /> 추천 생성하기</>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'stats' && (
          <section className="animate-in fade-in duration-500 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200 h-[400px]">
                <h3 className="text-xl font-serif font-bold text-stone-800 mb-8">관심 분야 분포</h3>
                <ResponsiveContainer width="100%" height="80%">
                  <RePieChart>
                    <Pie
                      data={stats.categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {stats.categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={['#78350f', '#92400e', '#b45309', '#d97706', '#f59e0b'][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200 h-[400px]">
                <h3 className="text-xl font-serif font-bold text-stone-800 mb-8">독서 상태 통계</h3>
                <ResponsiveContainer width="100%" height="80%">
                  <BarChart data={stats.statusData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip cursor={{fill: 'transparent'}} />
                    <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                      {stats.statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.name === '완독' ? '#22c55e' : entry.name === '읽는 중' ? '#3b82f6' : '#f59e0b'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Book Detail Modal */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={() => setSelectedBook(null)}></div>
          <div className="bg-[#fcfbf7] w-full max-w-5xl h-[90vh] rounded-3xl shadow-2xl overflow-hidden relative z-10 flex flex-col md:flex-row animate-in zoom-in-95 duration-300">
            {/* Sidebar/Cover area */}
            <div className="w-full md:w-80 bg-stone-100 flex flex-col p-8 border-r border-stone-200 shrink-0">
              <div className="aspect-[2/3] w-full rounded-2xl overflow-hidden shadow-xl mb-6">
                <img 
                  src={selectedBook.coverUrl} 
                  alt={selectedBook.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-4">
                <div className="flex justify-center mb-2">
                  {[...Array(5)].map((_, i) => (
                    <button 
                      key={i} 
                      onClick={() => updateBook({...selectedBook, rating: i + 1})}
                    >
                      <Star 
                        className={`w-6 h-6 ${i < selectedBook.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`} 
                      />
                    </button>
                  ))}
                </div>
                <select 
                  className="w-full p-3 bg-white border border-stone-200 rounded-xl font-medium focus:outline-none"
                  value={selectedBook.status}
                  onChange={(e) => updateBook({...selectedBook, status: e.target.value as ReadingStatus})}
                >
                  <option value={ReadingStatus.WANT_TO_READ}>읽고 싶은 책</option>
                  <option value={ReadingStatus.READING}>읽는 중</option>
                  <option value={ReadingStatus.COMPLETED}>완독</option>
                  <option value={ReadingStatus.ON_HOLD}>잠시 멈춤</option>
                </select>
                <div className="text-xs text-stone-500 px-2 flex justify-between">
                  <span>등록일</span>
                  <span>{new Date(parseInt(selectedBook.id)).toLocaleDateString()}</span>
                </div>
                <button 
                  onClick={() => deleteBook(selectedBook.id)}
                  className="w-full mt-auto flex items-center justify-center gap-2 text-red-400 hover:text-red-600 p-4 font-medium transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> 삭제하기
                </button>
              </div>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto p-12">
              <button 
                onClick={() => setSelectedBook(null)}
                className="absolute top-8 right-8 p-2 rounded-full hover:bg-stone-100 text-stone-400 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="mb-12">
                <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full uppercase tracking-wider mb-4 inline-block">
                  {selectedBook.category}
                </span>
                <h2 className="text-4xl font-serif font-bold text-stone-800 mb-2">{selectedBook.title}</h2>
                <p className="text-xl text-stone-500 mb-6">{selectedBook.author}</p>
                
                {selectedBook.status === ReadingStatus.READING && (
                  <div className="bg-white p-6 rounded-2xl border border-stone-200 mb-8">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm font-bold text-stone-600">독서 진행률</span>
                      <span className="text-sm font-mono">{selectedBook.currentPage} / {selectedBook.totalPage} p</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-1000" 
                          style={{ width: `${((selectedBook.currentPage || 0) / (selectedBook.totalPage || 1)) * 100}%` }}
                        />
                      </div>
                      <input 
                        type="number"
                        className="w-20 p-2 border border-stone-200 rounded-lg text-sm text-center"
                        value={selectedBook.currentPage}
                        onChange={(e) => updateBook({...selectedBook, currentPage: parseInt(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                )}

                <div className="prose prose-stone">
                  <h4 className="flex items-center gap-2 text-stone-800 mb-4">
                    <Info className="w-5 h-5" /> 책 소개
                  </h4>
                  <p className="text-stone-600 leading-relaxed whitespace-pre-wrap">
                    {selectedBook.summary || "등록된 요약이 없습니다."}
                  </p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <h4 className="flex items-center gap-2 font-bold text-stone-800 text-xl">
                    <MessageSquare className="w-5 h-5" /> 독서 기록
                  </h4>
                  <button 
                    onClick={() => {
                      const note: BookNote = { id: Date.now().toString(), date: new Date().toISOString(), content: '' };
                      updateBook({...selectedBook, notes: [...selectedBook.notes, note]});
                    }}
                    className="text-amber-600 font-bold text-sm hover:underline"
                  >
                    + 기록 추가
                  </button>
                </div>

                <div className="space-y-4">
                  {selectedBook.notes.length > 0 ? (
                    selectedBook.notes.map((note, idx) => (
                      <div key={note.id} className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
                        <div className="flex justify-between mb-4 text-xs text-stone-400 font-bold uppercase">
                          <div className="flex gap-4">
                            <span><Calendar className="w-3 h-3 inline mr-1" /> {new Date(note.date).toLocaleDateString()}</span>
                            <span>{note.page ? `p. ${note.page}` : ''}</span>
                          </div>
                          <button 
                            onClick={() => {
                              const updatedNotes = selectedBook.notes.filter(n => n.id !== note.id);
                              updateBook({...selectedBook, notes: updatedNotes});
                            }}
                            className="text-stone-300 hover:text-red-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <textarea 
                          className="w-full bg-transparent border-none resize-none focus:outline-none text-stone-700 leading-relaxed"
                          rows={3}
                          placeholder="떠오르는 생각을 적어보세요..."
                          value={note.content}
                          onChange={(e) => {
                            const updatedNotes = selectedBook.notes.map(n => n.id === note.id ? {...n, content: e.target.value} : n);
                            updateBook({...selectedBook, notes: updatedNotes});
                          }}
                        />
                        <div className="mt-4 flex justify-end">
                          <button 
                            onClick={() => handleAnalyzeNote(note.content, selectedBook)}
                            disabled={aiLoading || !note.content}
                            className="flex items-center gap-2 text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full hover:bg-amber-100 disabled:opacity-30"
                          >
                            <Sparkles className="w-3 h-3" /> AI 한마디 듣기
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-stone-400 italic">
                      아직 남겨진 기록이 없습니다. 책을 읽으며 영감을 얻은 부분을 기록해보세요.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Book Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-md" onClick={() => setIsAddModalOpen(false)}></div>
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative z-10 animate-in slide-in-from-bottom-8 duration-300">
            <div className="p-8 border-b border-stone-100 flex justify-between items-center">
              <h3 className="text-2xl font-serif font-bold text-stone-800">새로운 책 등록</h3>
              <button onClick={() => setIsAddModalOpen(false)}><X className="w-6 h-6 text-stone-400" /></button>
            </div>
            
            <form onSubmit={handleAddBook} className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">책 제목</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    required
                    className="flex-1 p-4 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-200"
                    placeholder="제목을 입력하세요"
                    value={newBook.title}
                    onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                  />
                  <button 
                    type="button"
                    onClick={handleSearchBookAI}
                    disabled={aiLoading || !newBook.title}
                    className="px-4 bg-amber-100 text-amber-700 rounded-xl hover:bg-amber-200 disabled:opacity-50"
                  >
                    {aiLoading ? '...' : <Sparkles className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">작가 / 저자</label>
                <input 
                  type="text" 
                  required
                  className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-200"
                  placeholder="작가를 입력하세요"
                  value={newBook.author}
                  onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">카테고리</label>
                  <select 
                    className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
                    value={newBook.category}
                    onChange={(e) => setNewBook({...newBook, category: e.target.value})}
                  >
                    <option>소설</option>
                    <option>에세이</option>
                    <option>인문/사회</option>
                    <option>자기계발</option>
                    <option>경제/경영</option>
                    <option>과학</option>
                    <option>예술</option>
                    <option>만화</option>
                    <option>기타</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">상태</label>
                  <select 
                    className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
                    value={newBook.status}
                    onChange={(e) => setNewBook({...newBook, status: e.target.value as ReadingStatus})}
                  >
                    <option value={ReadingStatus.WANT_TO_READ}>읽고 싶은 책</option>
                    <option value={ReadingStatus.READING}>읽는 중</option>
                    <option value={ReadingStatus.COMPLETED}>완독</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-5 bg-stone-900 text-white font-bold rounded-2xl shadow-xl hover:bg-stone-800 transition-all active:scale-[0.98]"
              >
                서재에 등록하기
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
