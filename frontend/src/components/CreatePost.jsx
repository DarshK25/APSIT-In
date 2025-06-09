import { useState } from "react";
import { toast } from "react-hot-toast";
import PropTypes from 'prop-types';
import { Image, X } from 'lucide-react';
import * as postService from '../api/postService';
import { useAuth } from '../context/AuthContext';

export const CreatePost = ({ onPost }) => {
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !image) return;

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('content', content);
      if (image) {
        formData.append('image', image);
      }

      const newPost = await postService.createPost(formData);
      // console.log('New post created:', newPost); // Debug log
      onPost(newPost);
      setContent('');
      setImage(null);
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
      }
      toast.success('Post created successfully');
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error(error.response?.data?.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      setImage(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const removeImage = () => {
    setImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  return (
    <div className="bg-white dark:bg-dark-card rounded-lg shadow-md p-4 mb-4">
      <form onSubmit={handleSubmit}>
        <div className="flex items-start space-x-4">
          <img
            src={user.profilePicture || '/default-avatar.png'}
            alt={user.username}
            className="w-10 h-10 rounded-full"
          />
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
            />
            {imagePreview && (
              <div className="mt-2 relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="flex justify-between items-center mt-2">
              <div>
                <label className="cursor-pointer text-gray-500 hover:text-blue-500">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <span className="flex items-center">
                    <Image className="w-4 h-4 mr-1" />
                    Add Photo
                  </span>
                </label>
              </div>
              <button
                type="submit"
                disabled={isSubmitting || (!content.trim() && !image)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {isSubmitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

CreatePost.propTypes = {
  onPost: PropTypes.func.isRequired,
};

export default CreatePost; 