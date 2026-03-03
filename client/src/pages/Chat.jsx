import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiSend, FiMessageSquare, FiArrowLeft } from 'react-icons/fi';
import { formatDistanceToNow, format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './Chat.css';

export default function Chat() {
    const { conversationId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { socket, resetUnread } = useSocket();
    const [conversations, setConversations] = useState([]);
    const [activeConv, setActiveConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [typing, setTyping] = useState(null);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Load conversations
    useEffect(() => {
        fetchConversations();
        resetUnread();
    }, []);

    // Load messages when conversation changes
    useEffect(() => {
        if (conversationId) {
            loadConversation(conversationId);
        }
    }, [conversationId]);

    // Socket listeners
    useEffect(() => {
        if (!socket) return;

        socket.on('new_message', (message) => {
            setMessages((prev) => [...prev, message]);
            scrollToBottom();
            // Update conversation list
            setConversations((prev) =>
                prev.map((c) =>
                    c.id === message.conversation_id
                        ? { ...c, last_message: message.content, last_message_time: message.created_at }
                        : c
                )
            );
        });

        socket.on('user_typing', (data) => {
            setTyping(data.user_name);
        });

        socket.on('user_stop_typing', () => {
            setTyping(null);
        });

        return () => {
            socket.off('new_message');
            socket.off('user_typing');
            socket.off('user_stop_typing');
        };
    }, [socket]);

    // Auto scroll
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const fetchConversations = async () => {
        try {
            const res = await api.get('/chat/conversations');
            setConversations(res.data);
        } catch (err) {
            console.error('Fetch conversations error:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadConversation = async (id) => {
        try {
            const res = await api.get(`/chat/conversations/${id}/messages`);
            setMessages(res.data);
            setActiveConv(conversations.find((c) => c.id === Number(id)) || { id: Number(id) });

            // Join socket room
            if (socket) {
                socket.emit('join_conversation', id);
            }
        } catch (err) {
            toast.error('Failed to load messages');
        }
    };

    const selectConversation = (conv) => {
        setActiveConv(conv);
        navigate(`/chat/${conv.id}`);
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !conversationId) return;

        if (socket) {
            socket.emit('send_message', {
                conversation_id: Number(conversationId),
                sender_id: user.id,
                content: newMessage.trim(),
            });
            socket.emit('stop_typing', { conversation_id: Number(conversationId), user_id: user.id });
        }

        setNewMessage('');
    };

    const handleTyping = (e) => {
        setNewMessage(e.target.value);

        if (socket && conversationId) {
            socket.emit('typing', {
                conversation_id: Number(conversationId),
                user_id: user.id,
                user_name: user.name,
            });

            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                socket.emit('stop_typing', {
                    conversation_id: Number(conversationId),
                    user_id: user.id,
                });
            }, 2000);
        }
    };

    const getOtherUser = (conv) => {
        if (!conv) return {};
        return conv.buyer_id === user.id
            ? { name: conv.seller_name, avatar: conv.seller_avatar }
            : { name: conv.buyer_name, avatar: conv.buyer_avatar };
    };

    if (loading) {
        return <div className="page"><div className="loader" style={{ minHeight: '60vh' }}><div className="spinner"></div></div></div>;
    }

    return (
        <div className="page chat-page">
            <div className="chat-container">
                {/* Conversations List */}
                <div className={`chat-sidebar ${conversationId ? 'hide-mobile' : ''}`}>
                    <div className="chat-sidebar-header">
                        <h2><FiMessageSquare /> Messages</h2>
                    </div>
                    <div className="conversations-list">
                        {conversations.length === 0 ? (
                            <div className="empty-state" style={{ padding: '40px 16px' }}>
                                <FiMessageSquare />
                                <h3>No messages yet</h3>
                                <p>Start chatting by contacting a seller from their listing.</p>
                            </div>
                        ) : (
                            conversations.map((conv) => {
                                const other = getOtherUser(conv);
                                return (
                                    <div
                                        key={conv.id}
                                        className={`conversation-item ${Number(conversationId) === conv.id ? 'active' : ''}`}
                                        onClick={() => selectConversation(conv)}
                                    >
                                        <div className="conv-avatar">
                                            {other.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="conv-info">
                                            <div className="conv-top">
                                                <h4>{other.name}</h4>
                                                {conv.last_message_time && (
                                                    <span className="conv-time">
                                                        {formatDistanceToNow(new Date(conv.last_message_time), { addSuffix: false })}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="conv-listing">{conv.listing_title}</p>
                                            <p className="conv-preview">{conv.last_message || 'No messages yet'}</p>
                                        </div>
                                        {conv.unread_count > 0 && (
                                            <span className="conv-unread">{conv.unread_count}</span>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className={`chat-main ${!conversationId ? 'hide-mobile' : ''}`}>
                    {conversationId ? (
                        <>
                            <div className="chat-header">
                                <button className="mobile-back-btn" onClick={() => navigate('/chat')}>
                                    <FiArrowLeft />
                                </button>
                                <div className="chat-header-info">
                                    <div className="chat-header-avatar">
                                        {getOtherUser(activeConv || conversations.find(c => c.id === Number(conversationId)))?.name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <div>
                                        <h3>{getOtherUser(activeConv || conversations.find(c => c.id === Number(conversationId)))?.name || 'User'}</h3>
                                        {typing && <p className="typing-indicator">{typing} is typing...</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="chat-messages">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`message ${msg.sender_id === user.id ? 'sent' : 'received'}`}
                                    >
                                        <div className="message-bubble">
                                            <p>{msg.content}</p>
                                            <span className="message-time">
                                                {format(new Date(msg.created_at), 'HH:mm')}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            <form className="chat-input-area" onSubmit={sendMessage}>
                                <input
                                    type="text"
                                    className="chat-input"
                                    placeholder="Type a message..."
                                    value={newMessage}
                                    onChange={handleTyping}
                                    autoFocus
                                />
                                <button type="submit" className="btn btn-primary send-btn" disabled={!newMessage.trim()}>
                                    <FiSend />
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="chat-empty">
                            <FiMessageSquare className="chat-empty-icon" />
                            <h3>Select a conversation</h3>
                            <p>Choose a conversation from the sidebar to start chatting</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
