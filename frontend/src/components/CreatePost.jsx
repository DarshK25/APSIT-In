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
      onPost(newPost);
      setContent('');
      setImage(null);
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
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
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
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
            <div className="flex justify-between items-center mt-2">
              <div>
                <label className="cursor-pointer text-gray-500 hover:text-blue-500">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <span>Add Photo</span>
                </label>
                {image && (
                  <span className="ml-2 text-sm text-gray-500">
                    {image.name}
                  </span>
                )}
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