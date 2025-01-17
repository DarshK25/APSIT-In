import { useState, useEffect } from "react";
import { Briefcase, School, X } from "lucide-react";

// ProfileHeader Component
const ProfileHeader = ({ userData }) => {
	return (
		<div className="bg-white shadow rounded-lg p-6 mb-6">
			<h1 className="text-2xl font-bold">{userData.name}</h1>
			<p className="text-gray-600">{userData.email}</p>
		</div>
	);
};

// AboutSection Component
const AboutSection = ({ userData, isOwnProfile, onSave }) => {
	const [isEditing, setIsEditing] = useState(false);
	const [about, setAbout] = useState(userData.about || "");

	const handleSave = () => {
		setIsEditing(false);
		onSave({ about });
	};

	return (
		<div className="bg-white shadow rounded-lg p-6 mb-6">
			<h2 className="text-xl font-semibold mb-4">About</h2>
			{isOwnProfile && (
				<>
					{isEditing ? (
						<>
							<textarea
								value={about}
								onChange={(e) => setAbout(e.target.value)}
								className="w-full p-2 border rounded"
								rows="4"
							/>
							<button
								onClick={handleSave}
								className="mt-2 bg-primary text-white py-2 px-4 rounded hover:bg-primary-dark transition duration-300"
							>
								Save
							</button>
						</>
					) : (
						<>
							<p>{userData.about}</p>
							<button
								onClick={() => setIsEditing(true)}
								className="mt-2 text-primary hover:text-primary-dark transition duration-300"
							>
								Edit
							</button>
						</>
					)}
				</>
			)}
		</div>
	);
};

// EducationSection Component
const EducationSection = ({ userData, isOwnProfile, onSave }) => {
	const [isEditing, setIsEditing] = useState(false);
	const [educations, setEducations] = useState(userData.education || []);
	const [newEducation, setNewEducation] = useState({
		school: "",
		fieldOfStudy: "",
		startYear: "",
		endYear: "",
	});

	const handleAddEducation = () => {
		if (newEducation.school && newEducation.fieldOfStudy && newEducation.startYear) {
			setEducations([...educations, newEducation]);
			setNewEducation({
				school: "",
				fieldOfStudy: "",
				startYear: "",
				endYear: "",
			});
		}
	};

	const handleDeleteEducation = (id) => {
		setEducations(educations.filter((edu) => edu._id !== id));
	};

	const handleSave = () => {
		onSave({ education: educations });
		setIsEditing(false);
	};

	return (
		<div className="bg-white shadow rounded-lg p-6 mb-6">
			<h2 className="text-xl font-semibold mb-4">Education</h2>
			{educations.map((edu, index) => (
				<div key={index} className="mb-4 flex justify-between items-start">
					<div className="flex items-start">
						<School size={20} className="mr-2 mt-1" />
						<div>
							<h3 className="font-semibold">{edu.fieldOfStudy}</h3>
							<p className="text-gray-600">{edu.school}</p>
							<p className="text-gray-500 text-sm">
								{edu.startYear} - {edu.endYear || "Present"}
							</p>
						</div>
					</div>
					{isEditing && (
						<button onClick={() => handleDeleteEducation(edu._id)} className="text-red-500">
							<X size={20} />
						</button>
					)}
				</div>
			))}
			{isEditing && (
				<div className="mt-4">
					<input
						type="text"
						placeholder="School"
						value={newEducation.school}
						onChange={(e) => setNewEducation({ ...newEducation, school: e.target.value })}
						className="w-full p-2 border rounded mb-2"
					/>
					<input
						type="text"
						placeholder="Field of Study"
						value={newEducation.fieldOfStudy}
						onChange={(e) => setNewEducation({ ...newEducation, fieldOfStudy: e.target.value })}
						className="w-full p-2 border rounded mb-2"
					/>
					<input
						type="number"
						placeholder="Start Year"
						value={newEducation.startYear}
						onChange={(e) => setNewEducation({ ...newEducation, startYear: e.target.value })}
						className="w-full p-2 border rounded mb-2"
					/>
					<input
						type="number"
						placeholder="End Year"
						value={newEducation.endYear}
						onChange={(e) => setNewEducation({ ...newEducation, endYear: e.target.value })}
						className="w-full p-2 border rounded mb-2"
					/>
					<button
						onClick={handleAddEducation}
						className="bg-primary text-white py-2 px-4 rounded hover:bg-primary-dark transition duration-300"
					>
						Add Education
					</button>
				</div>
			)}

			{isOwnProfile && (
				<>
					{isEditing ? (
						<button
							onClick={handleSave}
							className="mt-4 bg-primary text-white py-2 px-4 rounded hover:bg-primary-dark transition duration-300"
						>
							Save Changes
						</button>
					) : (
						<button
							onClick={() => setIsEditing(true)}
							className="mt-4 text-primary hover:text-primary-dark transition duration-300"
						>
							Edit Education
						</button>
					)}
				</>
			)}
		</div>
	);
};

