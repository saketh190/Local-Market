import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FiArrowLeft, FiMapPin, FiClock, FiEye, FiHeart, FiMessageSquare,
    FiDownload, FiShare2, FiTag, FiUser, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import { formatDistanceToNow, format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './ListingDetail.css';

export default function ListingDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState(0);

    useEffect(() => {
        fetchListing();
    }, [id]);

    const fetchListing = async () => {
        try {
            const res = await api.get(`/listings/${id}`);
            setListing(res.data);
        } catch (err) {
            toast.error('Listing not found');
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    const handleChat = async () => {
        if (!user) {
            toast.error('Please login to chat');
            navigate('/login');
            return;
        }
        try {
            const res = await api.post('/chat/conversations', { listing_id: listing.id });
            navigate(`/chat/${res.data.id}`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to start chat');
        }
    };

    const handleDownload = (imageUrl) => {
        const filename = imageUrl.split('/').pop();
        const a = document.createElement('a');
        a.href = `/api/download/${filename}`;
        a.download = filename;
        a.click();
        toast.success('Download started!');
    };

    const nextImage = () => {
        if (listing?.images?.length > 0) {
            setActiveImage((prev) => (prev + 1) % listing.images.length);
        }
    };

    const prevImage = () => {
        if (listing?.images?.length > 0) {
            setActiveImage((prev) => (prev - 1 + listing.images.length) % listing.images.length);
        }
    };

    if (loading) {
        return <div className="page"><div className="loader" style={{ minHeight: '60vh' }}><div className="spinner"></div></div></div>;
    }

    if (!listing) return null;

    const images = listing.images || [];
    const currentImage = images[activeImage]?.image_url || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"><rect fill="%231A2035" width="600" height="400"/><text x="300" y="200" text-anchor="middle" fill="%2364748B" font-size="18" font-family="Inter">No Image Available</text></svg>';

    return (
        <div className="page listing-detail-page">
            <div className="container">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <FiArrowLeft /> Back
                </button>

                <div className="detail-layout">
                    {/* Image Gallery */}
                    <div className="detail-gallery">
                        <div className="gallery-main">
                            <img src={currentImage} alt={listing.title} className="gallery-image" />
                            {images.length > 1 && (
                                <>
                                    <button className="gallery-nav prev" onClick={prevImage}><FiChevronLeft /></button>
                                    <button className="gallery-nav next" onClick={nextImage}><FiChevronRight /></button>
                                </>
                            )}
                            <div className="gallery-counter">
                                {activeImage + 1} / {images.length || 1}
                            </div>
                        </div>
                        {images.length > 1 && (
                            <div className="gallery-thumbs">
                                {images.map((img, i) => (
                                    <button
                                        key={img.id}
                                        className={`thumb ${i === activeImage ? 'active' : ''}`}
                                        onClick={() => setActiveImage(i)}
                                    >
                                        <img src={img.image_url} alt={`${listing.title} ${i + 1}`} />
                                    </button>
                                ))}
                            </div>
                        )}
                        {images.length > 0 && (
                            <button className="btn btn-secondary download-all-btn" onClick={() => handleDownload(currentImage)}>
                                <FiDownload /> Download Image
                            </button>
                        )}
                    </div>

                    {/* Details */}
                    <div className="detail-info">
                        <div className="detail-card glass-card">
                            <div className="detail-card:hover" style={{ transform: 'none' }}></div>
                            <div className="detail-top">
                                <span className="badge badge-primary">
                                    <FiTag /> {listing.category_name}
                                </span>
                                {listing.condition && (
                                    <span className="badge badge-success">
                                        {listing.condition === 'new' ? 'Brand New' :
                                            listing.condition === 'like_new' ? 'Like New' :
                                                listing.condition === 'refurbished' ? 'Refurbished' : 'Used'}
                                    </span>
                                )}
                            </div>

                            <h1 className="detail-title">{listing.title}</h1>

                            <p className="detail-price">₹{Number(listing.price).toLocaleString('en-IN')}</p>

                            <div className="detail-meta">
                                <span><FiMapPin /> {listing.location || 'India'}</span>
                                <span><FiClock /> {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}</span>
                                <span><FiEye /> {listing.views_count} views</span>
                            </div>

                            <div className="detail-divider"></div>

                            <div className="detail-section">
                                <h3>Description</h3>
                                <p className="detail-description">{listing.description || 'No description provided.'}</p>
                            </div>

                            <div className="detail-divider"></div>

                            {/* Seller card */}
                            <div className="seller-card">
                                <div className="seller-avatar">
                                    {listing.seller_name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="seller-info">
                                    <h4>{listing.seller_name}</h4>
                                    <p>Member since {format(new Date(listing.seller_joined), 'MMM yyyy')}</p>
                                    {listing.seller_location && <p><FiMapPin /> {listing.seller_location}</p>}
                                </div>
                            </div>

                            {/* Action buttons */}
                            {user && user.id !== listing.seller_id && (
                                <div className="detail-actions">
                                    <button className="btn btn-primary btn-lg btn-block" onClick={handleChat}>
                                        <FiMessageSquare /> Chat with Seller
                                    </button>
                                </div>
                            )}

                            {!user && (
                                <div className="detail-actions">
                                    <button className="btn btn-primary btn-lg btn-block" onClick={() => navigate('/login')}>
                                        Login to Contact Seller
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
