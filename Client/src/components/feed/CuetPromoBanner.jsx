import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

const CuetPromoBanner = () => {
  const navigate = useNavigate();

  const heading = useMemo(
    () => 'CUET clear, college fit abhi clear karo.',
    []
  );

  const handleNavigate = () => {
    navigate('/cuet-calculator');
  };

  return (
    <button
      type="button"
      onClick={handleNavigate}
      className="group w-full rounded-full border border-white/70 bg-gradient-to-r from-pink-50 via-rose-50 to-pink-100 shadow-[0_16px_40px_rgba(239,68,68,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(239,68,68,0.16)] focus:outline-none focus:ring-4 focus:ring-rose-200/60"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/90 text-pink-600 shadow-sm">
            <Sparkles className="h-5 w-5" />
          </span>

          <div className="min-w-0 text-left">
            <p className="text-[11px] sm:text-xs md:text-sm font-semibold uppercase tracking-[0.18em] text-pink-600 opacity-90">
              CUET se ab college fit pe focus
            </p>
            <p className="mt-1 text-sm sm:text-sm md:text-base font-semibold leading-tight text-gray-900 tracking-tight whitespace-normal">
              {heading}
            </p>
          </div>
        </div>

        <span className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-[11px] sm:text-xs font-semibold text-pink-700 shadow-sm transition-colors duration-300 group-hover:bg-pink-50">
          Try Predictor
        </span>
      </div>
    </button>
  );
};

export default CuetPromoBanner;
