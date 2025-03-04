import { useState } from "react";
import { toast } from "react-hot-toast";
import PropTypes from 'prop-types';

const CreatePost = ({ onPost }) => {
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      toast.success("Post created successfully!");
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error(error?.response?.data?.message || "Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("Image size should be less than 5MB");
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }
      setImage(file);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <h2 className="text-xl font-bold mb-2">Create Post</h2>
      <textarea
        className="w-full border rounded p-2"
        placeholder="What's on your mind?"
        rows="3"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={isSubmitting}
        maxLength={1000}
      />
      <div className="mt-2">
        <label
          htmlFor="post-image"
          className="bg-gray-200 text-gray-800 py-1 px-4 rounded cursor-pointer inline-block mr-2"
        >
          Add Image
        </label>
        <input
          id="post-image"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
          disabled={isSubmitting}
        />
        <button
          className={`bg-blue-500 text-white py-2 px-4 rounded ${
            isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"
          }`}
          onClick={handlePost}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Posting..." : "Post"}
        </button>
      </div>
      {image && (
        <div className="mt-4">
          <img
            src={URL.createObjectURL(image)}
            alt="Selected"
            className="max-w-full h-auto rounded"
          />
          <button
            onClick={() => setImage(null)}
            className="mt-2 text-red-500 text-sm hover:text-red-600"
          >
            Remove image
          </button>
        </div>
      )}
    </div>
  );
};

CreatePost.propTypes = {
  onPost: PropTypes.func.isRequired,
};

export default CreatePost; 