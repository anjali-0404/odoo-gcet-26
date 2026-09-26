import { APP_NAME } from '../../utils/constants.js';

export default function Logo({ size = 'md' }) {
  const box = size === 'lg' ? 'h-10 w-10' : 'h-8 w-8';
  const text = size === 'lg' ? 'text-2xl' : 'text-lg';

  return (
    <span className="inline-flex items-center gap-2">
      <svg viewBox="0 0 32 32" className={box} aria-hidden="true">
        <rect width="32" height="32" rx="7" className="fill-surface-2" />
        <g fill="none" className="stroke-accent" strokeWidth="2" strokeLinejoin="round">
          <path d="M8 11l8-4 8 4-8 4-8-4z" />
          <path d="M8 16l8 4 8-4M8 21l8 4 8-4" />
        </g>
      </svg>
      <span className={`${text} font-semibold tracking-tight text-text-strong`}>{APP_NAME}</span>
    </span>
  );
}
