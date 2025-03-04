import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Send, Search, MoreVertical, MessageSquare, Bell, Trash2, UserX } from 'lucide-react';

const MessagesPage = () => {
    const { socket, joinRoom, sendMessage } = useSocket();
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [connectedUsers, setConnectedUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showOptions, setShowOptions] = useState(false);
    const messagesEndRef = useRef(null);
    const optionsRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const fetchConnectedUsers = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/v1/connections', {
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                const data = await response.json();
                if (data) {
                    setConnectedUsers(data);
                }
            } catch (error) {
                console.error('Error fetching connected users:', error);
                toast.error('Failed to load connected users');
            } finally {
                setIsLoading(false);
            }
        };

        fetchConnectedUsers();
    }, []);

    useEffect(() => {
        if (socket && selectedUser) {
            socket.on('receiveMessage', (message) => {
                if (message.senderId === selectedUser._id || message.recieverId === selectedUser._id) {
                    setMessages(prev => [...prev, message]);
                    scrollToBottom();
                }
            });
        }

        return () => {
            if (socket) {
                socket.off('receiveMessage');
            }
        };
    }, [socket, selectedUser]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (optionsRef.current && !optionsRef.current.contains(event.target)) {
                setShowOptions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectUser = async (user) => {
        setSelectedUser(user);
        setMessages([]);
        
        try {
            const response = await fetch(`http://localhost:3000/api/v1/messages/${user._id}`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            if (data) {
                setMessages(data);
                scrollToBottom();
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
            toast.error('Failed to load messages');
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser) return;

        try {
            const response = await fetch(`http://localhost:3000/api/v1/messages/send/${selectedUser._id}`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: newMessage.trim() })
            });

            if (response.ok) {
                const data = await response.json();
                setMessages(prev => [...prev, data]);
                setNewMessage('');
                scrollToBottom();
            }
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
        }
    };

    const handleMuteChat = () => {
        toast.success('Chat muted successfully');
        setShowOptions(false);
    };

    const handleBlockUser = () => {
        toast.success('User blocked successfully');
        setShowOptions(false);
        // Add your block user logic here
    };

    const handleDeleteChat = () => {
        toast.success('Chat deleted successfully');
        setShowOptions(false);
        setMessages([]);
        // Add your delete chat logic here
    };

    const filteredUsers = connectedUsers.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-8rem)]">
                {/* Users List */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                    {/* Search Bar */}
                    <div className="p-4 border-b border-gray-200">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search connections..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-sm"
                            />
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        </div>
                    </div>

                    {/* Users List */}
                    <div className="overflow-y-auto flex-1">
                        {isLoading ? (
                            <div className="p-4 text-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                            </div>
                        ) : filteredUsers.length > 0 ? (
                            filteredUsers.map((connectedUser) => (
                                <div
                                    key={connectedUser._id}
                                    onClick={() => handleSelectUser(connectedUser)}
                                    className={`p-4 cursor-pointer hover:bg-gray-50 ${
                                        selectedUser?._id === connectedUser._id ? 'bg-blue-50' : ''
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <img
                                            src={connectedUser.profilePicture || '/default-avatar.png'}
                                            alt={connectedUser.name}
                                            className="h-10 w-10 rounded-full object-cover"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 text-sm truncate">
                                                {connectedUser.name}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {connectedUser.headline || 'No headline'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-gray-500 text-sm">
                                No connections found
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="md:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
                    {selectedUser ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <img
                                            src={selectedUser.profilePicture || '/default-avatar.png'}
                                            alt={selectedUser.name}
                                            className="h-10 w-10 rounded-full object-cover"
                                        />
                                        <div>
                                            <h3 className="font-medium text-gray-900">
                                                {selectedUser.name}
                                            </h3>
                                            <p className="text-xs text-gray-500">Active now</p>
                                        </div>
                                    </div>
                                    <div className="relative" ref={optionsRef}>
                                        <button 
                                            onClick={() => setShowOptions(!showOptions)}
                                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                        >
                                            <MoreVertical size={20} className="text-gray-600" />
                                        </button>
                                        
                                        {showOptions && (
                                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                                <button
                                                    onClick={handleMuteChat}
                                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                                >
                                                    <Bell size={16} />
                                                    <span>Mute messages</span>
                                                </button>
                                                <button
                                                    onClick={handleBlockUser}
                                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                                >
                                                    <UserX size={16} />
                                                    <span>Block user</span>
                                                </button>
                                                <button
                                                    onClick={handleDeleteChat}
                                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 flex items-center space-x-2"
                                                >
                                                    <Trash2 size={16} />
                                                    <span>Delete chat</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Messages List */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.map((message, index) => (
                                    <div
                                        key={index}
                                        className={`flex ${message.senderId === user._id ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[70%] rounded-lg p-3 ${
                                            message.senderId === user._id 
                                                ? 'bg-blue-500 text-white' 
                                                : 'bg-gray-100 text-gray-900'
                                        }`}>
                                            <p className="text-sm">{message.message}</p>
                                            <p className={`text-xs mt-1 ${message.senderId === user._id ? 'text-blue-100' : 'opacity-70'}`}>
                                                {new Date(message.createdAt).toLocaleTimeString()}
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
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    />
                                    <button
                                        type="submit"
                                        className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                    >
                                        <Send size={20} />
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-500">
                            <div className="text-center">
                                <MessageSquare size={48} className="mx-auto mb-4 text-gray-400" />
                                <p className="text-lg font-medium">Select a connection to start messaging</p>
                                <p className="text-sm mt-2">Choose from your existing connections or start a new conversation</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessagesPage; 