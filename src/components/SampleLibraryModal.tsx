import React, { useState, useEffect } from 'react';
import { DotLottieReact, DotLottie } from '@lottiefiles/dotlottie-react';
import { X, Sparkles, Check, ArrowRight } from 'lucide-react';
import { SAMPLE_LOTTIES } from '../data/sampleLotties';
import { SampleLottie } from '../types';

interface SampleLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSample: (sample: SampleLottie) => void;
  currentSampleId?: string;
}

const SampleItemCard: React.FC<{
  sample: SampleLottie;
  isSelected: boolean;
  onSelectSample: (sample: SampleLottie) => void;
  onClose: () => void;
}> = ({ sample, isSelected, onSelectSample, onClose }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [dotLottie, setDotLottie] = useState<DotLottie | null>(null);

  useEffect(() => {
    if (!dotLottie) return;
    if (isHovered) {
      dotLottie.play();
    } else {
      dotLottie.pause();
      dotLottie.setFrame(0);
    }
  }, [isHovered, dotLottie]);

  return (
    <div
      onClick={() => {
        onSelectSample(sample);
        onClose();
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative rounded-2xl border p-4 bg-slate-800/50 hover:bg-slate-800/90 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
        isSelected
          ? 'border-indigo-500 ring-2 ring-indigo-500/40 bg-indigo-500/10'
          : 'border-slate-700/60 hover:border-indigo-500/50'
      }`}
    >
      {/* Thumb Banner Container */}
      <div 
        className="w-full h-36 rounded-xl flex items-center justify-center relative overflow-hidden shadow-inner transition-colors duration-200"
        style={{ backgroundColor: sample.thumbBg || '#1e293b' }}
      >
        <div className="w-full h-full p-2 flex items-center justify-center">
          <DotLottieReact
            src={sample.url}
            loop={true}
            autoplay={true}
            dotLottieRefCallback={setDotLottie}
            style={{ width: '100%', height: '100%' }}
            className="w-full h-full object-contain pointer-events-none"
          />
        </div>

        {isSelected && (
          <div className="absolute top-2 right-2 px-2 py-0.5 bg-indigo-600 text-white rounded-full text-[10px] font-bold flex items-center gap-1 shadow z-10">
            <Check className="w-3 h-3" /> Đang Xem
          </div>
        )}

        {/* Live Auto-Review Badge */}
        {isHovered && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-indigo-600/90 text-white text-[9px] font-extrabold uppercase rounded-md shadow flex items-center gap-1 animate-fade-in backdrop-blur-sm z-10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            Auto Review
          </div>
        )}
      </div>

      {/* Sample Info */}
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase text-indigo-400 tracking-wider">{sample.category}</span>
          <span className="text-[10px] text-slate-500">bởi {sample.author}</span>
        </div>
        <h3 className="text-sm font-bold text-white mt-1 group-hover:text-indigo-300 transition-colors">
          {sample.title}
        </h3>
        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
          {sample.description}
        </p>
      </div>

      {/* Button Action */}
      <div className="flex items-center text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 pt-1">
        <span>Xem Animation Này</span>
        <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
};

export const SampleLibraryModal: React.FC<SampleLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectSample,
  currentSampleId
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (!isOpen) return null;

  const categories = ['All', ...Array.from(new Set(SAMPLE_LOTTIES.map(s => s.category)))];

  const filteredSamples = selectedCategory === 'All'
    ? SAMPLE_LOTTIES
    : SAMPLE_LOTTIES.filter(s => s.category === selectedCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-slate-200">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Thư Viện Animation Mẫu</h2>
              <p className="text-xs text-slate-400">Chọn tệp mẫu chất lượng cao để trải nghiệm đầy đủ tính năng</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories Bar */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/40 flex items-center gap-2 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              {cat === 'All' ? 'Tất Cả' : cat}
            </button>
          ))}
        </div>

        {/* Grid Samples */}
        <div className="p-5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSamples.map(sample => (
            <SampleItemCard
              key={sample.id}
              sample={sample}
              isSelected={sample.id === currentSampleId}
              onSelectSample={onSelectSample}
              onClose={onClose}
            />
          ))}
        </div>

      </div>
    </div>
  );
};
