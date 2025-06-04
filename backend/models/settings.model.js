import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    emailNotifications: {
        type: Boolean,
        default: true
    },
    pushNotifications: {
        type: Boolean,
        default: true
    },
    profileVisibility: {
        type: String,
        enum: ['public', 'connections', 'private'],
        default: 'public'
    },
    allowTagging: {
        type: Boolean,
        default: true
    },
    showOnlineStatus: {
        type: Boolean,
        default: true
    },
    allowMessaging: {
        type: String,
        enum: ['everyone', 'connections', 'none'],
        default: 'everyone'
    },
    showActivity: {
        type: Boolean,
        default: true
    },
    showProfileInFeed: {
        type: Boolean,
        default: true
    },
    showEducationToNonConnections: {
        type: Boolean,
        default: true
    },
    showExperienceToNonConnections: {
        type: Boolean,
        default: true
    },
    showProjectsToNonConnections: {
        type: Boolean,
        default: true
    },
    showCertificationsToNonConnections: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings; 