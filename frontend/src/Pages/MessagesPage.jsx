import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Send, Search, MessageSquare, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import ChatOptions from '../components/ChatOptions';
import { getUnreadCounts } from '../api/userService';

const MessagesPage = () => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [filteredConversations, setFilteredConversations] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [showOptions, setShowOptions] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Fetch conversations with latest messages
    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const response = await axios.get('http://localhost:3000/api/v1/messages/conversations', {
                    withCredentials: true
                });
                
                if (response.data.success) {
                    // Sort conversations by latest message timestamp
                    const sortedConversations = response.data.data.sort((a, b) => {
                        return new Date(b.lastMessage?.createdAt || 0) - new Date(a.lastMessage?.createdAt || 0);
                    });
                    
                    setConversations(sortedConversations);
                    setFilteredConversations(sortedConversations);
                }
            } catch (error) {
                console.error('Failed to fetch conversations:', error);
                toast.error('Failed to load conversations');
            } finally {
                setLoading(false);
            }
        };

        fetchConversations();
        // Poll for new conversations every 10 seconds
        const interval = setInterval(fetchConversations, 10000);
        return () => clearInterval(interval);
    }, []);

    // Handle search
    useEffect(() => {
        const filtered = conversations.filter(conversation => {
            const searchLower = searchQuery.toLowerCase();
            const nameLower = (conversation.user?.name || '').toLowerCase();
            const usernameLower = (conversation.user?.username || '').toLowerCase();
            const headlineLower = (conversation.user?.headline || '').toLowerCase();
            
            return nameLower.includes(searchLower) || 
                   usernameLower.includes(searchLower) ||
                   headlineLower.includes(searchLower);
        });
        
        setFilteredConversations(filtered);
    }, [searchQuery, conversations]);

    // Fetch messages when user is selected
    useEffect(() => {
        const fetchMessages = async () => {
            if (!selectedUser) return;

            try {
                const response = await axios.get(
                    `http://localhost:3000/api/v1/messages/${selectedUser._id}`,
                    { withCredentials: true }
                );
                if (response.data.success) {
                    setMessages(response.data.data);
                    scrollToBottom();
                    
                    // Mark messages as read
                    await axios.post(
                        `http://localhost:3000/api/v1/messages/${selectedUser._id}/read`,
                        {},
                        { withCredentials: true }
                    );
                }
            } catch (error) {
                console.error('Failed to fetch messages:', error);
                toast.error('Failed to load messages');
            }
        };

        fetchMessages();
        // Poll for new messages every 5 seconds when in a conversation
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [selectedUser]);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser) return;

        try {
            const response = await axios.post(
                'http://localhost:3000/api/v1/messages/send',
                {
                    recipientId: selectedUser._id,
                    content: newMessage
                },
                { withCredentials: true }
            );

            if (response.data.success) {
                setMessages([...messages, response.data.data]);
                setNewMessage('');
                scrollToBottom();
                
                // Refresh unread counts after sending a message
                try {
                    const unreadCounts = await getUnreadCounts();
                    // Dispatch a custom event to update the navbar
                    window.dispatchEvent(new CustomEvent('unreadCountsUpdated', { detail: unreadCounts }));
                } catch (error) {
                    console.error('Failed to refresh unread counts:', error);
                }
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            toast.error('Failed to send message');
        }
    };

    const handleOptionsClose = () => {
        setShowOptions(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 max-w-8xl">
            <div className="flex h-[calc(100vh-8rem)] bg-white rounded-lg shadow-lg">
                {/* Conversations List */}
                <div className="w-1/3 border-r border-gray-200">
                    <div className="p-4 border-b border-gray-200">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search messages..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 border-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        </div>
                    </div>
                    <div className="overflow-y-auto h-[calc(100%-4rem)]">
                        {filteredConversations.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                                {searchQuery ? 'No conversations found' : 'No messages yet'}
                            </div>
                        ) : (
                            filteredConversations.map((conversation) => (
                                <div
                                    key={conversation.user._id}
                                    onClick={() => setSelectedUser(conversation.user)}
                                    className={`p-4 border-b border-gray-100 cursor-pointer ${
                                        selectedUser?._id === conversation.user._id 
                                            ? 'bg-blue-100' 
                                            : conversation.unreadCount > 0
                                                ? 'bg-gray-50'
                                                : 'hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="relative">
                                            {conversation.user.profilePicture ? (
                                                <img
                                                    src={conversation.user.profilePicture}
                                                    alt={conversation.user.name}
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                    <span className="text-gray-600 font-medium text-lg">
                                                        {conversation.user.name.charAt(0)}
                                                    </span>
                                                </div>
                                            )}
                                            {conversation.unreadCount > 0 && (
                                                <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center">
                                                    <span className="text-[11px] text-white font-bold">
                                                        {conversation.unreadCount}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h3 className={`${
                                                    conversation.unreadCount > 0
                                                        ? 'text-black font-bold' 
                                                        : 'text-gray-800 font-medium'
                                                }`}>
                                                    {conversation.user.name}
                                                </h3>
                                                <span className={`text-xs ${
                                                    conversation.unreadCount > 0
                                                        ? 'text-black font-semibold' 
                                                        : 'text-gray-500'
                                                }`}>
                                                    {conversation.lastMessage && format(new Date(conversation.lastMessage.createdAt), 'MMM d')}
                                                </span>
                                            </div>
                                            {conversation.lastMessage && (
                                                <p className={`text-sm truncate ${
                                                    conversation.unreadCount > 0
                                                        ? 'text-black font-semibold' 
                                                        : 'text-gray-500'
                                                }`}>
                                                    {conversation.lastMessage.content}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col">
                    {selectedUser ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        {selectedUser.profilePicture ? (
                                            <img
                                                src={selectedUser.profilePicture}
                                                alt={selectedUser.name}
                                                className="w-10 h-10 rounded-full"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                <span className="text-blue-600 font-medium">
                                                    {selectedUser.name.charAt(0)}
                                                </span>
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="font-medium">{selectedUser.name}</h3>
                                            <p className="text-sm text-gray-500">
                                                {selectedUser.headline || 'APSIT Student'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowOptions(!showOptions)}
                                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                        >
                                            <MoreVertical className="w-5 h-5 text-gray-600" />
                                        </button>
                                        {showOptions && (
                                            <ChatOptions
                                                selectedUser={selectedUser}
                                                onClose={handleOptionsClose}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4">
                                {messages.map((message) => (
                                    <div
                                        key={message._id}
                                        className={`flex mb-4 ${
                                            message.sender._id === user._id ? 'justify-end' : 'justify-start'
                                        }`}
                                    >
                                        <div
                                            className={`max-w-[70%] rounded-lg p-3 ${
                                                message.sender._id === user._id
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-gray-100'
                                            }`}
                                        >
                                            <p>{message.content}</p>
                                            <p
                                                className={`text-xs mt-1 ${
                                                    message.sender._id === user._id
                                                        ? 'text-blue-100'
                                                        : 'text-gray-500'
                                                }`}
                                            >
                                                {format(new Date(message.createdAt), 'HH:mm')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Send size={20} />
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500">
                            <div className="mb-2">
                                <MessageSquare size={48} className="mx-auto text-gray-400" />
                            </div>
                            <h2 className="text-xl font-medium mb-2">Select a conversation to start messaging</h2>
                            <p className="text-sm">Choose from your existing conversations or start a new conversation</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessagesPage; 