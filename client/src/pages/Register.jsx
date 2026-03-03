import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiPhone, FiMapPin, FiArrowRight } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

export default function Register() {
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        location: '',
        role: 'buyer',
    });
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.password) {
            toast.error('Name, email, and password are required');
            return;
        }
        setLoading(true);
        try {
            await register(form);
            toast.success('Account created successfully!');
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page page">
            <div className="auth-container">
                <div className="auth-card glass-card">
                    <div className="auth-header">
                        <h1>Create Account</h1>
                        <p>Join the marketplace and start trading</p>
                    </div>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        {/* Role selector */}
                        <div className="role-selector">
                            <button
                                type="button"
                                className={`role-btn ${form.role === 'buyer' ? 'active' : ''}`}
                                onClick={() => handleChange('role', 'buyer')}
                            >
                                <span className="role-emoji">🛒</span>
                                <span className="role-label">I want to Buy</span>
                            </button>
                            <button
                                type="button"
                                className={`role-btn ${form.role === 'seller' ? 'active' : ''}`}
                                onClick={() => handleChange('role', 'seller')}
                            >
                                <span className="role-emoji">🏪</span>
                                <span className="role-label">I want to Sell</span>
                            </button>
                        </div>

                        <div className="input-group">
                            <label>Full Name</label>
                            <div className="input-icon-wrap">
                                <FiUser className="input-icon" />
                                <input
                                    type="text"
                                    className="input-field has-icon"
                                    placeholder="John Doe"
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
                                    placeholder="your@email.com"
                                    value={form.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Password</label>
                            <div className="input-icon-wrap">
                                <FiLock className="input-icon" />
                                <input
                                    type="password"
                                    className="input-field has-icon"
                                    placeholder="Create a password"
                                    value={form.password}
                                    onChange={(e) => handleChange('password', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="input-row">
                            <div className="input-group">
                                <label>Phone</label>
                                <div className="input-icon-wrap">
                                    <FiPhone className="input-icon" />
                                    <input
                                        type="tel"
                                        className="input-field has-icon"
                                        placeholder="+91 98765 43210"
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
                                        placeholder="Hyderabad"
                                        value={form.location}
                                        onChange={(e) => handleChange('location', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
                            {loading ? 'Creating account...' : 'Create Account'} <FiArrowRight />
                        </button>
                    </form>

                    <p className="auth-footer">
                        Already have an account? <Link to="/login">Sign in</Link>
                    </p>
                </div>

                <div className="auth-glow"></div>
            </div>
        </div>
    );
}