// ExperienceSection Component
const ExperienceSection = ({ userData, isOwnProfile, onSave }) => {
	const [isEditing, setIsEditing] = useState(false);
	const [experiences, setExperiences] = useState(userData.experience || []);
	const [newExperience, setNewExperience] = useState({
		title: "",
		company: "",
		startDate: "",
		endDate: "",
		description: "",
		currentlyWorking: false,
	});

	const handleAddExperience = () => {
		if (newExperience.title && newExperience.company && newExperience.startDate) {
			setExperiences([...experiences, newExperience]);

			setNewExperience({
				title: "",
				company: "",
				startDate: "",
				endDate: "",
				description: "",
				currentlyWorking: false,
			});
		}
	};

	const handleDeleteExperience = (id) => {
		setExperiences(experiences.filter((exp) => exp._id !== id));
	};

	const handleSave = () => {
		onSave({ experience: experiences });
		setIsEditing(false);
	};

	const handleCurrentlyWorkingChange = (e) => {
		setNewExperience({
			...newExperience,
			currentlyWorking: e.target.checked,
			endDate: e.target.checked ? "" : newExperience.endDate,
		});
	};

	return (
		<div className="bg-white shadow rounded-lg p-6 mb-6">
			<h2 className="text-xl font-semibold mb-4">Experience</h2>
			{experiences.map((exp, index) => (
				<div key={index} className="mb-4 flex justify-between items-start">
					<div className="flex items-start">
						<Briefcase size={20} className="mr-2 mt-1" />
						<div>
							<h3 className="font-semibold">{exp.title}</h3>
							<p className="text-gray-600">{exp.company}</p>
							<p className="text-gray-500 text-sm">
								{exp.startDate} - {exp.endDate ? exp.endDate : "Present"}
							</p>
							<p className="text-gray-700">{exp.description}</p>
						</div>
					</div>
					{isEditing && (
						<button onClick={() => handleDeleteExperience(exp._id)} className="text-red-500">
							<X size={20} />
						</button>
					)}
				</div>
			))}

			{isEditing && (
				<div className="mt-4">
					<input
						type="text"
						placeholder="Title"
						value={newExperience.title}
						onChange={(e) => setNewExperience({ ...newExperience, title: e.target.value })}
						className="w-full p-2 border rounded mb-2"
					/>
					<input
						type="text"
						placeholder="Company"
						value={newExperience.company}
						onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })}
						className="w-full p-2 border rounded mb-2"
					/>
					<input
						type="date"
						placeholder="Start Date"
						value={newExperience.startDate}
						onChange={(e) => setNewExperience({ ...newExperience, startDate: e.target.value })}
						className="w-full p-2 border rounded mb-2"
					/>
					<div className="flex items-center mb-2">
						<input
							type="checkbox"
							id="currentlyWorking"
							checked={newExperience.currentlyWorking}
							onChange={handleCurrentlyWorkingChange}
							className="mr-2"
						/>
						<label htmlFor="currentlyWorking">I currently work here</label>
					</div>
					{!newExperience.currentlyWorking && (
						<input
							type="date"
							placeholder="End Date"
							value={newExperience.endDate}
							onChange={(e) => setNewExperience({ ...newExperience, endDate: e.target.value })}
							className="w-full p-2 border rounded mb-2"
						/>
					)}
					<textarea
						placeholder="Description"
						value={newExperience.description}
						onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })}
						className="w-full p-2 border rounded mb-2"
					/>
					<button
						onClick={handleAddExperience}
						className="bg-primary text-white py-2 px-4 rounded hover:bg-primary-dark transition duration-300"
					>
						Add Experience
					</button>
				</div>
			)}

			{isOwnProfile && (
				<>
					{isEditing ? (
						<button
							onClick={handleSave}
							className="mt-4 bg-primary text-white py-2 px-4 rounded hover:bg-primary-dark transition duration-300"
						>
							Save Changes
						</button>
					) : (
						<button
							onClick={() => setIsEditing(true)}
							className="mt-4 text-primary hover:text-primary-dark transition duration-300"
						>
							Edit Experiences
						</button>
					)}
				</>
			)}
		</div>
	);
};

