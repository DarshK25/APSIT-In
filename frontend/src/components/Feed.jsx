import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as postService from '../api/postService';
import Post from './Post';
import { toast } from 'react-hot-toast';
import PropTypes from 'prop-types';
import { ImagePlus, Loader2, User, Users } from 'lucide-react';

export const Feed = () => {
    const { user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newPostContent, setNewPostContent] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            setIsLoading(true);
            const fetchedPosts = await postService.getAllPosts();
            const formattedPosts = fetchedPosts.map(post => ({
                ...post,
                author: typeof post.author === 'string' 
                    ? { _id: post.author, username: 'Loading...', profilePicture: null, name: 'User' }
                    : {
                        ...post.author,
                        // Ensure these fields exist
                        username: post.author?.username || 'Unknown',
                        name: post.author?.name || post.author?.username || 'Unknown User',
                        profilePicture: post.author?.profilePicture || null
                    }
            }));
            setPosts(formattedPosts);
        } catch (error) {
            console.error('Error fetching posts:', error);
            toast.error('Failed to fetch posts');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!newPostContent.trim() && !selectedImage) {
            toast.error('Please add some content or an image');
            return;
        }

        try {
            setIsSubmitting(true);
            const formData = new FormData();
            formData.append('content', newPostContent);
            if (selectedImage) {
                formData.append('image', selectedImage);
            }

            // Log the FormData contents for debugging
            for (let pair of formData.entries()) {
                console.log(pair[0] + ': ' + pair[1]);
            }

            const newPost = await postService.createPost(formData);
            console.log('New post response:', newPost); // Debug log

            // Ensure we have all the required data populated
            const formattedPost = {
                ...newPost,
                author: typeof newPost.author === 'string'
                    ? { _id: newPost.author, username: user.username, profilePicture: user.profilePicture }
                    : newPost.author,
                likes: newPost.likes || [],
                comments: newPost.comments || []
            };

            setPosts([formattedPost, ...posts]);
            setNewPostContent('');
            setSelectedImage(null);
            setImagePreview(null);
            toast.success('Post created successfully');
        } catch (error) {
            console.error('Error creating post:', error);
            toast.error(error.response?.data?.message || 'Failed to create post');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdatePost = async (updatedPost) => {
        const formattedPost = {
            ...updatedPost,
            author: typeof updatedPost.author === 'string'
                ? { _id: updatedPost.author, username: 'Loading...', profilePicture: null }
                : updatedPost.author
        };
        setPosts(posts.map(post => 
            post._id === formattedPost._id ? formattedPost : post
        ));
    };

    const handleDeletePost = async (postId) => {
        setPosts(posts.filter(post => post._id !== postId));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size should be less than 5MB');
                return;
            }

            // Log file details for debugging
            console.log('Selected file:', {
                name: file.name,
                type: file.type,
                size: file.size
            });

            setSelectedImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Create Post Form */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                        {user?.profilePicture ? (
                            <img
                                src={user.profilePicture}
                                alt={user.name || user.username}
                                className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.parentElement.innerHTML = `
                                        <div class="w-12 h-12 rounded-full bg-gray-900 ring-2 ring-gray-100 flex items-center justify-center">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                <circle cx="12" cy="7" r="4" />
                                            </svg>
                                        </div>`;
                                }}
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-900 ring-2 ring-gray-100 flex items-center justify-center">
                                <User className="w-6 h-6 text-white" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <textarea
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            placeholder="What's on your mind?"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 min-h-[100px] text-gray-700 placeholder-gray-500"
                        />
                        {imagePreview && (
                            <div className="mt-3 relative rounded-xl overflow-hidden group">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-full h-48 object-cover rounded-xl"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedImage(null);
                                        setImagePreview(null);
                                    }}
                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 shadow-lg"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        )}
                        <div className="flex items-center justify-between mt-4">
                            <label className="cursor-pointer">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                                <div className="flex items-center text-blue-600 hover:text-blue-700 transition-colors px-4 py-2 rounded-lg hover:bg-blue-50">
                                    <ImagePlus className="w-5 h-5 mr-2" />
                                    <span className="text-sm font-semibold">Add Photo</span>
                                </div>
                            </label>
                            <button
                                onClick={handleCreatePost}
                                disabled={isSubmitting || (!newPostContent.trim() && !selectedImage)}
                                className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
                                    isSubmitting || (!newPostContent.trim() && !selectedImage)
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5'
                                }`}
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center">
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        <span>Posting...</span>
                                    </div>
                                ) : (
                                    'Post'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Posts Feed */}
            <div className="space-y-6">
                {posts.length > 0 ? (
                    posts.map(post => (
                        <Post
                            key={post._id}
                            post={post}
                            onUpdate={handleUpdatePost}
                            onDelete={handleDeletePost}
                        />
                    ))
                ) : (
                    <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                        <div className="flex justify-center mb-4">
                            <Users className="w-16 h-16 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Posts Yet</h3>
                        <p className="text-gray-600 mb-4">
                            Be the first one to share something with your network or connect with more people to see their posts here.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

Feed.propTypes = {
    posts: PropTypes.arrayOf(
        PropTypes.shape({
            _id: PropTypes.string.isRequired,
            content: PropTypes.string.isRequired,
            author: PropTypes.shape({
                _id: PropTypes.string.isRequired,
                username: PropTypes.string.isRequired,
                profilePicture: PropTypes.string
            }).isRequired,
            likes: PropTypes.arrayOf(PropTypes.string).isRequired,
            comments: PropTypes.arrayOf(
                PropTypes.shape({
                    _id: PropTypes.string.isRequired,
                    content: PropTypes.string.isRequired,
                    author: PropTypes.shape({
                        _id: PropTypes.string.isRequired,
                        username: PropTypes.string.isRequired,
                        profilePicture: PropTypes.string
                    }).isRequired,
                    likes: PropTypes.arrayOf(PropTypes.string).isRequired
                })
            ).isRequired,
            createdAt: PropTypes.string.isRequired
        })
    ).isRequired
};

export default Feed;