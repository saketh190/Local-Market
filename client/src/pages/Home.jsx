import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiSliders, FiTrendingUp, FiZap, FiGrid } from 'react-icons/fi';
import api from '../utils/api';
import ListingCard from '../components/ListingCard';
import FilterSidebar from '../components/FilterSidebar';
import './Home.css';

export default function Home() {
    const [searchParams] = useSearchParams();
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [filters, setFilters] = useState({
        category: '',
        min_price: '',
        max_price: '',
        condition: '',
        location: '',
        sort: 'newest',
    });

    const searchQuery = searchParams.get('search') || '';

    const fetchListings = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: 12,
                search: searchQuery,
                ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
            };
            const res = await api.get('/listings', { params });
            if (page === 1) {
                setListings(res.data.listings);
            } else {
                setListings((prev) => [...prev, ...res.data.listings]);
            }
            setPagination(res.data.pagination);
        } catch (err) {
            console.error('Fetch listings error:', err);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, filters]);

    useEffect(() => {
        fetchListings(1);
    }, [fetchListings]);

    const loadMore = () => {
        if (pagination.page < pagination.pages) {
            fetchListings(pagination.page + 1);
        }
    };

    return (
        <div className="page">
            {/* Hero */}
            {!searchQuery && (
                <section className="hero">
                    <div className="hero-content container">
                        <div className="hero-badge">
                            <FiZap /> Trusted Local Marketplace
                        </div>
                        <h1 className="hero-title">
                            Buy & Sell <span className="gradient-text">Locally</span>
                        </h1>
                        <p className="hero-subtitle">
                            Discover amazing deals near you. Connect with buyers and sellers in your neighborhood.
                        </p>
                        <div className="hero-stats">
                            <div className="stat">
                                <span className="stat-value">{pagination.total || '0'}</span>
                                <span className="stat-label">Active Listings</span>
                            </div>
                            <div className="stat-divider"></div>
                            <div className="stat">
                                <span className="stat-value">10</span>
                                <span className="stat-label">Categories</span>
                            </div>
                            <div className="stat-divider"></div>
                            <div className="stat">
                                <span className="stat-value">24/7</span>
                                <span className="stat-label">Live Chat</span>
                            </div>
                        </div>
                    </div>
                    <div className="hero-glow"></div>
                </section>
            )}

            <div className="container">
                {/* Toolbar */}
                <div className="toolbar">
                    <div className="toolbar-left">
                        <h2>
                            {searchQuery ? (
                                <>Results for "<span className="gradient-text">{searchQuery}</span>"</>
                            ) : (
                                <><FiGrid /> Browse Listings</>
                            )}
                        </h2>
                        <span className="results-count">{pagination.total} results</span>
                    </div>
                    <button className="btn btn-secondary filter-toggle-btn" onClick={() => setFiltersOpen(true)}>
                        <FiSliders /> Filters
                    </button>
                </div>

                {/* Main content */}
                <div className="home-layout">
                    <FilterSidebar
                        filters={filters}
                        onFilterChange={setFilters}
                        isOpen={filtersOpen}
                        onClose={() => setFiltersOpen(false)}
                    />

                    <main className="listings-area">
                        {loading && listings.length === 0 ? (
                            <div className="loader"><div className="spinner"></div></div>
                        ) : listings.length === 0 ? (
                            <div className="empty-state">
                                <FiGrid />
                                <h3>No listings found</h3>
                                <p>Try adjusting your filters or search query to find what you're looking for.</p>
                            </div>
                        ) : (
                            <>
                                <div className="listings-grid">
                                    {listings.map((listing, i) => (
                                        <div key={listing.id} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                                            <ListingCard listing={listing} />
                                        </div>
                                    ))}
                                </div>

                                {pagination.page < pagination.pages && (
                                    <div className="load-more">
                                        <button className="btn btn-secondary btn-lg" onClick={loadMore} disabled={loading}>
                                            {loading ? 'Loading...' : 'Load More'}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </main>
                </div>
            </div>

            {/* Filter overlay for mobile */}
            {filtersOpen && <div className="filter-overlay" onClick={() => setFiltersOpen(false)}></div>}
        </div>
    );
}
