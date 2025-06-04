import { useState } from 'react';
import { Plus, Trash2, Upload, X, Edit2 } from 'lucide-react';
import { uploadToCloudinary, addCertification, updateCertification, deleteCertification } from '../api/userService';
import { toast } from 'react-hot-toast';

const CertificationsSection = ({ userData, isOwnProfile, onSave }) => {
    const [certifications, setCertifications] = useState(userData.certifications || []);
    const [editingCertification, setEditingCertification] = useState(null);
    const [newCertification, setNewCertification] = useState({
        title: '',
        issuer: '',
        date: '',
        credentialId: '',
        credentialUrl: '',
        imageUrl: ''
    });
    const [isUploading, setIsUploading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            setIsUploading(true);
            const imageUrl = await uploadToCloudinary(file);
            if (editingCertification) {
                setEditingCertification(prev => ({ ...prev, imageUrl }));
            } else {
                setNewCertification(prev => ({ ...prev, imageUrl }));
            }
            toast.success('Image uploaded successfully');
        } catch (error) {
            toast.error('Failed to upload image');
            console.error('Failed to upload image:', error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleAddCertification = async () => {
        if (!newCertification.title || !newCertification.issuer) {
            toast.error('Title and issuer are required');
            return;
        }

        try {
            const response = await addCertification(newCertification);
            setCertifications(response.data);
            setNewCertification({
                title: '',
                issuer: '',
                date: '',
                credentialId: '',
                credentialUrl: '',
                imageUrl: ''
            });
            setShowAddForm(false);
            toast.success('Certification added successfully');
        } catch (error) {
            toast.error('Failed to add certification');
            console.error('Failed to add certification:', error);
        }
    };

    const handleUpdateCertification = async () => {
        if (!editingCertification.title || !editingCertification.issuer) {
            toast.error('Title and issuer are required');
            return;
        }

        try {
            const response = await updateCertification(editingCertification._id, editingCertification);
            setCertifications(response.data);
            setEditingCertification(null);
            toast.success('Certification updated successfully');
        } catch (error) {
            toast.error('Failed to update certification');
            console.error('Failed to update certification:', error);
        }
    };

    const handleRemoveCertification = async (certificationId) => {
        const certification = certifications.find(cert => cert._id === certificationId);
        
        toast.custom((t) => (
            <div
                className={`${
                    t.visible ? 'animate-enter' : 'animate-leave'
                } max-w-md w-full bg-white dark:bg-dark-card shadow-lg rounded-lg pointer-events-auto flex flex-col ring-1 ring-black ring-opacity-5`}
            >
                <div className="p-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <Trash2 className="h-6 w-6 text-red-500" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">
                                Delete Certification
                            </p>
                            <p className="mt-1 text-sm text-gray-500 dark:text-dark-text-secondary">
                                Are you sure you want to delete "{certification?.title}"? This action cannot be undone.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex border-t border-gray-200 dark:border-dark-border">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="flex-1 px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            handleDeleteCertification(certificationId);
                        }}
                        className="flex-1 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 border-l border-gray-200 dark:border-dark-border"
                    >
                        Delete
                    </button>
                </div>
            </div>
        ), {
            duration: 5000,
            position: 'top-center',
        });
    };

    const handleDeleteCertification = async (certificationId) => {
        try {
            const response = await deleteCertification(certificationId);
            setCertifications(response.data);
            toast.success('Certification removed successfully');
        } catch (error) {
            toast.error('Failed to remove certification');
            console.error('Failed to remove certification:', error);
        }
    };

    const startEditing = (certification) => {
        setEditingCertification({ ...certification });
        setShowAddForm(false);
    };

    return (
        <div className="dark:bg-dark-card shadow rounded-lg p-3 sm:p-6 mb-4 sm:mb-6 border border-gray-200 dark:border-dark-border">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-dark-text-primary">Certifications</h2>
                {isOwnProfile && !showAddForm && !editingCertification && (
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="flex items-center text-primary hover:text-primary-dark transition duration-300 text-sm sm:text-base"
                    >
                        <Plus size={18} className="mr-1" />
                        Add Certification
                    </button>
                )}
            </div>

            {(showAddForm || editingCertification) && (
                <div className="bg-gray-50 dark:bg-dark-hover rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4 mb-4 sm:mb-6 border border-gray-200 dark:border-dark-border">
                    <div className="flex justify-between items-center">
                        <h3 className="font-medium text-gray-900 dark:text-dark-text-primary text-sm sm:text-base">
                            {editingCertification ? 'Edit Certification' : 'Add New Certification'}
                        </h3>
                        <button
                            onClick={() => {
                                setShowAddForm(false);
                                setEditingCertification(null);
                            }}
                            className="text-gray-500 hover:text-gray-700 dark:text-dark-text-muted dark:hover:text-dark-text-secondary"
                        >
                            <X className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
                                Title*
                            </label>
                            <input
                                type="text"
                                value={editingCertification?.title || newCertification.title}
                                onChange={(e) => editingCertification 
                                    ? setEditingCertification(prev => ({ ...prev, title: e.target.value }))
                                    : setNewCertification(prev => ({ ...prev, title: e.target.value }))
                                }
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-900 dark:text-dark-text-primary"
                                placeholder="e.g., AWS Certified Solutions Architect"
                            />
                        </div>
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
                                Issuing Organization*
                            </label>
                            <input
                                type="text"
                                value={editingCertification?.issuer || newCertification.issuer}
                                onChange={(e) => editingCertification
                                    ? setEditingCertification(prev => ({ ...prev, issuer: e.target.value }))
                                    : setNewCertification(prev => ({ ...prev, issuer: e.target.value }))
                                }
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-900 dark:text-dark-text-primary"
                                placeholder="e.g., Amazon Web Services"
                            />
                        </div>
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
                                Date
                            </label>
                            <input
                                type="date"
                                value={editingCertification?.date || newCertification.date}
                                onChange={(e) => editingCertification
                                    ? setEditingCertification(prev => ({ ...prev, date: e.target.value }))
                                    : setNewCertification(prev => ({ ...prev, date: e.target.value }))
                                }
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-900 dark:text-dark-text-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
                                Credential ID
                            </label>
                            <input
                                type="text"
                                value={editingCertification?.credentialId || newCertification.credentialId}
                                onChange={(e) => editingCertification
                                    ? setEditingCertification(prev => ({ ...prev, credentialId: e.target.value }))
                                    : setNewCertification(prev => ({ ...prev, credentialId: e.target.value }))
                                }
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-900 dark:text-dark-text-primary"
                                placeholder="e.g., AWS-123456"
                            />
                        </div>
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
                                Credential URL
                            </label>
                            <input
                                type="url"
                                value={editingCertification?.credentialUrl || newCertification.credentialUrl}
                                onChange={(e) => editingCertification
                                    ? setEditingCertification(prev => ({ ...prev, credentialUrl: e.target.value }))
                                    : setNewCertification(prev => ({ ...prev, credentialUrl: e.target.value }))
                                }
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-900 dark:text-dark-text-primary"
                                placeholder="https://..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
                                Certificate Image
                            </label>
                            <div className="flex items-center space-x-2">
                                <label className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors duration-200">
                                    <div className="flex items-center justify-center space-x-2">
                                        <Upload className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 dark:text-dark-text-muted" />
                                        <span className="text-xs sm:text-sm text-gray-600 dark:text-dark-text-secondary">
                                            {isUploading ? 'Uploading...' : 'Upload Image'}
                                        </span>
                                    </div>
                                    <input
                                        type="file"
                                        className="hidden"
                                        onChange={handleImageUpload}
                                        accept="image/*"
                                        disabled={isUploading}
                                    />
                                </label>
                                {(editingCertification?.imageUrl || newCertification.imageUrl) && (
                                    <button
                                        onClick={() => editingCertification
                                            ? setEditingCertification(prev => ({ ...prev, imageUrl: '' }))
                                            : setNewCertification(prev => ({ ...prev, imageUrl: '' }))
                                        }
                                        className="p-1.5 sm:p-2 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-500"
                                    >
                                        <X className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </button>
                                )}
                            </div>
                            {(editingCertification?.imageUrl || newCertification.imageUrl) && (
                                <div className="mt-2 sm:mt-4">
                                    <img src={editingCertification?.imageUrl || newCertification.imageUrl} alt="Certificate Preview" className="rounded-lg max-h-32 sm:max-h-48 object-contain mx-auto" />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2 sm:space-x-3">
                        <button
                            onClick={() => {
                                setShowAddForm(false);
                                setEditingCertification(null);
                            }}
                            className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-dark-text-secondary rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={editingCertification ? handleUpdateCertification : handleAddCertification}
                            className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors duration-200"
                        >
                            {editingCertification ? 'Save Changes' : 'Add Certification'}
                        </button>
                    </div>
                </div>
            )}

            {!showAddForm && !editingCertification && (certifications.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                    {certifications.map(cert => (
                        <div key={cert._id} className="p-3 sm:p-4 border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-hover flex items-start justify-between group">
                            <div className="flex items-start space-x-3 sm:space-x-4">
                                {cert.imageUrl && (
                                    <img src={cert.imageUrl} alt={cert.title} className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-md flex-shrink-0" />
                                )}
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-dark-text-primary text-sm sm:text-base">{cert.title}</h3>
                                    <p className="text-gray-600 dark:text-dark-text-secondary text-xs sm:text-sm">{cert.issuer}</p>
                                    {cert.date && (
                                        <p className="text-gray-500 dark:text-dark-text-muted text-xs mt-0.5 sm:mt-1">Date: {new Date(cert.date).toLocaleDateString()}</p>
                                    )}
                                    {cert.credentialId && (
                                        <p className="text-gray-500 dark:text-dark-text-muted text-xs">Credential ID: {cert.credentialId}</p>
                                    )}
                                    {cert.credentialUrl && (
                                        <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs block mt-0.5 sm:mt-1 dark:text-primary-light">
                                            Show Credential
                                        </a>
                                    )}
                                </div>
                            </div>
                            {isOwnProfile && (
                                <div className="flex space-x-1 sm:space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => startEditing(cert)}
                                        className="text-gray-500 hover:text-primary transition-colors dark:text-dark-text-muted dark:hover:text-primary-light p-1"
                                    >
                                        <Edit2 size={14} className="sm:h-4 sm:w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleRemoveCertification(cert._id)}
                                        className="text-gray-500 hover:text-red-500 transition-colors dark:text-dark-text-muted dark:hover:text-red-400 p-1"
                                    >
                                        <Trash2 size={14} className="sm:h-4 sm:w-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-500 dark:text-dark-text-muted text-center py-3 sm:py-4 text-sm">No certifications added yet</p>
            ))}
        </div>
    );
};

export default CertificationsSection; 