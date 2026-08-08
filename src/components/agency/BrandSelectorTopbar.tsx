import React, { useState, useRef, useEffect } from 'react';
import { AgencyBrand } from '../../types';
import { Building2, ChevronDown, Check, Plus, Layers } from 'lucide-react';

interface BrandSelectorTopbarProps {
  brands: AgencyBrand[];
  activeBrand: AgencyBrand | null;
  onSelectBrand: (brand: AgencyBrand | null) => void;
  onOpenBrandManager: () => void;
}

export const BrandSelectorTopbar: React.FC<BrandSelectorTopbarProps> = ({
  brands,
  activeBrand,
  onSelectBrand,
  onOpenBrandManager
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-all text-xs text-purple-950 font-bold"
        title="Switch Agency Brand Workspace"
      >
        <Building2 className="w-3.5 h-3.5 text-purple-700 shrink-0" />
        <span className="max-w-[130px] truncate">
          {activeBrand ? activeBrand.brandName : 'All Client Brands'}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-purple-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 p-2 space-y-1 animate-in fade-in slide-in-from-top-1">
          <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between text-[11px] font-mono font-bold uppercase text-slate-400">
            <span>Agency Brand Selector</span>
            <span className="text-purple-600">{brands.length} Brands</span>
          </div>

          {/* All Brands Scope Option */}
          <button
            onClick={() => {
              onSelectBrand(null);
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeBrand === null ? 'bg-purple-900 text-white font-bold' : 'hover:bg-slate-100 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>All Client Brands Scope</span>
            </div>
            {activeBrand === null && <Check className="w-4 h-4 text-white" />}
          </button>

          {/* Individual Client Brands */}
          <div className="max-h-48 overflow-y-auto space-y-0.5 pt-1 border-t border-slate-100">
            {brands.map((brand) => {
              const isSelected = activeBrand?.id === brand.id;
              return (
                <button
                  key={brand.id}
                  onClick={() => {
                    onSelectBrand(brand);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                    isSelected ? 'bg-purple-600 text-white font-bold' : 'hover:bg-purple-50 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={brand.logoUrl}
                      alt={brand.brandName}
                      className="w-5 h-5 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                    <span className="truncate">{brand.brandName}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 shrink-0 text-white" />}
                </button>
              );
            })}
          </div>

          <div className="pt-1.5 border-t border-slate-100">
            <button
              onClick={() => {
                onOpenBrandManager();
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 rounded-xl text-xs font-bold transition-all border border-purple-200"
            >
              <Plus className="w-3.5 h-3.5 text-purple-700" />
              <span>Manage & Provision Brands</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
