import { useState } from 'react';
import { FiUser, FiMail, FiPhone, FiMapPin, FiSave } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './Profile.css';

export default function Profile() {
    const { user, updateUser } = useAuth();
    const [form, setForm] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        location: user?.location || '',
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.put('/auth/profile', form);
            updateUser(res.data);
            toast.success('Profile updated!');
        } catch (err) {
            toast.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="page profile-page">
            <div className="container">
                <div className="profile-container">
                    <div className="profile-header glass-card">
                        <div className="profile-avatar-large">
                            {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="profile-header-info">
                            <h1>{user.name}</h1>
                            <p>{user.email}</p>
                            <span className="badge badge-primary">{user.role}</span>
                        </div>
                    </div>

                    <form className="profile-form glass-card" onSubmit={handleSubmit}>
                        <h2>Edit Profile</h2>

                        <div className="input-group">
                            <label>Full Name</label>
                            <div className="input-icon-wrap">
                                <FiUser className="input-icon" />
                                <input
                                    type="text"
                                    className="input-field has-icon"
                                    value={form.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Email</label>
                            <div className="input-icon-wrap">
                                <FiMail className="input-icon" />
                                <input
                                    type="email"
                                    className="input-field has-icon"
                                    value={user.email}
                                    disabled
                                    style={{ opacity: 0.6 }}
                                />
                            </div>
                        </div>

                        <div className="profile-row">
                            <div className="input-group">
                                <label>Phone</label>
                                <div className="input-icon-wrap">
                                    <FiPhone className="input-icon" />
                                    <input
                                        type="tel"
                                        className="input-field has-icon"
                                        placeholder="Your phone number"
                                        value={form.phone}
                                        onChange={(e) => handleChange('phone', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Location</label>
                                <div className="input-icon-wrap">
                                    <FiMapPin className="input-icon" />
                                    <input
                                        type="text"
                                        className="input-field has-icon"
                                        placeholder="Your city"
                                        value={form.location}
                                        onChange={(e) => handleChange('location', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                            <FiSave /> {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
