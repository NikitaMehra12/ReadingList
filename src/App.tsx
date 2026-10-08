import { useState, useEffect } from 'react';
import { BookOpen, Plus, Library, Bookmark, CheckCircle2, X, AlertCircle } from 'lucide-react';

type ReadingStatus = 'Want to Read' | 'Reading' | 'Finished';

interface Book {
  id: string;
  title: string;
  status: ReadingStatus;
}

const STORAGE_KEY = 'reading-list-books';

const STATUS_ORDER: ReadingStatus[] = ['Want to Read', 'Reading', 'Finished'];

const STATUS_STYLES: Record<ReadingStatus, { badge: string; dot: string; icon: typeof Bookmark }> = {
  'Want to Read': {
    badge: 'bg-amber-100 text-amber-800 border border-amber-200',
    dot: 'bg-amber-500',
    icon: Bookmark,
  },
  Reading: {
    badge: 'bg-blue-100 text-blue-800 border border-blue-200',
    dot: 'bg-blue-500',
    icon: BookOpen,
  },
  Finished: {
    badge: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    dot: 'bg-emerald-500',
    icon: CheckCircle2,
  },
};

const FILTERS: ('All' | ReadingStatus)[] = ['All', ...STATUS_ORDER];

function loadBooks(): Book[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (b) =>
        b &&
        typeof b.id === 'string' &&
        typeof b.title === 'string' &&
        STATUS_ORDER.includes(b.status)
    );
  } catch {
    return [];
  }
}

function App() {
  const [books, setBooks] = useState<Book[]>(() => loadBooks());
  const [filter, setFilter] = useState<'All' | ReadingStatus>('All');
  const [title, setTitle] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  }, [books]);

  const addBook = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setError('');
    if (trimmed.length > 60) {
      setError('Book title must be 60 characters or fewer.');
      return;
    }
    const isDuplicate = books.some(
      (b) => b.title.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      setError('This book is already in your reading list.');
      return;
    }
    setBooks((prev) => [
      { id: crypto.randomUUID(), title: trimmed, status: 'Want to Read' },
      ...prev,
    ]);
    setTitle('');
    setShowForm(false);
  };

  const cycleStatus = (id: string) => {
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const idx = STATUS_ORDER.indexOf(b.status);
        return { ...b, status: STATUS_ORDER[(idx + 1) % STATUS_ORDER.length] };
      })
    );
  };

  const deleteBook = (id: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
  };

  const filteredBooks = filter === 'All' ? books : books.filter((b) => b.status === filter);

  const counts: Record<'All' | ReadingStatus, number> = {
    All: books.length,
    'Want to Read': books.filter((b) => b.status === 'Want to Read').length,
    Reading: books.filter((b) => b.status === 'Reading').length,
    Finished: books.filter((b) => b.status === 'Finished').length,
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900 text-white">
              <Library size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight text-stone-900">Reading List</h1>
              <p className="text-xs text-stone-500">
                {books.length} {books.length === 1 ? 'book' : 'books'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center gap-1.5 rounded-lg bg-stone-900 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-stone-700 active:scale-95"
          >
            <Plus size={18} strokeWidth={2.5} />
            Add Book
          </button>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="border-t border-stone-200 bg-white">
            <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3 sm:px-6">
              <input
                autoFocus
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addBook()}
                placeholder="Enter book title..."
                className="flex-1 rounded-lg border border-stone-300 px-3.5 py-2 text-sm text-stone-900 placeholder-stone-400 outline-none transition focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10"
              />
              <button
                onClick={addBook}
                disabled={!title.trim()}
                className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition enabled:hover:bg-stone-700 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setTitle('');
                  setError('');
                }}
                className="rounded-lg p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            {error && (
              <div className="mx-auto flex max-w-2xl items-center gap-1.5 px-4 pb-2.5 text-sm text-red-600 sm:px-6">
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </div>
            )}
          </div>
        )}
      </header>

      {/* Filter bar */}
      {books.length > 0 && (
        <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                  filter === f
                    ? 'bg-stone-900 text-white'
                    : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-300 hover:text-stone-900'
                }`}
              >
                {f}
                <span
                  className={`text-xs ${
                    filter === f ? 'text-stone-300' : 'text-stone-400'
                  }`}
                >
                  {counts[f]}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {books.length > 0 && (
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            <div className="rounded-xl border border-stone-200 bg-white p-3 text-center sm:p-4">
              <p className="text-2xl font-bold text-stone-900 sm:text-3xl">{books.length}</p>
              <p className="mt-0.5 text-xs font-medium text-stone-500 sm:text-sm">Total Books</p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-center sm:p-4">
              <p className="text-2xl font-bold text-blue-700 sm:text-3xl">{counts.Reading}</p>
              <p className="mt-0.5 text-xs font-medium text-blue-600 sm:text-sm">Currently Reading</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center sm:p-4">
              <p className="text-2xl font-bold text-emerald-700 sm:text-3xl">{counts.Finished}</p>
              <p className="mt-0.5 text-xs font-medium text-emerald-600 sm:text-sm">Finished</p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="mx-auto max-w-2xl px-4 pb-20 sm:px-6">
        {books.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
              <Library size={32} strokeWidth={1.5} />
            </div>
            <p className="text-lg font-semibold text-stone-700">
              Your reading list is empty. Add your first book.
            </p>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm text-stone-400">No books in this category.</p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {filteredBooks.map((book) => {
              const style = STATUS_STYLES[book.status];
              const StatusIcon = style.icon;
              return (
                <li
                  key={book.id}
                  className="group flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-3.5 transition hover:border-stone-300 hover:shadow-sm sm:p-4"
                >
                  {/* Book icon spine */}
                  <div className="flex h-11 w-8 shrink-0 items-center justify-center rounded-md bg-stone-900 text-white">
                    <BookOpen size={16} strokeWidth={2} />
                  </div>

                  {/* Title */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-stone-900">{book.title}</p>
                    <button
                      onClick={() => cycleStatus(book.id)}
                      className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition hover:opacity-80 ${style.badge}`}
                      title="Click to change status"
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                      {book.status}
                      <StatusIcon size={12} strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => deleteBook(book.id)}
                    className="shrink-0 rounded-lg p-1.5 text-stone-300 transition hover:bg-red-50 hover:text-red-500"
                    aria-label={`Remove ${book.title}`}
                  >
                    <X size={18} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}

export default App;
