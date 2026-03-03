import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUploadCloud, FiX, FiImage, FiCheck } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './PostListing.css';

export default function PostListing() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [form, setForm] = useState({
        title: '',
        description: '',
        price: '',
        category_id: '',
        location: '',
        condition: 'used',
    });

    useEffect(() => {
        api.get('/categories').then((res) => setCategories(res.data)).catch(console.error);
    }, []);

    const handleChange = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files);
        if (images.length + files.length > 5) {
            toast.error('Maximum 5 images allowed');
            return;
        }

        setImages((prev) => [...prev, ...files]);

        files.forEach((file) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreviews((prev) => [...prev, e.target.result]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
        setPreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title || !form.price || !form.category_id) {
            toast.error('Title, price, and category are required');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            Object.entries(form).forEach(([key, value]) => {
                formData.append(key, value);
            });
            images.forEach((img) => formData.append('images', img));

            await api.post('/listings', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            toast.success('Listing posted successfully!');
            navigate('/my-listings');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to post listing');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page post-listing-page">
            <div className="container">
                <div className="post-container">
                    <div className="post-header">
                        <h1>Post Your Ad</h1>
                        <p>Fill in the details to list your item for sale</p>
                    </div>

                    <form className="post-form glass-card" onSubmit={handleSubmit}>
                        {/* Images */}
                        <div className="form-section">
                            <h3><FiImage /> Photos</h3>
                            <p className="section-hint">Add up to 5 photos. First image will be the cover.</p>

                            <div className="image-upload-area">
                                {previews.map((preview, i) => (
                                    <div key={i} className="preview-item">
                                        <img src={preview} alt={`Preview ${i + 1}`} />
                                        <button type="button" className="remove-btn" onClick={() => removeImage(i)}>
                                            <FiX />
                                        </button>
                                        {i === 0 && <span className="cover-badge">Cover</span>}
                                    </div>
                                ))}
                                {images.length < 5 && (
                                    <button
                                        type="button"
                                        className="upload-btn"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <FiUploadCloud />
                                        <span>Add Photo</span>
                                    </button>
                                )}
                            </div>

                            <input
                                type="file"
                                ref={fileInputRef}
                                hidden
                                accept="image/*"
                                multiple
                                onChange={handleImageSelect}
                            />
                        </div>

                        {/* Details */}
                        <div className="form-section">
                            <h3>Details</h3>

                            <div className="input-group">
                                <label>Title *</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="e.g. iPhone 15 Pro Max, 256GB"
                                    value={form.title}
                                    onChange={(e) => handleChange('title', e.target.value)}
                                    maxLength={200}
                                />
                            </div>

                            <div className="input-group">
                                <label>Description</label>
                                <textarea
                                    className="input-field"
                                    placeholder="Describe your item — condition, features, reason for selling..."
                                    value={form.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    rows={5}
                                />
                            </div>

                            <div className="form-row">
                                <div className="input-group">
                                    <label>Category *</label>
                                    <select
                                        className="input-field"
                                        value={form.category_id}
                                        onChange={(e) => handleChange('category_id', e.target.value)}
                                    >
                                        <option value="">Select category</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="input-group">
                                    <label>Price (₹) *</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        placeholder="0"
                                        value={form.price}
                                        onChange={(e) => handleChange('price', e.target.value)}
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="input-group">
                                    <label>Condition</label>
                                    <select
                                        className="input-field"
                                        value={form.condition}
                                        onChange={(e) => handleChange('condition', e.target.value)}
                                    >
                                        <option value="new">Brand New</option>
                                        <option value="like_new">Like New</option>
                                        <option value="used">Used</option>
                                        <option value="refurbished">Refurbished</option>
                                    </select>
                                </div>

                                <div className="input-group">
                                    <label>Location</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="e.g. Hyderabad"
                                        value={form.location}
                                        onChange={(e) => handleChange('location', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
                            {loading ? 'Posting...' : <><FiCheck /> Post Listing</>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
