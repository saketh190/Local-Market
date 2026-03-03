import pool from '../db/connection.js';

export default function setupSocket(io) {
    // Store online users
    const onlineUsers = new Map();

    io.on('connection', (socket) => {
        console.log(`🔌 User connected: ${socket.id}`);

        // User comes online
        socket.on('user_online', (userId) => {
            onlineUsers.set(userId, socket.id);
            console.log(`👤 User ${userId} is online`);
        });

        // Join a conversation room
        socket.on('join_conversation', (conversationId) => {
            socket.join(`conversation_${conversationId}`);
            console.log(`📥 Socket ${socket.id} joined conversation_${conversationId}`);
        });

        // Leave a conversation room
        socket.on('leave_conversation', (conversationId) => {
            socket.leave(`conversation_${conversationId}`);
        });

        // Send a message
        socket.on('send_message', async (data) => {
            try {
                const { conversation_id, sender_id, content } = data;

                // Save message to database
                const [result] = await pool.query(
                    'INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)',
                    [conversation_id, sender_id, content]
                );

                // Update conversation timestamp
                await pool.query(
                    'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [conversation_id]
                );

                // Get the full message with sender info
                const [messages] = await pool.query(
                    `SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
           FROM messages m
           JOIN users u ON m.sender_id = u.id
           WHERE m.id = ?`,
                    [result.insertId]
                );

                const message = messages[0];

                // Emit to all users in the conversation room
                io.to(`conversation_${conversation_id}`).emit('new_message', message);

                // Also emit a notification to the other user
                const [conv] = await pool.query('SELECT * FROM conversations WHERE id = ?', [conversation_id]);
                if (conv.length > 0) {
                    const otherUserId = conv[0].buyer_id === sender_id ? conv[0].seller_id : conv[0].buyer_id;
                    const otherSocketId = onlineUsers.get(otherUserId);
                    if (otherSocketId) {
                        io.to(otherSocketId).emit('message_notification', {
                            conversation_id,
                            message,
                        });
                    }
                }
            } catch (err) {
                console.error('Send message error:', err);
                socket.emit('error', { message: 'Failed to send message.' });
            }
        });

        // Typing indicator
        socket.on('typing', (data) => {
            socket.to(`conversation_${data.conversation_id}`).emit('user_typing', {
                user_id: data.user_id,
                user_name: data.user_name,
            });
        });

        socket.on('stop_typing', (data) => {
            socket.to(`conversation_${data.conversation_id}`).emit('user_stop_typing', {
                user_id: data.user_id,
            });
        });

        // Disconnect
        socket.on('disconnect', () => {
            // Remove from online users
            for (const [userId, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    onlineUsers.delete(userId);
                    break;
                }
            }
            console.log(`🔌 User disconnected: ${socket.id}`);
        });
    });
}
