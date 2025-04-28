import { useState } from "react";
import { Plus, Edit, X, BookOpen } from "lucide-react";
import toast from "react-hot-toast";

const SubjectsSection = ({ userData, isOwnProfile, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [subjects, setSubjects] = useState(userData.subjects || []);
    const [newSubject, setNewSubject] = useState("");

    const handleAddSubject = () => {
        if (newSubject && !subjects.includes(newSubject)) {
            setSubjects([...subjects, newSubject]);
            setNewSubject("");
        }
    };

    const handleRemoveSubject = (subject) => {
        setSubjects(subjects.filter(s => s !== subject));
    };

    const handleSave = () => {
        onSave({ subjects });
        setIsEditing(false);
        toast.success("Subjects updated");
    };

    return (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Teaching Subjects</h2>
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
                <div>
                    {subjects.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {subjects.map((subject, i) => (
                                <span
                                    key={i}
                                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm flex items-center"
                                >
                                    <BookOpen size={16} className="mr-1" />
                                    {subject}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500">No subjects added yet</p>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newSubject}
                            onChange={(e) => setNewSubject(e.target.value)}
                            className="flex-1 p-2 border rounded focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            placeholder="Add subject"
                        />
                        <button
                            onClick={handleAddSubject}
                            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
                        >
                            Add
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {subjects.map((subject, i) => (
                            <span
                                key={i}
                                className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm flex items-center"
                            >
                                {subject}
                                <button
                                    onClick={() => handleRemoveSubject(subject)}
                                    className="ml-1 text-gray-500 hover:text-red-500"
                                >
                                    <X size={14} />
                                </button>
                            </span>
                        ))}
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

export default SubjectsSection;