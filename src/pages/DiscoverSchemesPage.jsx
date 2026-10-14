import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Filter,
  BookOpen,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ArrowUpDown,
  Compass,
  CheckCircle2,
  SlidersHorizontal,
  Bookmark,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { MOCK_SCHEMES, SCHEME_CATEGORIES } from '../data/mockSchemes';
import SchemeCard from '../components/common/SchemeCard';
import SchemeDetailModal from '../components/schemes/SchemeDetailModal';
import SchemeFilterSidebar from '../components/schemes/SchemeFilterSidebar';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { loadCitizenProfile, evaluateEligibility } from '../utils/eligibilityEngine';
import { getSavedSchemeIds, toggleSaveSchemeId } from '../utils/applicationStorage';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function DiscoverSchemesPage() {
  useDocumentTitle('Discover Welfare Schemes');
  const [searchParams, setSearchParams] = useSearchParams();

  // URL Query Parameters Initial States
  const initialCategory = searchParams.get('category') || 'All Categories';
  const initialQuery = searchParams.get('q') || '';
  const initialState = searchParams.get('state') || 'All India';
  const initialBeneficiary = searchParams.get('beneficiary') || 'All Beneficiaries';
  const initialSchemeType = searchParams.get('type') || 'All Scheme Types';
  const initialSort = searchParams.get('sort') || 'relevance';
  const initialOnlyEligible = searchParams.get('eligible') === 'true';

  // State Management
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedState, setSelectedState] = useState(initialState);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(initialBeneficiary);
  const [selectedSchemeType, setSelectedSchemeType] = useState(initialSchemeType);
  const [sortBy, setSortBy] = useState(initialSort);
  const [onlyEligible, setOnlyEligible] = useState(initialOnlyEligible);

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [selectedSchemeForModal, setSelectedSchemeForModal] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load Stored Citizen Profile & Evaluate Eligibility (Phase 2 Integration)
  const [citizenProfile, setCitizenProfile] = useState(null);
  useEffect(() => {
    const profile = loadCitizenProfile();
    if (profile && profile.age && profile.state) {
      setCitizenProfile(profile);
    }
  }, []);

  const eligibilityMap = useMemo(() => {
    if (!citizenProfile) return new Map();
    const evaluation = evaluateEligibility(citizenProfile, undefined, MOCK_SCHEMES);
    const map = new Map();
    evaluation.all.forEach((item) => {
      map.set(item.schemeId, item);
    });
    return map;
  }, [citizenProfile]);

  // Load and sync saved schemes from applicationStorage data layer
  const [savedSchemeIds, setSavedSchemeIds] = useState(() => getSavedSchemeIds());

  const toggleSaveScheme = (id) => {
    toggleSaveSchemeId(id);
    setSavedSchemeIds(getSavedSchemeIds());
  };

  // Sync state changes with URL query parameters
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (selectedCategory !== 'All Categories') params.set('category', selectedCategory);
    if (selectedState !== 'All India') params.set('state', selectedState);
    if (selectedBeneficiary !== 'All Beneficiaries') params.set('beneficiary', selectedBeneficiary);
    if (selectedSchemeType !== 'All Scheme Types') params.set('type', selectedSchemeType);
    if (sortBy !== 'relevance') params.set('sort', sortBy);
    if (onlyEligible) params.set('eligible', 'true');
    setSearchParams(params, { replace: true });
  }, [
    searchQuery,
    selectedCategory,
    selectedState,
    selectedBeneficiary,
    selectedSchemeType,
    sortBy,
    onlyEligible,
    setSearchParams,
  ]);

  // Simulated quick debounce loading state
  const handleSearchChange = (val) => {
    setSearchQuery(val);
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 150);
  };

  // Active filters count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'All Categories') count++;
    if (selectedState !== 'All India') count++;
    if (selectedBeneficiary !== 'All Beneficiaries') count++;
    if (selectedSchemeType !== 'All Scheme Types') count++;
    if (onlyEligible) count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [selectedCategory, selectedState, selectedBeneficiary, selectedSchemeType, onlyEligible, searchQuery]);

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedCategory('All Categories');
    setSearchQuery('');
    setSelectedState('All India');
    setSelectedBeneficiary('All Beneficiaries');
    setSelectedSchemeType('All Scheme Types');
    setOnlyEligible(false);
    setSortBy('relevance');
  };

  // Multi-attribute Filter & Sort Pipeline
  const filteredAndSortedSchemes = useMemo(() => {
    let list = MOCK_SCHEMES.filter((scheme) => {
      // 1. Search Query
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchesTitle = scheme.title.toLowerCase().includes(q);
        const matchesDesc = scheme.shortDescription.toLowerCase().includes(q);
        const matchesMinistry = scheme.ministry.toLowerCase().includes(q);
        const matchesBenefit = scheme.financialBenefit.toLowerCase().includes(q);
        const matchesTags = scheme.tags && scheme.tags.some((t) => t.toLowerCase().includes(q));
        const matchesBeneficiary =
          (scheme.beneficiaryType && scheme.beneficiaryType.toLowerCase().includes(q)) ||
          (scheme.targetBeneficiaries && scheme.targetBeneficiaries.some((b) => b.toLowerCase().includes(q)));

        if (!matchesTitle && !matchesDesc && !matchesMinistry && !matchesBenefit && !matchesTags && !matchesBeneficiary) {
          return false;
        }
      }

      // 2. Category Filter
      if (selectedCategory !== 'All Categories' && scheme.category !== selectedCategory) {
        return false;
      }

      // 3. State / UT Filter
      if (selectedState !== 'All India') {
        const isAllIndia = scheme.applicableStates && scheme.applicableStates.some((s) => s.toLowerCase().includes('all india'));
        const matchesState = scheme.applicableStates && scheme.applicableStates.includes(selectedState);
        if (!isAllIndia && !matchesState) {
          return false;
        }
      }

      // 4. Beneficiary Type Filter
      if (selectedBeneficiary !== 'All Beneficiaries') {
        const matchesBenArray = scheme.targetBeneficiaries && scheme.targetBeneficiaries.includes(selectedBeneficiary);
        const matchesBenText = scheme.beneficiaryType && scheme.beneficiaryType.toLowerCase().includes(selectedBeneficiary.toLowerCase());
        if (!matchesBenArray && !matchesBenText) {
          return false;
        }
      }

      // 5. Scheme Administrative Type Filter
      if (selectedSchemeType !== 'All Scheme Types') {
        const matchesType = (scheme.schemeType === selectedSchemeType) || (scheme.level === selectedSchemeType);
        if (!matchesType) {
          return false;
        }
      }

      // 6. Eligibility Filter (Phase 2 integration)
      if (onlyEligible && citizenProfile) {
        const evalResult = eligibilityMap.get(scheme.id);
        if (!evalResult || (evalResult.status !== 'likely_eligible' && evalResult.status !== 'possibly_eligible')) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    return list.sort((a, b) => {
      if (sortBy === 'name_asc') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'name_desc') {
        return b.title.localeCompare(a.title);
      }
      if (sortBy === 'eligibility' && citizenProfile) {
        const aStatus = eligibilityMap.get(a.id)?.status;
        const bStatus = eligibilityMap.get(b.id)?.status;
        const order = { likely_eligible: 3, possibly_eligible: 2, not_eligible: 1 };
        const aRank = order[aStatus] || 0;
        const bRank = order[bStatus] || 0;
        if (bRank !== aRank) return bRank - aRank;
      }
      // Default: relevance (popular schemes first)
      if (a.popular && !b.popular) return -1;
      if (!a.popular && b.popular) return 1;
      return 0;
    });
  }, [
    searchQuery,
    selectedCategory,
    selectedState,
    selectedBeneficiary,
    selectedSchemeType,
    onlyEligible,
    sortBy,
    citizenProfile,
    eligibilityMap,
  ]);

  return (
    <div className="py-5 sm:py-7 space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="border-b border-slate-200 pb-4 space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="teal">Directory</Badge>
          <span className="text-xs text-slate-500 font-medium">Public Domain Welfare Schemes</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-navy-900 tracking-tight">
          Discover Central & State Welfare Schemes
        </h1>
        <p className="text-slate-600 text-sm max-w-3xl leading-relaxed">
          Search and filter verified government welfare initiatives across farming, health, housing, micro-loans, and pensions. Detailed with official rules, document checklists, and authenticated application links.
        </p>

        {/* Active Profile Context Banner (If Profile Exists) */}
        {citizenProfile && (
          <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/90 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-700 shrink-0" />
              <span className="text-teal-950">
                Connected Profile: <strong>{citizenProfile.age} yrs</strong>, {citizenProfile.occupation?.replace('_', ' ')}, {citizenProfile.state} ({citizenProfile.areaType})
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setOnlyEligible(!onlyEligible)}
                className={`font-bold px-2.5 py-1 rounded-md transition-colors ${
                  onlyEligible
                    ? 'bg-teal-700 text-white'
                    : 'bg-white text-teal-800 border border-teal-300 hover:bg-teal-100'
                }`}
              >
                {onlyEligible ? 'Showing Only My Matches' : 'Filter by My Profile'}
              </button>
              <Link to="/eligibility" className="text-teal-700 hover:text-teal-900 underline font-medium">
                Edit Profile
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Search & Top Action Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search schemes by name, ministry, target beneficiary, or keyword..."
              className="w-full pl-11 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-slate-50/50"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 font-bold"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <div className="relative shrink-0">
              <label htmlFor="sort-select" className="sr-only">Sort Schemes</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
              >
                <option value="relevance">Sort: Most Relevant</option>
                <option value="name_asc">Sort: Name (A to Z)</option>
                <option value="name_desc">Sort: Name (Z to A)</option>
                {citizenProfile && <option value="eligibility">Sort: My Eligibility Match</option>}
              </select>
            </div>

            {/* Mobile Filter Drawer Button */}
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 shrink-0"
              aria-label="Open filter menu"
            >
              <SlidersHorizontal className="w-4 h-4 text-teal-600" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-navy-800 text-white flex items-center justify-center text-[10px] ml-1">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
            <span className="font-bold text-slate-400 uppercase text-[10px] mr-1">Active:</span>

            {selectedCategory !== 'All Categories' && (
              <span className="inline-flex items-center gap-1 bg-navy-50 text-navy-800 border border-navy-200 px-2 py-0.5 rounded-md text-[11px]">
                Category: {selectedCategory}
                <button onClick={() => setSelectedCategory('All Categories')} className="text-slate-400 hover:text-navy-900">✕</button>
              </span>
            )}

            {selectedBeneficiary !== 'All Beneficiaries' && (
              <span className="inline-flex items-center gap-1 bg-navy-50 text-navy-800 border border-navy-200 px-2 py-0.5 rounded-md text-[11px]">
                Beneficiary: {selectedBeneficiary}
                <button onClick={() => setSelectedBeneficiary('All Beneficiaries')} className="text-slate-400 hover:text-navy-900">✕</button>
              </span>
            )}

            {selectedState !== 'All India' && (
              <span className="inline-flex items-center gap-1 bg-navy-50 text-navy-800 border border-navy-200 px-2 py-0.5 rounded-md text-[11px]">
                State: {selectedState}
                <button onClick={() => setSelectedState('All India')} className="text-slate-400 hover:text-navy-900">✕</button>
              </span>
            )}

            {selectedSchemeType !== 'All Scheme Types' && (
              <span className="inline-flex items-center gap-1 bg-navy-50 text-navy-800 border border-navy-200 px-2 py-0.5 rounded-md text-[11px]">
                Type: {selectedSchemeType}
                <button onClick={() => setSelectedSchemeType('All Scheme Types')} className="text-slate-400 hover:text-navy-900">✕</button>
              </span>
            )}

            {onlyEligible && (
              <span className="inline-flex items-center gap-1 bg-teal-100 text-teal-800 border border-teal-300 px-2 py-0.5 rounded-md text-[11px] font-bold">
                My Matches Only
                <button onClick={() => setOnlyEligible(false)} className="text-teal-900 hover:text-teal-950">✕</button>
              </span>
            )}

            <button
              onClick={handleResetFilters}
              className="text-[11px] font-bold text-red-600 hover:text-red-800 underline ml-2"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Sidebar + Cards */}
      <div className="flex items-start gap-6">
        {/* Desktop Filter Sidebar */}
        <SchemeFilterSidebar
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          selectedState={selectedState}
          onSelectState={setSelectedState}
          selectedBeneficiary={selectedBeneficiary}
          onSelectBeneficiary={setSelectedBeneficiary}
          selectedSchemeType={selectedSchemeType}
          onSelectSchemeType={setSelectedSchemeType}
          onlyEligible={onlyEligible}
          onToggleOnlyEligible={setOnlyEligible}
          hasActiveProfile={!!citizenProfile}
          onResetFilters={handleResetFilters}
          totalMatching={filteredAndSortedSchemes.length}
          activeFilterCount={activeFilterCount}
          isMobileOpen={isMobileFilterOpen}
          onCloseMobile={() => setIsMobileFilterOpen(false)}
        />

        {/* Schemes Catalog Stream */}
        <div className="flex-1 space-y-5">
          {/* Results Summary Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
            <div>
              Showing <span className="font-bold text-navy-900">{filteredAndSortedSchemes.length}</span> verified welfare initiatives
              {selectedCategory !== 'All Categories' && (
                <span> in <strong className="text-teal-700">{selectedCategory}</strong></span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>Grounded in official Central & State Government gazettes</span>
            </div>
          </div>

          {/* Loading or Cards View */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-64 bg-slate-100 rounded-xl border border-slate-200" />
              ))}
            </div>
          ) : filteredAndSortedSchemes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredAndSortedSchemes.map((scheme) => (
                <SchemeCard
                  key={scheme.id}
                  scheme={scheme}
                  onSaveToggle={toggleSaveScheme}
                  isSaved={savedSchemeIds.includes(scheme.id)}
                  onViewDetails={(s) => setSelectedSchemeForModal(s)}
                  eligibilityStatus={citizenProfile ? eligibilityMap.get(scheme.id)?.status : undefined}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 max-w-lg mx-auto shadow-sm">
              <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-navy-900">No schemes found matching your criteria</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                We couldn't find any government schemes matching your search or active filter combination. Try clearing your filters or testing with broader terms.
              </p>
              <div className="pt-2">
                <Button
                  variant="teal"
                  size="sm"
                  onClick={handleResetFilters}
                  icon={RefreshCw}
                >
                  Reset All Filters
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scheme Detail Modal */}
      {selectedSchemeForModal && (
        <SchemeDetailModal
          scheme={selectedSchemeForModal}
          isOpen={!!selectedSchemeForModal}
          onClose={() => setSelectedSchemeForModal(null)}
          isSaved={savedSchemeIds.includes(selectedSchemeForModal.id)}
          onToggleSave={toggleSaveScheme}
          eligibilityEvaluation={citizenProfile ? eligibilityMap.get(selectedSchemeForModal.id) : undefined}
        />
      )}
    </div>
  );
}
