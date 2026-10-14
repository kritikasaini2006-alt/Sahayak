import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  Search,
  ExternalLink,
  Layers,
  FileCheck2,
  Trash2,
  Compass,
  Plus,
  Coins,
  ChevronRight,
} from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { MOCK_SCHEMES, SCHEME_CATEGORIES } from '../../data/mockSchemes';
import { removeSavedSchemeId, isSchemeSaved } from '../../utils/applicationStorage';

export default function SavedSchemesList({
  savedIds = [],
  onRefresh,
  onOpenDetails,
  onTrackScheme,
  onNavigateToGuide,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  // Filter saved schemes from MOCK_SCHEMES
  const savedSchemes = useMemo(() => {
    return MOCK_SCHEMES.filter((s) => savedIds.includes(s.id));
  }, [savedIds]);

  // Apply search query and category filters
  const filteredSchemes = useMemo(() => {
    return savedSchemes.filter((scheme) => {
      const matchesCategory =
        selectedCategory === 'All Categories' || scheme.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        scheme.title.toLowerCase().includes(q) ||
        scheme.shortDescription.toLowerCase().includes(q) ||
        scheme.ministry.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [savedSchemes, searchQuery, selectedCategory]);

  const handleRemove = (schemeId) => {
    removeSavedSchemeId(schemeId);
    if (onRefresh) onRefresh();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved schemes..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-semibold text-navy-900 focus:outline-none focus:ring-2 focus:ring-teal-500 w-full sm:w-auto"
          >
            {SCHEME_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <Link
            to="/schemes"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 hover:border-teal-400 bg-white hover:bg-teal-50/50 text-navy-900 text-xs font-bold transition-colors shrink-0"
          >
            <Compass className="w-4 h-4 text-teal-600" />
            <span>Discover More</span>
          </Link>
        </div>
      </div>

      {/* Saved Schemes Grid */}
      {filteredSchemes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSchemes.map((scheme) => (
            <div
              key={scheme.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col justify-between hover:border-slate-300 transition-all group"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Badge variant="teal">{scheme.category}</Badge>
                  <button
                    onClick={() => handleRemove(scheme.id)}
                    className="text-xs text-slate-400 hover:text-rose-600 transition-colors font-medium flex items-center gap-1 p-1 rounded hover:bg-rose-50"
                    title="Remove from saved schemes"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>

                <h3 className="font-bold text-base text-navy-900 leading-snug group-hover:text-teal-900 transition-colors">
                  {scheme.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {scheme.shortDescription}
                </p>

                <div className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="font-semibold text-slate-700">Financial Benefit:</span>{' '}
                  <span className="text-navy-900 font-bold block mt-0.5">{scheme.financialBenefit}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {/* Track Application Button */}
                  <button
                    onClick={() => onTrackScheme(scheme.id)}
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-navy-800 hover:bg-navy-900 text-white text-xs font-bold transition-colors shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Track Status</span>
                  </button>

                  {/* Prepare Guide Button */}
                  <button
                    onClick={() => onNavigateToGuide(scheme.id)}
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 text-xs font-bold transition-colors border border-teal-200/80"
                  >
                    <Layers className="w-3.5 h-3.5 text-teal-700" />
                    <span>Checklist</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <button
                    onClick={() => onOpenDetails(scheme)}
                    className="text-navy-900 hover:text-teal-700 font-bold underline"
                  >
                    View Full Details
                  </button>

                  <a
                    href={scheme.officialPortal}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:text-teal-900 underline"
                  >
                    Official Portal
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 max-w-md mx-auto">
          <Bookmark className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-navy-900 text-lg">
            {searchQuery || selectedCategory !== 'All Categories'
              ? 'No matching saved schemes'
              : 'No saved schemes yet'}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {searchQuery || selectedCategory !== 'All Categories'
              ? 'Try clearing your search query or changing category.'
              : 'Bookmark schemes from the directory to track your application readiness and keep official portal links handy.'}
          </p>
          {searchQuery || selectedCategory !== 'All Categories' ? (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All Categories');
              }}
              className="px-4 py-2 rounded-xl bg-navy-800 text-white text-xs font-bold"
            >
              Clear Filters
            </button>
          ) : (
            <Link to="/schemes">
              <Button variant="teal" size="sm" icon={Compass}>
                Explore Schemes Directory
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

