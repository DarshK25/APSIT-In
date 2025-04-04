import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as postService from '../api/postService';
import { Post } from './Post';
import { toast } from 'react-hot-toast';
import PropTypes from 'prop-types';
import { ImagePlus, Loader2 } from 'lucide-react';

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
                    ? { _id: post.author, username: 'Loading...', profilePicture: null }
                    : post.author
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

            const newPost = await postService.createPost(formData);
            const formattedPost = {
                ...newPost,
                author: typeof newPost.author === 'string'
                    ? { _id: newPost.author, username: user.username, profilePicture: user.profilePicture }
                    : newPost.author
            };
            setPosts([formattedPost, ...posts]);
            setNewPostContent('');
            setSelectedImage(null);
            setImagePreview(null);
            toast.success('Post created successfully');
        } catch (error) {
            console.error('Error creating post:', error);
            toast.error('Failed to create post');
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
        <div className="max-w-2xl mx-auto p-4">
            <form onSubmit={handleCreatePost} className="mb-6 bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-start space-x-3">
                    <img
                        src={user.profilePicture || '/default-avatar.png'}
                        alt={user.username}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100"
                    />
                    <div className="flex-1">
                        <textarea
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            placeholder="What's on your mind?"
                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors duration-200"
                            rows="3"
                        />
                        {imagePreview && (
                            <div className="mt-2 relative group">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-full h-48 object-cover rounded-lg"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedImage(null);
                                        setImagePreview(null);
                                    }}
                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        )}
                        <div className="flex justify-between items-center mt-3">
                            <label className="cursor-pointer">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                                <span className="flex items-center text-blue-500 hover:text-blue-600 transition-colors">
                                    <ImagePlus className="w-5 h-5 mr-1" />
                                    <span className="text-sm">Add Photo</span>
                                </span>
                            </label>
                            <button
                                type="submit"
                                disabled={isSubmitting || (!newPostContent.trim() && !selectedImage)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                                    isSubmitting || (!newPostContent.trim() && !selectedImage)
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-blue-500 text-white hover:bg-blue-600'
                                }`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                                        Posting...
                                    </>
                                ) : (
                                    'Post'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            <div className="space-y-6">
                {posts.map(post => (
                    <Post
                        key={post._id}
                        post={post}
                        onUpdate={handleUpdatePost}
                        onDelete={handleDeletePost}
                    />
                ))}
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