import { useState } from "react";
import { Plus, Edit, X, BookOpen, Briefcase } from "lucide-react";
import toast from "react-hot-toast";

const FacultyInfoSection = ({ userData, isOwnProfile, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [facultyInfo, setFacultyInfo] = useState({
        designation: userData.designation || "",
        researchInterests: userData.researchInterests || []
    });
    const [newInterest, setNewInterest] = useState("");

    const handleSave = () => {
        if (!facultyInfo.designation) {
            toast.error("Designation is required");
            return;
        }

        onSave({
            designation: facultyInfo.designation,
            researchInterests: facultyInfo.researchInterests
        });
        setIsEditing(false);
        toast.success("Faculty information updated");
    };

    const handleAddInterest = () => {
        if (newInterest && !facultyInfo.researchInterests.includes(newInterest)) {
            setFacultyInfo(prev => ({
                ...prev,
                researchInterests: [...prev.researchInterests, newInterest]
            }));
            setNewInterest("");
        }
    };

    const handleRemoveInterest = (interest) => {
        setFacultyInfo(prev => ({
            ...prev,
            researchInterests: prev.researchInterests.filter(i => i !== interest)
        }));
    };

    return (
        <div className="bg-white dark:bg-dark-card shadow rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text-primary">Faculty Information</h2>
                {isOwnProfile && !isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center text-primary hover:text-primary-dark transition duration-300"
                    >
                        <Edit size={20} className="mr-1" />
                        Edit
                    </button>
                )}
            </div>

            {!isEditing ? (
                <div className="space-y-4">
                    <div className="flex items-start">
                        <Briefcase className="text-gray-500 mr-3 mt-1" size={18} />
                        <div>
                            <h3 className="font-medium text-gray-900">Designation</h3>
                            <p className="text-gray-600">
                                {userData.designation || "Not specified"}
                            </p>
                        </div>
                    </div>

                    {userData.researchInterests?.length > 0 && (
                        <div className="flex items-start">
                            <BookOpen className="text-gray-500 mr-3 mt-1" size={18} />
                            <div>
                                <h3 className="font-medium text-gray-900">Research Interests</h3>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {userData.researchInterests.map((interest, i) => (
                                        <span
                                            key={i}
                                            className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-sm"
                                        >
                                            {interest}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Designation*
                        </label>
                        <input
                            type="text"
                            value={facultyInfo.designation}
                            onChange={(e) => setFacultyInfo({ ...facultyInfo, designation: e.target.value })}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            placeholder="Professor/Assistant Professor/etc."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Research Interests
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newInterest}
                                onChange={(e) => setNewInterest(e.target.value)}
                                className="flex-1 p-2 border rounded focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                placeholder="Add research interest"
                            />
                            <button
                                onClick={handleAddInterest}
                                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
                            >
                                Add
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {facultyInfo.researchInterests.map((interest, i) => (
                                <span
                                    key={i}
                                    className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-sm flex items-center"
                                >
                                    {interest}
                                    <button
                                        onClick={() => handleRemoveInterest(interest)}
                                        className="ml-1 text-gray-500 hover:text-red-500"
                                    >
                                        <X size={14} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="flex space-x-3 pt-2">
                        <button
                            onClick={handleSave}
                            className="bg-primary text-white py-2 px-4 rounded hover:bg-primary-dark transition duration-300"
                        >
                            Save
                        </button>
                        <button
                            onClick={() => setIsEditing(false)}
                            className="border border-gray-300 text-gray-600 py-2 px-4 rounded hover:bg-gray-50 transition duration-300"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacultyInfoSection;