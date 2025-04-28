import { useState } from "react";
import { Edit, Calendar, Users, MapPin, Info } from "lucide-react";
import toast from "react-hot-toast";

const ClubInfoSection = ({ userData, isOwnProfile, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [clubInfo, setClubInfo] = useState({
        clubType: userData.clubType || "",
        foundedDate: userData.foundedDate || "",
        meetingLocation: userData.meetingLocation || "",
        description: userData.about || ""
    });

    const handleSave = () => {
        if (!clubInfo.clubType) {
            toast.error("Club type is required");
            return;
        }

        onSave({
            clubType: clubInfo.clubType,
            foundedDate: clubInfo.foundedDate,
            meetingLocation: clubInfo.meetingLocation,
            about: clubInfo.description
        });
        setIsEditing(false);
        toast.success("Club information updated");
    };

    return (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Club Information</h2>
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
                        <Info className="text-gray-500 mr-3 mt-1" size={18} />
                        <div>
                            <h3 className="font-medium text-gray-900">Club Type</h3>
                            <p className="text-gray-600 capitalize">
                                {userData.clubType || "Not specified"}
                            </p>
                        </div>
                    </div>

                    {userData.foundedDate && (
                        <div className="flex items-start">
                            <Calendar className="text-gray-500 mr-3 mt-1" size={18} />
                            <div>
                                <h3 className="font-medium text-gray-900">Founded Date</h3>
                                <p className="text-gray-600">
                                    {new Date(userData.foundedDate).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    )}

                    {userData.meetingLocation && (
                        <div className="flex items-start">
                            <MapPin className="text-gray-500 mr-3 mt-1" size={18} />
                            <div>
                                <h3 className="font-medium text-gray-900">Meeting Location</h3>
                                <p className="text-gray-600">
                                    {userData.meetingLocation}
                                </p>
                            </div>
                        </div>
                    )}

                    {userData.about && (
                        <div className="flex items-start">
                            <Info className="text-gray-500 mr-3 mt-1" size={18} />
                            <div>
                                <h3 className="font-medium text-gray-900">Description</h3>
                                <p className="text-gray-600 whitespace-pre-line">
                                    {userData.about}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Club Type*
                        </label>
                        <select
                            value={clubInfo.clubType}
                            onChange={(e) => setClubInfo({ ...clubInfo, clubType: e.target.value })}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                            <option value="">Select club type</option>
                            <option value="technical">Technical</option>
                            <option value="cultural">Cultural</option>
                            <option value="sports">Sports</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Founded Date
                        </label>
                        <input
                            type="date"
                            value={clubInfo.foundedDate ? new Date(clubInfo.foundedDate).toISOString().split('T')[0] : ""}
                            onChange={(e) => setClubInfo({ ...clubInfo, foundedDate: e.target.value })}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Meeting Location
                        </label>
                        <input
                            type="text"
                            value={clubInfo.meetingLocation}
                            onChange={(e) => setClubInfo({ ...clubInfo, meetingLocation: e.target.value })}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            placeholder="Where does the club meet?"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            value={clubInfo.description}
                            onChange={(e) => setClubInfo({ ...clubInfo, description: e.target.value })}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            rows={4}
                            placeholder="Tell about your club's mission and activities"
                        />
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

export default ClubInfoSection;