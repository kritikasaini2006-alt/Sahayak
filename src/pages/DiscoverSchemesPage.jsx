import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, BookOpen, AlertCircle, RefreshCw } from 'lucide-react';
import { MOCK_SCHEMES, SCHEME_CATEGORIES } from '../data/mockSchemes';
import SchemeCard from '../components/common/SchemeCard';
import Badge from '../components/common/Badge';

export default function DiscoverSchemesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All Categories';
  const initialQuery = searchParams.get('q') || '';

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [savedSchemeIds, setSavedSchemeIds] = useState(() => {
    try {
      const stored = localStorage.getItem('sahayak_saved_schemes');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const toggleSaveScheme = (id) => {
    setSavedSchemeIds((prev) => {
      const updated = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem('sahayak_saved_schemes', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const filteredSchemes = useMemo(() => {
    return MOCK_SCHEMES.filter((scheme) => {
      const matchesCategory =
        selectedCategory === 'All Categories' || scheme.category === selectedCategory;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        scheme.title.toLowerCase().includes(q) ||
        scheme.shortDescription.toLowerCase().includes(q) ||
        scheme.ministry.toLowerCase().includes(q) ||
        scheme.beneficiaryType.toLowerCase().includes(q) ||
        scheme.tags.some((t) => t.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    const newParams = new URLSearchParams(searchParams);
    if (category === 'All Categories') {
      newParams.delete('category');
    } else {
      newParams.set('category', category);
    }
    setSearchParams(newParams);
  };

  const handleResetFilters = () => {
    setSelectedCategory('All Categories');
    setSearchQuery('');
    setSearchParams({});
  };

  return (
    <div className="py-8 md:py-12 space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6 space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="teal">Directory</Badge>
          <span className="text-xs text-slate-500 font-medium">Public Domain Schemes</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-navy-900 tracking-tight">
          Discover Central & State Welfare Schemes
        </h1>
        <p className="text-slate-600 text-sm max-w-3xl leading-relaxed">
          Browse verified government programs across farming, healthcare, education, housing, and social security. Detailed with eligibility guidelines and direct official portal links.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by scheme name, keywords, ministry, or target beneficiary..."
              className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-slate-50/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
              >
                Clear
              </button>
            )}
          </div>

          {(searchQuery || selectedCategory !== 'All Categories') && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-medium text-slate-600 hover:text-navy-900 border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            Category:
          </span>
          {SCHEME_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-navy-800 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Schemes Results Count & Advisory */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500">
        <div>
          Showing <span className="font-bold text-navy-900">{filteredSchemes.length}</span> verified welfare initiatives
          {selectedCategory !== 'All Categories' && (
            <span> in <strong className="text-teal-700">{selectedCategory}</strong></span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-slate-600 bg-slate-100/90 px-2.5 py-1 rounded-md">
          <AlertCircle className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <span>Official portal links take you directly to verified `.gov.in` sites</span>
        </div>
      </div>

      {/* Schemes Grid */}
      {filteredSchemes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSchemes.map((scheme) => (
            <SchemeCard
              key={scheme.id}
              scheme={scheme}
              onSaveToggle={toggleSaveScheme}
              isSaved={savedSchemeIds.includes(scheme.id)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-navy-900">No schemes found matching your search</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Try adjusting your search terms or clearing category filters. You can also consult our AI Assistant to discover schemes by describing your background.
          </p>
          <button
            onClick={handleResetFilters}
            className="text-xs font-semibold text-teal-700 hover:text-teal-900 underline"
          >
            Show All Schemes
          </button>
        </div>
      )}
    </div>
  );
}

