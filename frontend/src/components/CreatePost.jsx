import { useState } from "react";
import { toast } from "react-hot-toast";
import PropTypes from 'prop-types';
import { Image, X } from 'lucide-react';

const CreatePost = ({ onPost }) => {
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const handlePost = async () => {
    if (!content.trim() && !image) {
      toast.error("Please add some content or an image");
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('content', content.trim());
      if (image) {
        formData.append('image', image);
      }
      await onPost(formData);
      setContent("");
      setImage(null);
      setImagePreview(null);
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error(error.message || "Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImage(file);
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
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-bold">Create Post</h2>
      </div>
      <textarea
        className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        placeholder="What's on your mind?"
        rows="3"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={isSubmitting}
        maxLength={1000}
      />
      {imagePreview && (
        <div className="relative mt-4">
          <img
            src={imagePreview}
            alt="Preview"
            className="w-full h-auto rounded-lg"
          />
          <button
            onClick={removeImage}
            className="absolute top-2 right-2 p-1 bg-gray-800 bg-opacity-50 rounded-full text-white hover:bg-opacity-75 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label
            htmlFor="post-image"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 cursor-pointer transition-colors"
          >
            <Image size={20} />
            <span>Add Image</span>
          </label>
          <input
            id="post-image"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
            disabled={isSubmitting}
          />
        </div>
        <button
          className={`px-6 py-2 rounded-lg bg-blue-500 text-white font-medium transition-colors ${
            isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"
          }`}
          onClick={handlePost}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Posting..." : "Post"}
        </button>
      </div>
      <div className="mt-2 text-sm text-gray-500">
        {content.length}/1000 characters
      </div>
    </div>
  );
};

CreatePost.propTypes = {
  onPost: PropTypes.func.isRequired,
};

export default CreatePost; 