import { useState } from "react";
import toast from "react-hot-toast";

const AboutSection = ({ userData, isOwnProfile, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [about, setAbout] = useState(userData.about || "");

  const handleSave = () => {
    onSave({ about });
    setIsEditing(false);
    toast.success('About section updated successfully');
  };

  return (
    <div className="bg-white dark:bg-dark-card shadow rounded-lg p-6 mb-6 border border-gray-200 dark:border-dark-border">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-dark-text-primary">About</h2>
      {isOwnProfile ? (
        <>
          {isEditing ? (
            <>
              <textarea
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-dark-border rounded bg-white dark:bg-dark-hover text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                rows="4"
              />
              <button
                onClick={handleSave}
                className="mt-2 bg-primary text-white py-2 px-4 rounded hover:bg-primary-dark transition duration-300"
              >
                Save
              </button>
            </>
          ) : (
            <>
              <p className="text-gray-600 dark:text-dark-text-secondary">{userData.about || "No information provided yet."}</p>
              <button
                onClick={() => setIsEditing(true)}
                className="mt-2 text-primary hover:text-primary-dark transition duration-300"
              >
                Edit
              </button>
            </>
          )}
        </>
      ) : (
        <p className="text-gray-600 dark:text-dark-text-secondary">{userData.about || "No information provided yet."}</p>
      )}
    </div>
  );
};

export default AboutSection;