import { useState, useEffect } from 'react';
import { FiSliders, FiX } from 'react-icons/fi';
import api from '../utils/api';
import './FilterSidebar.css';

const conditions = [
    { value: '', label: 'All' },
    { value: 'new', label: 'New' },
    { value: 'like_new', label: 'Like New' },
    { value: 'used', label: 'Used' },
    { value: 'refurbished', label: 'Refurbished' },
];

const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'popular', label: 'Most Popular' },
];

export default function FilterSidebar({ filters, onFilterChange, isOpen, onClose }) {
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        api.get('/categories').then((res) => setCategories(res.data)).catch(console.error);
    }, []);

    const handleChange = (key, value) => {
        onFilterChange({ ...filters, [key]: value });
    };

    const clearFilters = () => {
        onFilterChange({
            category: '',
            min_price: '',
            max_price: '',
            condition: '',
            location: '',
            sort: 'newest',
        });
    };

    return (
        <aside className={`filter-sidebar ${isOpen ? 'open' : ''}`}>
            <div className="filter-header">
                <h3><FiSliders /> Filters</h3>
                <button className="filter-close" onClick={onClose}><FiX /></button>
            </div>

            {/* Sort */}
            <div className="filter-section">
                <label>Sort By</label>
                <select
                    className="input-field"
                    value={filters.sort}
                    onChange={(e) => handleChange('sort', e.target.value)}
                >
                    {sortOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>

            {/* Categories */}
            <div className="filter-section">
                <label>Category</label>
                <div className="category-chips">
                    <button
                        className={`chip ${!filters.category ? 'active' : ''}`}
                        onClick={() => handleChange('category', '')}
                    >
                        All
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            className={`chip ${filters.category === cat.slug ? 'active' : ''}`}
                            onClick={() => handleChange('category', cat.slug)}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Price Range */}
            <div className="filter-section">
                <label>Price Range</label>
                <div className="price-range">
                    <input
                        type="number"
                        className="input-field"
                        placeholder="Min"
                        value={filters.min_price}
                        onChange={(e) => handleChange('min_price', e.target.value)}
                    />
                    <span className="range-sep">—</span>
                    <input
                        type="number"
                        className="input-field"
                        placeholder="Max"
                        value={filters.max_price}
                        onChange={(e) => handleChange('max_price', e.target.value)}
                    />
                </div>
            </div>

            {/* Condition */}
            <div className="filter-section">
                <label>Condition</label>
                <div className="condition-toggles">
                    {conditions.map((c) => (
                        <button
                            key={c.value}
                            className={`chip ${filters.condition === c.value ? 'active' : ''}`}
                            onClick={() => handleChange('condition', c.value)}
                        >
                            {c.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Location */}
            <div className="filter-section">
                <label>Location</label>
                <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Hyderabad"
                    value={filters.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                />
            </div>

            <button className="btn btn-secondary clear-btn" onClick={clearFilters}>
                Clear All Filters
            </button>
        </aside>
    );
}
