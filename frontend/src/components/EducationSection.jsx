import { School, X, Edit, Plus } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

const EducationSection = ({ userData, isOwnProfile, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [educations, setEducations] = useState(userData.education || []);
  const [editingIndex, setEditingIndex] = useState(null);
  const [currentEducation, setCurrentEducation] = useState({
    school: "",
    fieldOfStudy: "",
    startYear: "",
    endYear: "",
  });

  const handleEditEducation = (index) => {
    setEditingIndex(index);
    setCurrentEducation({ ...educations[index] });
    setIsEditing(true);
  };

  const handleAddNew = () => {
    setEditingIndex(null);
    setCurrentEducation({
      school: "",
      fieldOfStudy: "",
      startYear: "",
      endYear: "",
    });
    setIsEditing(true);
  };

  const handleSaveEducation = () => {
    if (currentEducation.school && currentEducation.fieldOfStudy && currentEducation.startYear) {
      const updatedEducations = [...educations];
      
      if (editingIndex !== null) {
        // Update existing education
        updatedEducations[editingIndex] = currentEducation;
      } else {
        // Add new education
        updatedEducations.push(currentEducation);
      }

      setEducations(updatedEducations);
      onSave({ education: updatedEducations });
      setIsEditing(false);
      setEditingIndex(null);
      setCurrentEducation({
        school: "",
        fieldOfStudy: "",
        startYear: "",
        endYear: "",
      });
      toast.success(editingIndex !== null ? 'Education updated successfully' : 'Education added successfully');
    } else {
      toast.error('School, field of study, and start year are required');
    }
  };

  const handleDeleteEducation = (index) => {
    const updatedEducations = educations.filter((_, i) => i !== index);
    setEducations(updatedEducations);
    onSave({ education: updatedEducations });
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Education</h2>
        {isOwnProfile && !isEditing && (
          <button
            onClick={handleAddNew}
            className="flex items-center text-primary hover:text-primary-dark transition duration-300"
          >
            <Plus size={20} className="mr-1" />
            Add Education
          </button>
        )}
      </div>

      {/* List of Education */}
      {!isEditing && educations.map((edu, index) => (
        <div key={index} className="mb-4 flex justify-between items-start group">
          <div className="flex items-start">
            <School size={20} className="mr-2 mt-1 text-gray-600" />
            <div>
              <h3 className="font-semibold text-gray-900">{edu.fieldOfStudy}</h3>
              <p className="text-gray-600">{edu.school}</p>
              <p className="text-gray-500 text-sm">
                {edu.startYear} - {edu.endYear || "Present"}
              </p>
            </div>
          </div>
          {isOwnProfile && (
            <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleEditEducation(index)}
                className="text-gray-500 hover:text-primary transition-colors"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => handleDeleteEducation(index)}
                className="text-gray-500 hover:text-red-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Edit/Add Form */}
      {isEditing && (
        <div className="mt-4">
          <input
            type="text"
            placeholder="School"
            value={currentEducation.school}
            onChange={(e) => setCurrentEducation({ ...currentEducation, school: e.target.value })}
            className="w-full p-2 border rounded mb-2 focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <input
            type="text"
            placeholder="Field of Study"
            value={currentEducation.fieldOfStudy}
            onChange={(e) => setCurrentEducation({ ...currentEducation, fieldOfStudy: e.target.value })}
            className="w-full p-2 border rounded mb-2 focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <input
            type="number"
            placeholder="Start Year"
            value={currentEducation.startYear}
            onChange={(e) => setCurrentEducation({ ...currentEducation, startYear: e.target.value })}
            className="w-full p-2 border rounded mb-2 focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <input
            type="number"
            placeholder="End Year (or expected)"
            value={currentEducation.endYear}
            onChange={(e) => setCurrentEducation({ ...currentEducation, endYear: e.target.value })}
            className="w-full p-2 border rounded mb-2 focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <div className="flex space-x-3">
            <button
              onClick={handleSaveEducation}
              className="bg-primary text-white py-2 px-4 rounded hover:bg-primary-dark transition duration-300"
            >
              {editingIndex !== null ? 'Update Education' : 'Add Education'}
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditingIndex(null);
              }}
              className="border border-gray-300 text-gray-600 py-2 px-4 rounded hover:bg-gray-50 transition duration-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!isEditing && educations.length === 0 && (
        <p className="text-gray-500 text-center py-4">No education added yet</p>
      )}
    </div>
  );
};

export default EducationSection;