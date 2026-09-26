import { useEffect, useState } from 'react';
import useDebounce from '../../hooks/useDebounce.js';
import Icon from './Icon.jsx';

/** Debounced search box. Calls onSearch(value) 300 ms after typing stops. */
export default function SearchInput({ value = '', onSearch, placeholder = 'Search…', className = '' }) {
  const [text, setText] = useState(value);
  const debounced = useDebounce(text, 300);

  useEffect(() => {
    if (debounced !== value) onSearch(debounced);
  }, [debounced]);

  return (
    <label className={`relative block ${className}`}>
      <span className="sr-only">{placeholder}</span>
      <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-md border border-border bg-surface-2 pr-3 pl-9 text-sm text-text-strong placeholder:text-muted/70 focus:border-accent focus:outline-none sm:w-60"
      />
    </label>
  );
}
