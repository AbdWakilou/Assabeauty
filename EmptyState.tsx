// État vide avec illustration et CTA

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function EmptyState({ icon, title, description, ctaLabel, onCta }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-white mb-2 font-playfair">{title}</h3>
      <p className="text-gray-400 max-w-md mb-6">{description}</p>
      {ctaLabel && onCta && (
        <button
          onClick={onCta}
          className="bg-[#29B6F6] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#0288D1] transition-colors"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
