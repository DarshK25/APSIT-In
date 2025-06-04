import { Briefcase, X, Edit, Plus } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

const ExperienceSection = ({ userData, isOwnProfile, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [experiences, setExperiences] = useState(userData.experience || []);
  const [editingIndex, setEditingIndex] = useState(null);
  const [currentExperience, setCurrentExperience] = useState({
    title: "",
    company: "",
    startDate: "",
    endDate: "",
    description: "",
    currentlyWorking: false,
  });

  const handleEditExperience = (index) => {
    setEditingIndex(index);
    setCurrentExperience({
      ...experiences[index],
      currentlyWorking: !experiences[index].endDate
    });
    setIsEditing(true);
  };

  const handleAddNew = () => {
    setEditingIndex(null);
    setCurrentExperience({
      title: "",
      company: "",
      startDate: "",
      endDate: "",
      description: "",
      currentlyWorking: false,
    });
    setIsEditing(true);
  };

  const handleSaveExperience = () => {
    if (currentExperience.title && currentExperience.company && currentExperience.startDate) {
      const updatedExperiences = [...experiences];
      
      if (editingIndex !== null) {
        // Update existing experience
        updatedExperiences[editingIndex] = currentExperience;
      } else {
        // Add new experience
        updatedExperiences.push(currentExperience);
      }

      setExperiences(updatedExperiences);
      onSave({ experience: updatedExperiences });
      setIsEditing(false);
      setEditingIndex(null);
      setCurrentExperience({
        title: "",
        company: "",
        startDate: "",
        endDate: "",
        description: "",
        currentlyWorking: false,
      });
      toast.success(editingIndex !== null ? 'Experience updated successfully' : 'Experience added successfully');
    } else {
      toast.error('Title, company, and start date are required');
    }
  };

  const handleDeleteExperience = (index) => {
    const updatedExperiences = experiences.filter((_, i) => i !== index);
    setExperiences(updatedExperiences);
    onSave({ experience: updatedExperiences });
  };

  const handleCurrentlyWorkingChange = (e) => {
    setCurrentExperience({
      ...currentExperience,
      currentlyWorking: e.target.checked,
      endDate: e.target.checked ? "" : currentExperience.endDate,
    });
  };

  return (
    <div className="bg-white dark:bg-dark-card shadow rounded-lg p-6 mb-6 border border-gray-200 dark:border-dark-border">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text-primary">Experience</h2>
        {isOwnProfile && !isEditing && (
          <button
            onClick={handleAddNew}
            className="flex items-center text-primary hover:text-primary-dark transition duration-300"
          >
            <Plus size={20} className="mr-1" />
            Add Experience
          </button>
        )}
      </div>

      {/* List of Experience */}
      {!isEditing && experiences.map((exp, index) => (
        <div key={index} className="mb-4 flex justify-between items-start group">
          <div className="flex items-start">
            <Briefcase size={20} className="mr-2 mt-1 text-gray-600 dark:text-dark-text-secondary" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-dark-text-primary">{exp.title}</h3>
              <p className="text-gray-600 dark:text-dark-text-secondary">{exp.company}</p>
              <p className="text-gray-500 dark:text-dark-text-muted text-sm">
                {exp.startDate} - {exp.endDate || "Present"}
              </p>
              {exp.description && (
                <p className="text-gray-600 dark:text-dark-text-secondary mt-1">{exp.description}</p>
              )}
            </div>
          </div>
          {isOwnProfile && (
            <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleEditExperience(index)}
                className="text-gray-500 hover:text-primary transition-colors dark:text-dark-text-muted dark:hover:text-primary-light"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => handleDeleteExperience(index)}
                className="text-gray-500 hover:text-red-500 transition-colors dark:text-dark-text-muted dark:hover:text-red-400"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Edit/Add Form */}
      {isEditing && (
        <div className="mt-4 space-y-3">
          <input
            type="text"
            placeholder="Title"
            value={currentExperience.title}
            onChange={(e) => setCurrentExperience({ ...currentExperience, title: e.target.value })}
            className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-hover text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <input
            type="text"
            placeholder="Company"
            value={currentExperience.company}
            onChange={(e) => setCurrentExperience({ ...currentExperience, company: e.target.value })}
            className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-hover text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <input
            type="text"
            placeholder="Start Date"
            value={currentExperience.startDate}
            onChange={(e) => setCurrentExperience({ ...currentExperience, startDate: e.target.value })}
            className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-hover text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <input
            type="text"
            placeholder="End Date (or leave empty for present)"
            value={currentExperience.endDate}
            onChange={(e) => setCurrentExperience({ ...currentExperience, endDate: e.target.value })}
            className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-hover text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            disabled={currentExperience.currentlyWorking}
          />
           <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id="currentlyWorking"
              checked={currentExperience.currentlyWorking}
              onChange={handleCurrentlyWorkingChange}
              className="mr-2"
            />
            <label htmlFor="currentlyWorking" className="text-gray-700 dark:text-dark-text-secondary">Currently working here</label>
          </div>
          <textarea
            placeholder="Description"
            value={currentExperience.description}
            onChange={(e) => setCurrentExperience({ ...currentExperience, description: e.target.value })}
            className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-hover text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            rows="3"
          />
          <div className="flex space-x-3">
            <button
              onClick={handleSaveExperience}
              className="bg-primary text-white py-2 px-4 rounded hover:bg-primary-dark transition duration-300"
            >
              {editingIndex !== null ? 'Update Experience' : 'Add Experience'}
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditingIndex(null);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-dark-border text-gray-600 dark:text-dark-text-secondary rounded-lg hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!isEditing && experiences.length === 0 && (
        <p className="text-gray-500 dark:text-dark-text-muted text-center py-4">No experience added yet</p>
      )}
    </div>
  );
};

export default ExperienceSection;