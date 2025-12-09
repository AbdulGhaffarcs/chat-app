import React, { useState, useEffect, } from "react";
import { auth, db } from "../firebase/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { FaUserEdit, FaSave } from "react-icons/fa";

const AVATAR_GALLERY = [
    '/assets/user.jpg', 
    '/assets/male1.jpg',
    '/assets/male2.jpg',
    '/assets/male3.jpg',
    'assets/male4.jpg',
    '/assets/fm1.jpg',
    '/assets/fm2.jpg',
    '/assets/fm3.jpg',
    '/assets/fm4.jpg',
    '/assets/user1.png',
    

];


const Profile = ({ onBack }) => {
    const currentUser = auth.currentUser;
    
    const [userData, setUserData] = useState({ fullName: "", username: "", image: "" });
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!currentUser?.uid) return;

        const userDocRef = doc(db, "users", currentUser.uid);
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setUserData(docSnap.data());
            } else {
                setUserData({ fullName: currentUser.email.split('@')[0], username: currentUser.email.split('@')[0], image: AVATAR_GALLERY[0] });
            }
        });
        return () => unsubscribe();
    }, [currentUser.email, currentUser.uid]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUserData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!currentUser?.uid) return;
        setIsLoading(true);
        try {
            const userDocRef = doc(db, "users", currentUser.uid);
            await updateDoc(userDocRef, {
                fullName: userData.fullName,
                username: userData.username,
            });
            alert("Profile updated successfully!");
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile. See console for details.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleAvatarSelect = async (url) => {
        if (!currentUser?.uid) return;
        setIsLoading(true);
        
        try {
            const userDocRef = doc(db, "users", currentUser.uid);
            await updateDoc(userDocRef, {
                image: url,
            });
            setUserData(prev => ({ ...prev, image: url }));
            console.log("Avatar updated.");
        } catch (error) {
            console.error("Error setting avatar:", error);
            alert("Failed to set avatar.");
        } finally {
            setIsLoading(false);
        }
    };


    const AvatarGallery = () => (
        <div className="mt-4 max-h-48 overflow-y-auto custom-scrollbar p-2 border rounded-lg bg-gray-50">
            <h3 className="text-sm font-semibold mb-3 text-gray-700">Choose your Avatar:</h3>
            <div className="flex flex-wrap gap-3 justify-center">
                {AVATAR_GALLERY.map((url, index) => (
                    <button
                        key={index}
                        onClick={() => handleAvatarSelect(url)}
                        disabled={isLoading}
                        className={`w-14 h-14 rounded-full border-2 transition-all p-0.5 ${
                            userData.image === url ? 'border-4 border-[#01AA85]' : 'border-gray-300 hover:border-gray-500'
                        }`}
                    >
                        <img 
                            src={url} 
                            alt={`Avatar ${index + 1}`} 
                            className="w-full h-full object-cover rounded-full" 
                        />
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <section className="flex flex-col items-center p-8 h-screen w-full bg-[#e5f6f3] overflow-y-auto">
            <div className="w-full max-w-lg bg-white shadow-xl rounded-xl p-6">
                <header className="flex justify-between items-center mb-6 border-b pb-4">
                    <h1 className="text-3xl font-bold text-teal-700">User Profile</h1>
                    <div className="flex gap-2">
                        {isEditing && (
                            <button 
                                onClick={handleSave} 
                                className="bg-[#01AA85] text-white p-2 rounded-full hover:bg-[#019379] transition-colors"
                                disabled={isLoading}
                            >
                                <FaSave size={20} />
                            </button>
                        )}
                        <button 
                            onClick={() => setIsEditing(!isEditing)} 
                            className={`p-2 rounded-full transition-colors ${isEditing ? 'bg-gray-400 text-white hover:bg-gray-500' : 'bg-[#D9F2ED] text-[#01AA85] hover:bg-[#c8eae3]'}`}
                            disabled={isLoading}
                        >
                            <FaUserEdit size={20} />
                        </button>
                    </div>
                </header>
                
                <div className="flex flex-col items-center mb-8 relative">
                    <img 
                        src={userData.image || AVATAR_GALLERY[0]} 
                        alt="Profile Avatar" 
                        className="w-32 h-32 object-cover rounded-full border-4 border-[#01AA85]"
                    />
                    
                    {!isEditing && (
                        <p className="mt-2 text-sm text-gray-500">
                            Click edit to change avatar
                        </p>
                    )}
                </div>

                {isEditing && <AvatarGallery />}

                <div className="space-y-4 mt-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input
                            type="text"
                            name="fullName"
                            value={userData.fullName}
                            onChange={handleChange}
                            readOnly={!isEditing}
                            className={`w-full p-3 mt-1 border rounded-md ${isEditing ? 'bg-white border-green-400' : 'bg-gray-100 border-gray-300'}`}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Username</label>
                        <input
                            type="text"
                            name="username"
                            value={userData.username}
                            onChange={handleChange}
                            readOnly={!isEditing}
                            className={`w-full p-3 mt-1 border rounded-md ${isEditing ? 'bg-white border-green-400' : 'bg-gray-100 border-gray-300'}`}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            value={currentUser?.email || "N/A"}
                            readOnly={!isEditing}
                            className="w-full p-3 mt-1 border rounded-md bg-gray-100 border-gray-300"
                        />
                    </div>
                </div>

                <p className="mt-4 text-sm text-center text-gray-500">
                    {isEditing ? 
                    '*Name and Username changes are saved when you click the save icon. Avatar changes instantly.'
                    : '*Read-only mode. Click edit to make changes.'}
                </p>

                <button 
                    onClick={onBack} 
                    className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700"
                >
                    &larr; Back to Chat
                </button>
            </div>
        </section>
    );
};

export default Profile;