// SkillsSection Component
const SkillsSection = ({ userData, isOwnProfile, onSave }) => {
	const [isEditing, setIsEditing] = useState(false);
	const [skills, setSkills] = useState(userData.skills || []);
	const [newSkill, setNewSkill] = useState("");

	const handleAddSkill = () => {
		if (newSkill && !skills.includes(newSkill)) {
			setSkills([...skills, newSkill]);
			setNewSkill("");
		}
	};

	const handleDeleteSkill = (skill) => {
		setSkills(skills.filter((s) => s !== skill));
	};

	const handleSave = () => {
		onSave({ skills });
		setIsEditing(false);
	};

	return (
		<div className="bg-white shadow rounded-lg p-6">
			<h2 className="text-xl font-semibold mb-4">Skills</h2>
			<div className="flex flex-wrap">
				{skills.map((skill, index) => (
					<span
						key={index}
						className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm mr-2 mb-2 flex items-center"
					>
						{skill}
						{isEditing && (
							<button onClick={() => handleDeleteSkill(skill)} className="ml-2 text-red-500">
								<X size={14} />
							</button>
						)}
					</span>
				))}
			</div>

			{isEditing && (
				<div className="mt-4 flex">
					<input
						type="text"
						placeholder="New Skill"
						value={newSkill}
						onChange={(e) => setNewSkill(e.target.value)}
						className="flex-grow p-2 border rounded-l"
					/>
					<button
						onClick={handleAddSkill}
						className="bg-primary text-white py-2 px-4 rounded-r hover:bg-primary-dark transition duration-300"
					>
						Add Skill
					</button>
				</div>
			)}

			{isOwnProfile && (
				<>
					{isEditing ? (
						<button
							onClick={handleSave}
							className="mt-4 bg-primary text-white py-2 px-4 rounded hover:bg-primary-dark transition duration-300"
						>
							Save Changes
						</button>
					) : (
						<button
							onClick={() => setIsEditing(true)}
							className="mt-4 text-primary hover:text-primary-dark transition duration-300"
						>
							Edit Skills
						</button>
					)}
				</>
			)}
		</div>
	);
};

// Main Profile Page Component
const ProfilePage = () => {
	const [userData, setUserData] = useState({
		name: "John Doe",
		email: "john.doe@example.com",
		about: "I am a software engineer with a passion for web development.",
		education: [
			{
				_id: 1,
				school: "University of Example",
				fieldOfStudy: "Computer Science",
				startYear: "2015",
				endYear: "2019",
			},
		],
		experience: [
			{
				_id: 1,
				title: "Frontend Developer",
				company: "Example Corp",
				startDate: "2020-01-01",
				endDate: "2022-12-31",
				description: "Developed and maintained the front end of the company's main product.",
			},
		],
		skills: ["JavaScript", "React", "CSS"],
	});

	const handleSave = (updatedData) => {
		setUserData((prevData) => ({
			...prevData,
			...updatedData,
		}));
	};

	return (
		<div className="profile-page p-6">
			<ProfileHeader userData={userData} />
			<AboutSection userData={userData} isOwnProfile={true} onSave={handleSave} />
			<EducationSection userData={userData} isOwnProfile={true} onSave={handleSave} />
			<ExperienceSection userData={userData} isOwnProfile={true} onSave={handleSave} />
			<SkillsSection userData={userData} isOwnProfile={true} onSave={handleSave} />
		</div>
	);
};

export default ProfilePage;
