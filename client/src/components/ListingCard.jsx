import { Link } from 'react-router-dom';
import { FiHeart, FiMapPin, FiEye } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import './ListingCard.css';

export default function ListingCard({ listing, onFavorite }) {
    const imageUrl = listing.primary_image || '/placeholder.svg';
    const timeAgo = listing.created_at
        ? formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })
        : '';

    return (
        <Link to={`/listing/${listing.id}`} className="listing-card glass-card">
            <div className="card-image-wrap">
                <img
                    src={imageUrl}
                    alt={listing.title}
                    className="card-image"
                    onError={(e) => {
                        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect fill="%231A2035" width="400" height="300"/><text x="200" y="150" text-anchor="middle" fill="%2364748B" font-size="16" font-family="Inter">No Image</text></svg>';
                    }}
                />
                {listing.condition && listing.condition !== 'used' && (
                    <span className="card-condition badge badge-primary">
                        {listing.condition === 'new' ? 'New' : listing.condition === 'like_new' ? 'Like New' : 'Refurbished'}
                    </span>
                )}
                {onFavorite && (
                    <button
                        className="card-fav-btn"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onFavorite(listing.id);
                        }}
                    >
                        <FiHeart />
                    </button>
                )}
            </div>

            <div className="card-body">
                <h3 className="card-title">{listing.title}</h3>
                <p className="card-price">₹{Number(listing.price).toLocaleString('en-IN')}</p>
                <div className="card-meta">
                    <span className="card-location">
                        <FiMapPin /> {listing.location || listing.seller_location || 'India'}
                    </span>
                    <span className="card-time">{timeAgo}</span>
                </div>
            </div>
        </Link>
    );
}
