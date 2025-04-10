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
        }
    };

    const handleDeleteProject = (index) => {
        const updatedProjects = projects.filter((_, i) => i !== index);
        setProjects(updatedProjects);
        onSave({ projects: updatedProjects });
    };

    return (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Projects</h2>
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
                <div key={index} className="mb-6 p-4 border rounded-lg group hover:border-primary transition-colors">
                    <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-xl text-gray-900">{project.title}</h3>
                        {isOwnProfile && (
                            <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleEditProject(index)}
                                    className="text-gray-500 hover:text-primary transition-colors"
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={() => handleDeleteProject(index)}
                                    className="text-gray-500 hover:text-red-500 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    <p className="text-gray-600 mt-2">{project.description}</p>

                    {/* Project Links */}
                    <div className="flex gap-4 mt-3">
                        {project.projectUrl && (
                            <a
                                href={project.projectUrl.startsWith('http') ? project.projectUrl : `https://${project.projectUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-primary hover:text-primary-dark"
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
                                className="flex items-center text-primary hover:text-primary-dark"
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
                                    className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-sm"
                                >
                                    {tech}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Project Timeline */}
                    <div className="flex items-center text-gray-500 mt-3">
                        <Calendar size={16} className="mr-1" />
                        <span>
                            {new Date(project.startDate).toLocaleDateString()} - 
                            {project.isOngoing ? ' Present' : new Date(project.endDate).toLocaleDateString()}
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
                </div>
            ))}

            {/* Edit/Add Form */}
            {isEditing && (
                <div className="mt-4 space-y-4">
                    <input
                        type="text"
                        placeholder="Project Title"
                        value={currentProject.title}
                        onChange={(e) => setCurrentProject({ ...currentProject, title: e.target.value })}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />

                    <textarea
                        placeholder="Project Description"
                        value={currentProject.description}
                        onChange={(e) => setCurrentProject({ ...currentProject, description: e.target.value })}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        rows={4}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder="Project URL"
                            value={currentProject.projectUrl}
                            onChange={(e) => setCurrentProject({ ...currentProject, projectUrl: e.target.value })}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />

                        <input
                            type="text"
                            placeholder="Repository URL"
                            value={currentProject.repoUrl}
                            onChange={(e) => setCurrentProject({ ...currentProject, repoUrl: e.target.value })}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>

                    {/* Technologies Input */}
                    <div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Add Technology"
                                value={newTechnology}
                                onChange={(e) => setNewTechnology(e.target.value)}
                                className="flex-1 p-2 border rounded focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                            <button
                                onClick={handleAddTechnology}
                                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
                            >
                                Add
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {currentProject.technologies.map((tech, index) => (
                                <span
                                    key={index}
                                    className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-sm flex items-center"
                                >
                                    {tech}
                                    <button
                                        onClick={() => handleRemoveTechnology(tech)}
                                        className="ml-1 text-gray-500 hover:text-red-500"
                                    >
                                        <X size={14} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Date Inputs */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <input
                                type="date"
                                value={currentProject.startDate}
                                onChange={(e) => setCurrentProject({ ...currentProject, startDate: e.target.value })}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <input
                                type="date"
                                value={currentProject.endDate}
                                onChange={(e) => setCurrentProject({ ...currentProject, endDate: e.target.value })}
                                disabled={currentProject.isOngoing}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gray-100"
                            />
                        </div>
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="isOngoing"
                            checked={currentProject.isOngoing}
                            onChange={(e) => setCurrentProject({ ...currentProject, isOngoing: e.target.checked })}
                            className="mr-2"
                        />
                        <label htmlFor="isOngoing">This is an ongoing project</label>
                    </div>

                    {/* Media Upload */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Images</label>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => handleMediaUpload(e, 'images')}
                                className="w-full"
                                disabled={uploadingMedia}
                            />
                            <div className="grid grid-cols-4 gap-2 mt-2">
                                {currentProject.images.map((img, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={img}
                                            alt={`Project image ${index + 1}`}
                                            className="w-full h-24 object-cover rounded"
                                        />
                                        <button
                                            onClick={() => handleRemoveMedia('images', index)}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Videos</label>
                            <input
                                type="file"
                                accept="video/*"
                                multiple
                                onChange={(e) => handleMediaUpload(e, 'videos')}
                                className="w-full"
                                disabled={uploadingMedia}
                            />
                            <div className="grid grid-cols-4 gap-2 mt-2">
                                {currentProject.videos.map((video, index) => (
                                    <div key={index} className="relative group">
                                        <video
                                            src={video}
                                            className="w-full h-24 object-cover rounded"
                                        />
                                        <button
                                            onClick={() => handleRemoveMedia('videos', index)}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex space-x-3">
                        <button
                            onClick={handleSaveProject}
                            disabled={uploadingMedia}
                            className="bg-primary text-white py-2 px-4 rounded hover:bg-primary-dark transition duration-300 disabled:opacity-50"
                        >
                            {editingIndex !== null ? 'Update Project' : 'Add Project'}
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

            {!isEditing && projects.length === 0 && (
                <p className="text-gray-500 text-center py-4">No projects added yet</p>
            )}
        </div>
    );
};

export default ProjectsSection; 