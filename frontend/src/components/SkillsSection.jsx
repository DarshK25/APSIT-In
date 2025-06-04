import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const SkillsSection = ({ userData, isOwnProfile, onSave }) => {
    const [skills, setSkills] = useState(userData.skills || []);
    const [newSkill, setNewSkill] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);

    const handleAddSkill = async () => {
        if (!newSkill.trim()) {
            toast.error('Please enter a skill');
            return;
        }

        if (skills.includes(newSkill.trim())) {
            toast.error('This skill already exists');
            return;
        }

        try {
            const updatedSkills = [...skills, newSkill.trim()];
            await onSave({ skills: updatedSkills });
            setSkills(updatedSkills);
            setNewSkill('');
            setShowAddForm(false);
            toast.success('Skill added successfully');
        } catch (error) {
            toast.error('Failed to add skill');
            console.error('Failed to add skill:', error);
        }
    };

    const handleRemoveSkill = async (skillToRemove) => {
        try {
            const updatedSkills = skills.filter(skill => skill !== skillToRemove);
            await onSave({ skills: updatedSkills });
            setSkills(updatedSkills);
            toast.success('Skill removed successfully');
        } catch (error) {
            toast.error('Failed to remove skill');
            console.error('Failed to remove skill:', error);
        }
    };

    return (
        <div className="bg-white dark:bg-dark-card shadow rounded-lg p-6 mb-6 border border-gray-200 dark:border-dark-border">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text-primary">Skills</h2>
                {isOwnProfile && !showAddForm && (
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="flex items-center text-primary hover:text-primary-dark transition duration-300"
                    >
                        <Plus size={20} className="mr-1" />
                        Add Skill
                    </button>
                )}
            </div>

            {showAddForm && (
                <div className="bg-gray-50 dark:bg-dark-hover rounded-lg p-4 space-y-4 mb-6 border border-gray-200 dark:border-dark-border">
                    <div className="flex justify-between items-center">
                        <h3 className="font-medium text-gray-900 dark:text-dark-text-primary">Add New Skill</h3>
                        <button
                            onClick={() => setShowAddForm(false)}
                            className="text-gray-500 hover:text-gray-700 dark:text-dark-text-muted dark:hover:text-dark-text-secondary"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <div>
                        <input
                            type="text"
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="Enter a skill"
                        />
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={() => setShowAddForm(false)}
                            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-dark-text-secondary rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddSkill}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors duration-200"
                        >
                            Add Skill
                        </button>
                    </div>
                </div>
            )}

            <div className="flex flex-wrap gap-2">
                {skills.length > 0 ? (
                    skills.map((skill, index) => (
                        <div
                            key={index}
                            className="group relative bg-gray-100 dark:bg-dark-hover px-3 py-1.5 rounded-full text-sm text-gray-700 dark:text-dark-text-secondary"
                        >
                            {skill}
                            {isOwnProfile && (
                                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleRemoveSkill(skill)}
                                        className="text-gray-500 hover:text-red-500 dark:text-dark-text-muted dark:hover:text-red-400 transition-colors"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 dark:text-dark-text-muted text-center py-4">No skills added yet</p>
                )}
            </div>
        </div>
    );
};

export default SkillsSection;