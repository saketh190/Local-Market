import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }) {
    const [socket, setSocket] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            const newSocket = io('http://localhost:5000', {
                transports: ['websocket', 'polling'],
            });

            newSocket.on('connect', () => {
                console.log('🔌 Socket connected');
                newSocket.emit('user_online', user.id);
            });

            newSocket.on('message_notification', (data) => {
                setUnreadCount((prev) => prev + 1);
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        }
    }, [user]);

    const resetUnread = () => setUnreadCount(0);

    return (
        <SocketContext.Provider value={{ socket, unreadCount, resetUnread }}>
            {children}
        </SocketContext.Provider>
    );
}
