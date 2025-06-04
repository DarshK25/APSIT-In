import { useState } from "react";
import { Plus, Edit, X, Link as LinkIcon, Github, Calendar, Users } from "lucide-react";
import { uploadToCloudinary } from "../api/userService";
import toast from "react-hot-toast";

const ProjectsSection = ({ userData, isOwnProfile, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [projects, setProjects] = useState(userData.projects || []);
    const [editingIndex, setEditingIndex] = useState(null);
    const [currentProject, setCurrentProject] = useState({
        title: "",
        description: "",
        projectUrl: "",
        repoUrl: "",
        technologies: [],
        images: [],
        videos: [],
        startDate: "",
        endDate: "",
        isOngoing: false,
        collaborators: []
    });
    const [newTechnology, setNewTechnology] = useState("");
    const [uploadingMedia, setUploadingMedia] = useState(false);

    const handleEditProject = (index) => {
        setEditingIndex(index);
        setCurrentProject({
            ...projects[index],
            startDate: projects[index].startDate ? new Date(projects[index].startDate).toISOString().split('T')[0] : "",
            endDate: projects[index].endDate ? new Date(projects[index].endDate).toISOString().split('T')[0] : "",
        });
        setIsEditing(true);
    };

    const handleAddNew = () => {
        setEditingIndex(null);
        setCurrentProject({
            title: "",
            description: "",
            projectUrl: "",
            repoUrl: "",
            technologies: [],
            images: [],
            videos: [],
            startDate: "",
            endDate: "",
            isOngoing: false,
            collaborators: []
        });
        setIsEditing(true);
    };

    const handleMediaUpload = async (e, type) => {
        const files = Array.from(e.target.files);
        setUploadingMedia(true);
        
        try {
            const uploadedUrls = await Promise.all(
                files.map(async (file) => {
                    const imageUrl = await uploadToCloudinary(file);
                    return imageUrl;
                })
            );

            setCurrentProject(prev => ({
                ...prev,
                [type]: [...prev[type], ...uploadedUrls]
            }));
            
            toast.success(`${type === 'images' ? 'Images' : 'Videos'} uploaded successfully`);
        } catch (error) {
            console.error(`Error uploading ${type}:`, error);
            toast.error(`Failed to upload ${type}`);
        } finally {
            setUploadingMedia(false);
        }
    };

    const handleRemoveMedia = (type, index) => {
        setCurrentProject(prev => ({
            ...prev,
            [type]: prev[type].filter((_, i) => i !== index)
        }));
    };

    const handleAddTechnology = () => {
        if (newTechnology && !currentProject.technologies.includes(newTechnology)) {
            setCurrentProject(prev => ({
                ...prev,
                technologies: [...prev.technologies, newTechnology]
            }));
            setNewTechnology("");
        }
    };

    const handleRemoveTechnology = (tech) => {
        setCurrentProject(prev => ({
            ...prev,
            technologies: prev.technologies.filter(t => t !== tech)
        }));
    };

    const handleSaveProject = () => {
        if (currentProject.title && currentProject.description) {
            const updatedProjects = [...projects];
            
            if (editingIndex !== null) {
                updatedProjects[editingIndex] = currentProject;
            } else {
                updatedProjects.push(currentProject);
            }

            setProjects(updatedProjects);
            onSave({ projects: updatedProjects });
            setIsEditing(false);
            setEditingIndex(null);
            setCurrentProject({
                title: "",
                description: "",
                projectUrl: "",
                repoUrl: "",
                technologies: [],
                images: [],
                videos: [],
                startDate: "",
                endDate: "",
                isOngoing: false,
                collaborators: []
            });
            toast.success(editingIndex !== null ? 'Project updated successfully' : 'Project added successfully');
        } else {
            toast.error('Title and description are required');
        }
    };

    const handleDeleteProject = (index) => {
        const updatedProjects = projects.filter((_, i) => i !== index);
        setProjects(updatedProjects);
        onSave({ projects: updatedProjects });
    };

    return (
        <div className="bg-white dark:bg-dark-card shadow rounded-lg p-6 mb-6 border border-gray-200 dark:border-dark-border">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text-primary">Projects</h2>
                {isOwnProfile && !isEditing && (
                    <button
                        onClick={handleAddNew}
                        className="flex items-center text-primary hover:text-primary-dark transition duration-300"
                    >
                        <Plus size={20} className="mr-1" />
                        Add Project
                    </button>
                )}
            </div>

            {/* List of Projects */}
            {!isEditing && projects.map((project, index) => (
                <div key={index} className="mb-6 p-4 border border-gray-200 dark:border-dark-border rounded-lg group hover:border-primary dark:hover:border-primary-light transition-colors">
                    <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-xl text-gray-900 dark:text-dark-text-primary">{project.title}</h3>
                        {isOwnProfile && (
                            <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleEditProject(index)}
                                    className="text-gray-500 hover:text-primary transition-colors dark:text-dark-text-muted dark:hover:text-primary-light"
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={() => handleDeleteProject(index)}
                                    className="text-gray-500 hover:text-red-500 transition-colors dark:text-dark-text-muted dark:hover:text-red-400"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    <p className="text-gray-600 dark:text-dark-text-secondary mt-2">{project.description}</p>

                    {/* Project Links */}
                    <div className="flex gap-4 mt-3">
                        {project.projectUrl && (
                            <a
                                href={project.projectUrl.startsWith('http') ? project.projectUrl : `https://${project.projectUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-primary hover:text-primary-dark dark:text-dark-primary dark:hover:text-primary-light"
                            >
                                <LinkIcon size={16} className="mr-1" />
                                Live Demo
                            </a>
                        )}
                        {project.repoUrl && (
                            <a
                                href={project.repoUrl.startsWith('http') ? project.repoUrl : `https://${project.repoUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-primary hover:text-primary-dark dark:text-dark-primary dark:hover:text-primary-light"
                            >
                                <Github size={16} className="mr-1" />
                                Repository
                            </a>
                        )}
                    </div>

                    {/* Technologies */}
                    {project.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {project.technologies.map((tech, i) => (
                                <span
                                    key={i}
                                    className="bg-gray-100 dark:bg-dark-hover text-gray-700 dark:text-dark-text-secondary px-2 py-1 rounded-full text-sm"
                                >
                                    {tech}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Project Timeline */}
                    <div className="flex items-center text-gray-500 dark:text-dark-text-muted mt-3">
                        <Calendar size={16} className="mr-1" />
                        <span>
                            {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'} - 
                            {project.isOngoing ? ' Present' : (project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A')}
                        </span>
                    </div>

                    {/* Media Gallery */}
                    {(project.images.length > 0 || project.videos.length > 0) && (
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                            {project.images.map((img, i) => (
                                <img
                                    key={i}
                                    src={img}
                                    alt={`${project.title} screenshot ${i + 1}`}
                                    className="rounded-lg w-full h-48 object-cover"
                                />
                            ))}
                            {project.videos.map((video, i) => (
                                <video
                                    key={i}
                                    src={video}
                                    controls
                                    className="rounded-lg w-full h-48 object-cover"
                                />
                            ))}
                        </div>
                    )}

                    {/* Collaborators */}
                    {project.collaborators && project.collaborators.length > 0 && (
                        <div className="mt-4">
                            <h4 className="text-md font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Collaborators:</h4>
                            <div className="flex flex-wrap gap-2">
                                {project.collaborators.map((collaborator, i) => (
                                    <span key={i} className="bg-gray-100 dark:bg-dark-hover text-gray-700 dark:text-dark-text-secondary px-2 py-1 rounded-full text-sm">
                                        {collaborator.name || collaborator.username || 'Unknown Collaborator'}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ))}

            {/* Edit/Add Form */}
            {isEditing && (
                <div className="mt-4 space-y-3">
                    <input
                        type="text"
                        placeholder="Project Title"
                        value={currentProject.title}
                        onChange={(e) => setCurrentProject({ ...currentProject, title: e.target.value })}
                        className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-hover text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <textarea
                        placeholder="Project Description"
                        value={currentProject.description}
                        onChange={(e) => setCurrentProject({ ...currentProject, description: e.target.value })}
                        className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-hover text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        rows="4"
                    />
                    <input
                        type="text"
                        placeholder="Project URL (Optional)"
                        value={currentProject.projectUrl}
                        onChange={(e) => setCurrentProject({ ...currentProject, projectUrl: e.target.value })}
                        className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-hover text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <input
                        type="text"
                        placeholder="Repository URL (Optional)"
                        value={currentProject.repoUrl}
                        onChange={(e) => setCurrentProject({ ...currentProject, repoUrl: e.target.value })}
                        className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-hover text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    {/* Technologies Input */}
                    <div className="border border-gray-300 dark:border-dark-border rounded-lg p-3 bg-white dark:bg-dark-hover">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Technologies Used:</h4>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {currentProject.technologies.map((tech, i) => (
                                <div key={i} className="flex items-center bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-dark-text-secondary px-3 py-1 rounded-full text-sm">
                                    <span>{tech}</span>
                                    <button
                                        onClick={() => handleRemoveTechnology(tech)}
                                        className="ml-2 text-gray-600 hover:text-gray-800 dark:text-dark-text-muted dark:hover:text-dark-text-secondary"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="flex">
                            <input
                                type="text"
                                placeholder="Add a technology"
                                value={newTechnology}
                                onChange={(e) => setNewTechnology(e.target.value)}
                                onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTechnology(); } }}
                                className="flex-1 p-1.5 border border-gray-300 dark:border-dark-border rounded-l-lg bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-primary/20"
                            />
                            <button
                                onClick={handleAddTechnology}
                                className="px-4 py-1.5 bg-primary text-white rounded-r-lg hover:bg-primary-dark transition-colors duration-200"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                    {/* Date Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Start Date:</label>
                            <input
                                type="date"
                                value={currentProject.startDate}
                                onChange={(e) => setCurrentProject({ ...currentProject, startDate: e.target.value })}
                                className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-hover text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">End Date:</label>
                            <input
                                type="date"
                                value={currentProject.endDate}
                                onChange={(e) => setCurrentProject({ ...currentProject, endDate: e.target.value })}
                                className="w-full p-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-hover text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                disabled={currentProject.isOngoing}
                            />
                        </div>
                    </div>
                     <div className="flex items-center mb-2">
                        <input
                            type="checkbox"
                            id="isOngoing"
                            checked={currentProject.isOngoing}
                            onChange={(e) => setCurrentProject({ ...currentProject, isOngoing: e.target.checked, endDate: e.target.checked ? "" : currentProject.endDate })}
                            className="mr-2"
                        />
                        <label htmlFor="isOngoing" className="text-gray-700 dark:text-dark-text-secondary">Ongoing Project</label>
                    </div>
                    {/* Media Upload */}
                     <div className="border border-gray-300 dark:border-dark-border rounded-lg p-3 bg-white dark:bg-dark-hover">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Media:</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                            {currentProject.images.map((img, i) => (
                                <div key={i} className="relative">
                                    <img src={img} alt="Project Media" className="rounded-lg w-full h-24 object-cover" />
                                    <button
                                        onClick={() => handleRemoveMedia('images', i)}
                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                            {currentProject.videos.map((video, i) => (
                                 <div key={i} className="relative">
                                    <video src={video} controls className="rounded-lg w-full h-24 object-cover" />
                                     <button
                                        onClick={() => handleRemoveMedia('videos', i)}
                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                                    >
                                        <X size={12} />
                                    </button>
                                 </div>
                            ))}
                        </div>
                         <label className="flex items-center justify-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-dark-text-secondary rounded-lg cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200">
                            {uploadingMedia ? (
                                <div className="flex items-center"><div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-700 dark:border-dark-text-secondary border-t-transparent mr-2"></div> Uploading...</div>
                            ) : (
                                <><Plus size={16} className="mr-2" /> Add Images or Videos</>
                            )}
                            <input
                                type="file"
                                multiple
                                onChange={(e) => handleMediaUpload(e, 'images')}
                                className="hidden"
                                accept="image/*,video/*"
                                disabled={uploadingMedia}
                            />
                        </label>
                    </div>

                    {/* Collaborators Input */}
                     <div className="border border-gray-300 dark:border-dark-border rounded-lg p-3 bg-white dark:bg-dark-hover">
                         <h4 className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Collaborators:</h4>
                         <p className="text-sm text-gray-500 dark:text-dark-text-muted mb-2">Enter usernames of collaborators</p>
                         {/* Add input for collaborators and display current ones */}
                          <input
                            type="text"
                            placeholder="Add collaborator username (Optional)"
                            // Add state and handlers for collaborators
                            className="w-full p-1.5 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-primary/20"
                          />
                           {/* Display existing collaborators similar to technologies */}
                     </div>

                    <div className="flex space-x-3">
                        <button
                            onClick={handleSaveProject}
                            className="bg-primary text-white py-2 px-4 rounded hover:bg-primary-dark transition duration-300"
                        >
                            {editingIndex !== null ? 'Update Project' : 'Add Project'}
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

            {!isEditing && projects.length === 0 && (
                <p className="text-gray-500 dark:text-dark-text-muted text-center py-4">No projects added yet</p>
            )}
        </div>
    );
};

export default ProjectsSection; 