/**
 * Utility functions for event authorization
 */

/**
 * Check if a user has admin privileges
 * @param {Object} user - The user object
 * @param {Array} adminEmails - Array of admin email addresses
 * @returns {boolean}
 */
export const isAdmin = (user, adminEmails = []) => {
    if (!user) return false;
    return adminEmails.includes(user.email);
};

/**
 * Check if a user is the organizer of an event
 * @param {Object} user - The user object
 * @param {Object} event - The event object
 * @returns {boolean}
 */
export const isOrganizer = (user, event) => {
    if (!user || !event?.organizer) return false;
    return user._id === event.organizer._id;
};

/**
 * Check if a user is a member of the organizing club
 * @param {Object} user - The user object
 * @param {Object} event - The event object
 * @returns {boolean}
 */
export const isClubMember = (user, event) => {
    if (!user || !event?.organizer || event.organizer.accountType !== 'club') return false;
    return event.organizer.members?.some(member => member.userId === user._id);
};

/**
 * Check if a user has permission to manage an event
 * @param {Object} user - The user object
 * @param {Object} event - The event object
 * @param {Array} adminEmails - Array of admin email addresses
 * @returns {boolean}
 */
export const canManageEvent = (user, event, adminEmails = []) => {
    if (!user || !event) return false;

    return (
        isAdmin(user, adminEmails) ||
        isOrganizer(user, event) ||
        user.accountType === 'club' ||
        isClubMember(user, event)
    );
};

/**
 * Check if a user has permission to view event details
 * @param {Object} user - The user object
 * @param {Object} event - The event object
 * @returns {boolean}
 */
export const canViewEventDetails = (user, event) => {
    // Currently all events are public
    return true;
};

/**
 * Check if a user can register for an event
 * @param {Object} user - The user object
 * @param {Object} event - The event object
 * @returns {Object} - Contains boolean result and reason if false
 */
export const canRegisterForEvent = (user, event) => {
    if (!user) {
        return { allowed: false, reason: 'You must be logged in to register' };
    }

    if (!event) {
        return { allowed: false, reason: 'Event not found' };
    }

    const now = new Date();
    const registrationDeadline = event.registrationDeadline ? new Date(event.registrationDeadline) : null;

    if (registrationDeadline && now > registrationDeadline) {
        return { allowed: false, reason: 'Registration deadline has passed' };
    }

    if (event.maxAttendees && event.attendees && event.attendees.length >= event.maxAttendees) {
        return { allowed: false, reason: 'Event is full' };
    }

    if (event.attendees?.some(attendee => attendee._id === user._id)) {
        return { allowed: false, reason: 'Already registered' };
    }

    return { allowed: true };
}; 