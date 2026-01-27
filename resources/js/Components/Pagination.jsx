import { Link } from '@inertiajs/react';

export default function Pagination({ links }) {
  // If there are only 3 links (Previous, 1, Next) and 1 is active, we might want to hide it if logic dictates
  // keeping it simple for now
  if (links.length === 3 && links[1].active && links[0].url === null && links[2].url === null) return null;

  return (
    <div className="flex flex-wrap justify-end gap-1 p-4 border-t border-gray-100 bg-gray-50/50">
      {links.map((link, key) => (
        link.url === null ? (
          <div
            key={key}
            className="mb-1 mr-1 px-3 py-2 text-xs text-gray-400 border border-gray-200 bg-white rounded-lg select-none"
            dangerouslySetInnerHTML={{ __html: link.label }}
          />
        ) : (
          <Link
            key={key}
            href={link.url}
            className={`mb-1 mr-1 px-3 py-2 text-xs font-bold border rounded-lg transition-colors focus:shadow-outline ${link.active
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-800'
              }`}
            preserveScroll
            preserveState
          >
            <span dangerouslySetInnerHTML={{ __html: link.label }} />
          </Link>
        )
      ))}
    </div>
  );
}
