import React, { useState, useEffect, useRef } from "react";
import { getAuth } from "firebase/auth";
import { doc, getFirestore, onSnapshot, updateDoc } from "firebase/firestore";
import { FaUserEdit, FaSave, FaUpload } from "react-icons/fa";
import { storage, ref, uploadBytes, getDownloadURL } from "../firebase/firebase";


const defaultAvatar = "/assets/user.jpg";

const Profile = ({ onBack }) => {
    const auth = getAuth();
    const db = getFirestore();
    const currentUser = auth.currentUser;
    const fileInputRef = useRef(null);
    
    const [userData, setUserData] = useState({ fullName: "", username: "", image: "" });
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch and listen to user profile data
    useEffect(() => {
        if (!currentUser?.uid) return;

        const userDocRef = doc(db, "users", currentUser.uid);
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setUserData(docSnap.data());
            } else {
                setUserData({ fullName: currentUser.email.split('@')[0], username: currentUser.email.split('@')[0], image: defaultAvatar });
            }
        });
        return () => unsubscribe();
    }, [currentUser, db]);

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
    
    // FIX: Function to trigger the hidden file input
    const handleImageUploadClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    // Function to handle file selection and upload
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file || !currentUser?.uid) return;

        setIsLoading(true);
        try {
            // 1. Define the storage location (e.g., users/USER_UID/profile)
            const imageRef = ref(storage, `users/${currentUser.uid}/profile`);

            // 2. Upload the file
            const snapshot = await uploadBytes(imageRef, file);
            
            // 3. Get the permanent public download URL
            const url = await getDownloadURL(snapshot.ref);

            // 4. Update the user's Firestore document with the new URL
            const userDocRef = doc(db, "users", currentUser.uid);
            await updateDoc(userDocRef, {
                image: url,
            });

            setUserData(prev => ({ ...prev, image: url }));
            alert("Profile picture uploaded and saved successfully!");

        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Failed to upload image. Please check Firebase Storage rules and settings.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="flex flex-col items-center p-8 h-screen w-full bg-[#e5f6f3] overflow-y-auto">
            <div className="w-full max-w-lg bg-white shadow-xl rounded-xl p-6">
                <header className="flex justify-between items-center mb-6 border-b pb-4">
                    <h1 className="text-3xl font-bold text-teal-700">User Profile</h1>
                    <div className="flex gap-2">
                        {/* Save Button (Visible only when editing) */}
                        {isEditing && (
                            <button 
                                onClick={handleSave} 
                                className="bg-[#01AA85] text-white p-2 rounded-full hover:bg-[#019379] transition-colors"
                                disabled={isLoading}
                            >
                                <FaSave size={20} />
                            </button>
                        )}
                        {/* Edit Toggle Button */}
                        <button 
                            onClick={() => setIsEditing(!isEditing)} 
                            className={`p-2 rounded-full transition-colors ${isEditing ? 'bg-gray-400 text-white hover:bg-gray-500' : 'bg-[#D9F2ED] text-[#01AA85] hover:bg-[#c8eae3]'}`}
                            disabled={isLoading}
                        >
                            <FaUserEdit size={20} />
                        </button>
                    </div>
                </header>
                
                {/* Hidden File Input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                />

                <div className="flex flex-col items-center mb-8 relative">
                    <img 
                        src={userData.image || defaultAvatar} 
                        alt="Profile Avatar" 
                        className="w-32 h-32 object-cover rounded-full border-4 border-[#01AA85]"
                    />
                    {/* Image Upload Button (Visible only when editing) */}
                    {isEditing && (
                        <button 
                            onClick={handleImageUploadClick} 
                            className="absolute bottom-0 right-1/2 translate-x-1/2 mt-2 bg-[#01AA85] text-white p-3 rounded-full hover:bg-[#019379] transition-colors shadow-lg"
                            disabled={isLoading}
                        >
                            <FaUpload size={18} />
                        </button>
                    )}
                </div>

                <div className="space-y-4">
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
                            readOnly
                            className="w-full p-3 mt-1 border rounded-md bg-gray-100 border-gray-300"
                        />
                    </div>
                </div>

                {isEditing && (
                    <p className="mt-4 text-sm text-center text-gray-500">
                        *Full Name and Username changes are saved when you click the save icon.
                    </p>
                )}

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