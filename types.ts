
export enum ReadingStatus {
  WANT_TO_READ = 'WANT_TO_READ',
  READING = 'READING',
  COMPLETED = 'COMPLETED',
  ON_HOLD = 'ON_HOLD'
}

export interface BookNote {
  id: string;
  date: string;
  content: string;
  page?: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  status: ReadingStatus;
  category: string;
  rating: number; // 0-5
  startDate?: string;
  endDate?: string;
  summary?: string;
  notes: BookNote[];
  totalPage?: number;
  currentPage?: number;
}

export interface ReadingStats {
  totalBooks: number;
  completedBooks: number;
  pagesRead: number;
  booksByMonth: { month: string; count: number }[];
}
