import { X, Plus } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

const SkillsSection = ({ userData, isOwnProfile, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [skills, setSkills] = useState(userData.skills || []);
  const [newSkill, setNewSkill] = useState("");

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      if (skills.includes(newSkill.trim())) {
        toast.error("This skill is already added");
        return;
      }
      const updatedSkills = [...skills, newSkill.trim()];
      setSkills(updatedSkills);
      setNewSkill("");
      onSave({ skills: updatedSkills });
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    const updatedSkills = skills.filter(skill => skill !== skillToRemove);
    setSkills(updatedSkills);
    onSave({ skills: updatedSkills });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Skills</h2>
        {isOwnProfile && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center text-primary hover:text-primary-dark transition-colors"
          >
            <Plus size={20} className="mr-1" />
            Add Skill
          </button>
        )}
      </div>

      {isEditing && (
        <div className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add a skill (e.g., React.js, Python)"
              className="flex-1 p-2 border rounded focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <button
              onClick={handleAddSkill}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Done
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Press Enter to add a skill
          </p>
        </div>
      )}

      {skills.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, index) => (
            <span
              key={index}
              className="inline-flex items-center bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm"
            >
              {skill}
              {isOwnProfile && (
                <button
                  onClick={() => handleRemoveSkill(skill)}
                  className="ml-2 text-gray-500 hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 text-center py-4">
          No skills added yet
        </p>
      )}
    </div>
  );
};

export default SkillsSection;