
import { Book } from '../types';

const STORAGE_KEY = 'luna_library_data';

export const saveBooks = (books: Book[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
};

export const getBooks = (): Book[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const clearData = () => {
  localStorage.removeItem(STORAGE_KEY);
};
