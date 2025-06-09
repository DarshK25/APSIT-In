import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as postService from '../api/postService';
import Post from './Post';
import { toast } from 'react-hot-toast';
import PropTypes from 'prop-types';
import { ImagePlus, Loader2, User, Users, X } from 'lucide-react';

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
            // Get all posts, not just from connections
            const fetchedPosts = await postService.getAllPosts();
            const formattedPosts = fetchedPosts
                .filter(post => {
                    // Only show posts from users who have enabled feed visibility
                    return post.author?.settings?.showProfileInFeed !== false;
                })
                .map(post => ({
                    ...post,
                    author: typeof post.author === 'string' 
                        ? { _id: post.author, username: 'Loading...', profilePicture: null, name: 'User' }
                        : {
                            ...post.author,
                            username: post.author?.username || 'Unknown',
                            name: post.author?.name || post.author?.username || 'Unknown User',
                            profilePicture: post.author?.profilePicture || null
                        }
                }))
                // Sort by timestamp and engagement
                .sort((a, b) => {
                    const timeA = new Date(a.createdAt).getTime();
                    const timeB = new Date(b.createdAt).getTime();
                    const engagementA = (a.likes?.length || 0) + (a.comments?.length || 0);
                    const engagementB = (b.likes?.length || 0) + (b.comments?.length || 0);
                    
                    // Weight recent posts and engagement
                    return (engagementB * 0.3 + timeB * 0.7) - (engagementA * 0.3 + timeA * 0.7);
                });
            
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
            // for (let pair of formData.entries()) {
            //     console.log(pair[0] + ': ' + pair[1]);
            // }

            const newPost = await postService.createPost(formData);
            // console.log('New post response:', newPost); // Debug log

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
            // console.log('Selected file:', {
            //     name: file.name,
            //     type: file.type,
            //     size: file.size
            // });

            setSelectedImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64 bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-dark-border">
                <Loader2 className="w-8 h-8 text-blue-500 dark:text-blue-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-4">
            {/* Create Post Form */}
            <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 dark:border-dark-border">
                <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="flex-shrink-0">
                        {user?.profilePicture ? (
                            <img
                                src={user.profilePicture}
                                alt={user.name || user.username}
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-gray-100 dark:ring-dark-border"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.parentElement.innerHTML = `
                                        <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-900 dark:bg-dark-hover ring-2 ring-gray-100 dark:ring-dark-border flex items-center justify-center">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                <circle cx="12" cy="7" r="4" />
                                            </svg>
                                        </div>`;
                                }}
                            />
                        ) : (
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-900 dark:bg-dark-hover ring-2 ring-gray-100 dark:ring-dark-border flex items-center justify-center">
                                <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <textarea
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            placeholder="What's on your mind?"
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-200 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 min-h-[80px] sm:min-h-[100px] text-gray-700 dark:text-dark-text-primary placeholder-gray-500 dark:placeholder-dark-text-muted bg-white dark:bg-dark-hover"
                        />
                        {imagePreview && (
                            <div className="mt-3 relative rounded-xl overflow-hidden group">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-full h-32 sm:h-48 object-cover rounded-xl"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedImage(null);
                                        setImagePreview(null);
                                    }}
                                    className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-1.5 rounded-full hover:bg-opacity-75 transition-colors duration-200"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                        <div className="flex justify-between items-center mt-3 sm:mt-4">
                            <label className="cursor-pointer text-gray-600 dark:text-dark-text-secondary hover:text-primary dark:hover:text-primary-light transition-colors duration-200">
                                <ImagePlus size={18} />
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                            </label>
                            <button
                                type="submit"
                                onClick={handleCreatePost}
                                className="px-4 sm:px-6 py-1.5 sm:py-2 text-sm sm:text-base bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isSubmitting || (!newPostContent.trim() && !selectedImage)}
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Post'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Posts List */}
            {posts.length > 0 ? (
                posts.map(post => (
                    <Post 
                        key={post._id} 
                        post={post} 
                        onDelete={handleDeletePost}
                        onUpdate={handleUpdatePost}
                        user={user}
                    />
                ))
            ) : (
                <div className="bg-white dark:bg-dark-card shadow rounded-lg p-4 sm:p-6 text-center text-sm sm:text-base text-gray-500 dark:text-dark-text-muted border border-gray-200 dark:border-dark-border">
                    No posts yet. Share something!
                </div>
            )}
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