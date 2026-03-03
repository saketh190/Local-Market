import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPackage, FiEdit2, FiTrash2, FiEye, FiPlusCircle } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './MyListings.css';

export default function MyListings() {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchListings();
    }, []);

    const fetchListings = async () => {
        try {
            const res = await api.get('/listings/user/me');
            setListings(res.data);
        } catch (err) {
            toast.error('Failed to load listings');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this listing?')) return;
        try {
            await api.delete(`/listings/${id}`);
            setListings((prev) => prev.filter((l) => l.id !== id));
            toast.success('Listing deleted');
        } catch (err) {
            toast.error('Failed to delete listing');
        }
    };

    const toggleStatus = async (listing) => {
        const newStatus = listing.status === 'active' ? 'sold' : 'active';
        try {
            await api.put(`/listings/${listing.id}`, { status: newStatus });
            setListings((prev) =>
                prev.map((l) => (l.id === listing.id ? { ...l, status: newStatus } : l))
            );
            toast.success(`Marked as ${newStatus}`);
        } catch (err) {
            toast.error('Failed to update');
        }
    };

    if (loading) {
        return <div className="page"><div className="loader" style={{ minHeight: '60vh' }}><div className="spinner"></div></div></div>;
    }

    return (
        <div className="page my-listings-page">
            <div className="container">
                <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1><FiPackage /> My Listings</h1>
                        <p>{listings.length} listing{listings.length !== 1 ? 's' : ''}</p>
                    </div>
                    <Link to="/post" className="btn btn-primary">
                        <FiPlusCircle /> Post New Ad
                    </Link>
                </div>

                {listings.length === 0 ? (
                    <div className="empty-state glass-card" style={{ borderRadius: 'var(--radius-xl)' }}>
                        <FiPackage />
                        <h3>No listings yet</h3>
                        <p>Start selling by posting your first ad.</p>
                        <Link to="/post" className="btn btn-primary" style={{ marginTop: '16px' }}>
                            <FiPlusCircle /> Post Your First Ad
                        </Link>
                    </div>
                ) : (
                    <div className="my-listings-grid">
                        {listings.map((listing) => (
                            <div key={listing.id} className="my-listing-item glass-card animate-fade-in">
                                <div className="my-listing-image">
                                    <img
                                        src={listing.primary_image || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150"><rect fill="%231A2035" width="200" height="150"/><text x="100" y="75" text-anchor="middle" fill="%2364748B" font-size="12">No Image</text></svg>'}
                                        alt={listing.title}
                                    />
                                    <span className={`status-dot ${listing.status}`}></span>
                                </div>

                                <div className="my-listing-details">
                                    <h3>{listing.title}</h3>
                                    <p className="my-listing-price">₹{Number(listing.price).toLocaleString('en-IN')}</p>
                                    <div className="my-listing-meta">
                                        <span className={`badge ${listing.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                                            {listing.status}
                                        </span>
                                        <span className="meta-item"><FiEye /> {listing.views_count || 0}</span>
                                        <span className="meta-item">{formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}</span>
                                    </div>
                                </div>

                                <div className="my-listing-actions">
                                    <Link to={`/listing/${listing.id}`} className="btn btn-secondary btn-sm">
                                        <FiEye />
                                    </Link>
                                    <button className="btn btn-secondary btn-sm" onClick={() => toggleStatus(listing)}>
                                        {listing.status === 'active' ? 'Mark Sold' : 'Reactivate'}
                                    </button>
                                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(listing.id)}>
                                        <FiTrash2 />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
