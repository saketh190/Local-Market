import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    FiSearch, FiPlusCircle, FiMessageSquare, FiUser, FiLogOut,
    FiMenu, FiX, FiChevronDown, FiShoppingBag, FiPackage, FiHeart
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import './Navbar.css';

export default function Navbar() {
    const { user, logout } = useAuth();
    const { unreadCount } = useSocket();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState('');
    const [showMenu, setShowMenu] = useState(false);
    const [showMobile, setShowMobile] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
            setShowMobile(false);
        }
    };

    const handleLogout = () => {
        logout();
        setShowMenu(false);
        navigate('/');
    };

    return (
        <nav className="navbar">
            <div className="navbar-inner container">
                {/* Logo */}
                <Link to="/" className="navbar-logo">
                    <div className="logo-icon">
                        <FiShoppingBag />
                    </div>
                    <span className="logo-text">LocalMarket</span>
                </Link>

                {/* Search */}
                <form className="navbar-search" onSubmit={handleSearch}>
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search for anything..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                </form>

                {/* Actions */}
                <div className="navbar-actions">
                    {user ? (
                        <>
                            {user.role === 'seller' && (
                                <Link to="/post" className="btn btn-primary btn-sell">
                                    <FiPlusCircle />
                                    <span>Sell</span>
                                </Link>
                            )}

                            <Link to="/chat" className="nav-action-btn" title="Messages">
                                <FiMessageSquare />
                                {unreadCount > 0 && (
                                    <span className="badge-count">{unreadCount}</span>
                                )}
                            </Link>

                            <div className="user-menu" ref={menuRef}>
                                <button
                                    className="user-menu-trigger"
                                    onClick={() => setShowMenu(!showMenu)}
                                >
                                    <div className="user-avatar">
                                        {user.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="user-name">{user.name?.split(' ')[0]}</span>
                                    <FiChevronDown className={`chevron ${showMenu ? 'open' : ''}`} />
                                </button>

                                {showMenu && (
                                    <div className="user-dropdown animate-fade-in">
                                        <div className="dropdown-header">
                                            <p className="dropdown-name">{user.name}</p>
                                            <span className="badge badge-primary">{user.role}</span>
                                        </div>
                                        <div className="dropdown-divider"></div>
                                        <Link to="/profile" className="dropdown-item" onClick={() => setShowMenu(false)}>
                                            <FiUser /> Profile
                                        </Link>
                                        {user.role === 'seller' && (
                                            <Link to="/my-listings" className="dropdown-item" onClick={() => setShowMenu(false)}>
                                                <FiPackage /> My Listings
                                            </Link>
                                        )}
                                        <Link to="/chat" className="dropdown-item" onClick={() => setShowMenu(false)}>
                                            <FiMessageSquare /> Messages
                                        </Link>
                                        <div className="dropdown-divider"></div>
                                        <button className="dropdown-item text-danger" onClick={handleLogout}>
                                            <FiLogOut /> Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="auth-buttons">
                            <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
                            <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
                        </div>
                    )}

                    <button className="mobile-toggle" onClick={() => setShowMobile(!showMobile)}>
                        {showMobile ? <FiX /> : <FiMenu />}
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {showMobile && (
                <div className="mobile-menu animate-slide-up">
                    <form className="mobile-search" onSubmit={handleSearch}>
                        <FiSearch />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </form>
                    {user ? (
                        <>
                            {user.role === 'seller' && (
                                <Link to="/post" className="mobile-link" onClick={() => setShowMobile(false)}>
                                    <FiPlusCircle /> Post Ad
                                </Link>
                            )}
                            <Link to="/chat" className="mobile-link" onClick={() => setShowMobile(false)}>
                                <FiMessageSquare /> Messages
                            </Link>
                            <Link to="/profile" className="mobile-link" onClick={() => setShowMobile(false)}>
                                <FiUser /> Profile
                            </Link>
                            <button className="mobile-link text-danger" onClick={() => { handleLogout(); setShowMobile(false); }}>
                                <FiLogOut /> Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="mobile-link" onClick={() => setShowMobile(false)}>Login</Link>
                            <Link to="/register" className="mobile-link" onClick={() => setShowMobile(false)}>Register</Link>
                        </>
                    )}
                </div>
            )}
        </nav>
    );
}
