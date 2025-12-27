
import React from 'react';
import { Book, ReadingStatus } from '../types';
import { Star, BookOpen, CheckCircle2, Bookmark } from 'lucide-react';

interface BookCardProps {
  book: Book;
  onClick: (book: Book) => void;
}

const BookCard: React.FC<BookCardProps> = ({ book, onClick }) => {
  const getStatusIcon = () => {
    switch (book.status) {
      case ReadingStatus.READING: return <BookOpen className="w-4 h-4 text-blue-500" />;
      case ReadingStatus.COMPLETED: return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case ReadingStatus.WANT_TO_READ: return <Bookmark className="w-4 h-4 text-amber-500" />;
      default: return null;
    }
  };

  const getStatusText = () => {
    switch (book.status) {
      case ReadingStatus.READING: return '읽는 중';
      case ReadingStatus.COMPLETED: return '완독';
      case ReadingStatus.WANT_TO_READ: return '읽고 싶은 책';
      default: return '보류';
    }
  };

  return (
    <div 
      onClick={() => onClick(book)}
      className="group bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden cursor-pointer hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-stone-100">
        <img 
          src={book.coverUrl || `https://picsum.photos/seed/${book.id}/400/600`} 
          alt={book.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-2 right-2 flex space-x-1">
          <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-[10px] font-medium flex items-center gap-1 shadow-sm">
            {getStatusIcon()}
            {getStatusText()}
          </div>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-serif font-bold text-stone-800 line-clamp-1 text-lg mb-1">{book.title}</h3>
        <p className="text-stone-500 text-sm mb-3">{book.author}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`w-3 h-3 ${i < book.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`} 
              />
            ))}
          </div>
          <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold bg-stone-50 px-2 py-1 rounded">
            {book.category}
          </span>
        </div>
        
        {book.status === ReadingStatus.READING && book.totalPage && (
          <div className="mt-4">
            <div className="flex justify-between text-[10px] text-stone-500 mb-1">
              <span>진행률</span>
              <span>{Math.round(((book.currentPage || 0) / book.totalPage) * 100)}%</span>
            </div>
            <div className="h-1 bg-stone-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500" 
                style={{ width: `${((book.currentPage || 0) / book.totalPage) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookCard;
