import React, { useState, useEffect, useMemo } from "react";
import { RiMore2Fill } from "react-icons/ri";
import SearchModal from "./SearchModal";
import { formatTimestamp } from "../utils/formatTimestamp";
import { auth, db, listenForChats } from "../firebase/firebase";
import { doc, onSnapshot } from "firebase/firestore";
// TEMP: Import mock data for fallback presentation
import mockChatData from "../data/chats";

const Chatlist = ({ setSelectedUser }) => {
    const [chats, setChats] = useState([]);
    const [user, setUser] = useState(null);

    // Live listener for the logged-in user's profile data
    useEffect(() => {
        // guard: don't try to build a doc ref when there's no authenticated user yet
        if (!auth?.currentUser?.uid) return;

        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setUser(docSnap.data());
            } else {
                // Fallback for user data if the document is missing
                setUser({
                    fullName: auth.currentUser.email.split('@')[0],
                    username: auth.currentUser.email.split('@')[0],
                    image: '',
                });
            }
        });
        return () => unsubscribe();
    }, [auth?.currentUser?.uid]);

    // Live listener for the user's chat list, with a mock fallback for presentation
    useEffect(() => {
        if (!auth?.currentUser?.uid) return;

        const unsubscribe = listenForChats((liveChats) => {
            const currentUser = auth.currentUser;

            if (liveChats.length > 0) {
                // 1. PRIMARY: If live chats exist, use them.
                setChats(liveChats);
            } else if (currentUser && mockChatData.length > 0) {
                // 2. FALLBACK: If no live chats, inject one mock chat for presentation.
                
                // Get the first mock chat
                const mockChat = mockChatData[0];
                
                // Use the email "baxo@mailinator.com" as the target to replace, based on chat.js data
                const userToReplaceEmail = "baxo@mailinator.com"; 
                const mockUser2 = mockChat.users.find(u => u.email !== userToReplaceEmail);

                if (mockUser2) {
                    // Current Logged-in User details for the presentation chat
                    const loggedInUserInChat = { 
                        email: currentUser.email,
                        // FIX: Use 'user' state details, which are more complete, or fallback to email parts
                        fullName: user?.fullName || currentUser.email.split('@')[0],
                        uid: currentUser.uid,
                        image: user?.image || '/assets/user.jpg',
                        status: "online",
                        lastSeen: mockChat.lastMessageTimestamp,
                        username: user?.username || currentUser.email.split('@')[0],
                    };
                    
                    // Create a plausible mock chat
                    const presentationChat = {
                        ...mockChat,
                        // Ensure the chat ID is unique
                        id: `${currentUser.uid}-${mockUser2.uid}`, 
                        users: [
                            loggedInUserInChat,
                            mockUser2
                        ],
                    };
                    setChats([presentationChat]);
                } else {
                    setChats([]);
                }
            } else {
                // 3. FINAL FALLBACK: No live chats, no mock data.
                setChats([]);
            }
        });

        return () => {
            unsubscribe();
        };
    }, [auth?.currentUser?.uid, user]); // Added 'user' as dependency to ensure mock uses latest user profile

    const safeChats = Array.isArray(chats) ? chats : [];
    const sortedChats = useMemo(() => {
        return [...safeChats].sort((a, b) => {
            const aTS = a?.lastMessageTimestamp
                ? a.lastMessageTimestamp.seconds + (a.lastMessageTimestamp.nanoseconds || 0) / 1e9
                : 0;
            const bTS = b?.lastMessageTimestamp
                ? b.lastMessageTimestamp.seconds + (b.lastMessageTimestamp.nanoseconds || 0) / 1e9
                : 0;
            return bTS - aTS;
        });
    }, [chats]);

    const startChat = (user) => {
        setSelectedUser(user);
    };
    const defaultAvatar = "/assets/user.jpg";
    return (
        <section className="relative flex flex-col item-start justify-start bg-white h-screen w-full lg:max-w-md border-r border-[#9090902c]">
            <header className="flex items-center justify-between w-[100%] lg:border-b border-b-1 border-[#898989b9] p-4 sticky md:static top-0 z-[100] border-r border-[#9090902c]">
                <main className="flex items-center gap-3">
                    <img src={user?.image || defaultAvatar} className="w-[44px] h-[44px] object-cover rounded-full" alt="" />
                    <span>
                        <h3 className="p-0 font-semibold text-[#2A3D39] md:text-[17px]">{user?.fullName}</h3>
                        <p className="p-0 font-light text-[#2A3D39] text-[15px]">@{user?.username }</p>
                    </span>
                </main>
                <button className="bg-[#D9F2ED] w-[35px] h-[35px] p-2 flex items-center justify-center rounded-lg">
                    <RiMore2Fill color="#01AA85" className="w-[28px] h-[28px]" />
                </button>
            </header>

            <div className="w-[100%] mt-[10px] px-5">
                <header className="flex items-center justify-between">
                    <h3 className="text-[16px]">Messages ({safeChats?.length || 0})</h3>
                    <SearchModal startChat={startChat} />
                </header>
            </div>

            <main className="flex flex-col items-start mt-[1.5rem] pb-3 custom-scrollbar w-[100%] h-[100%]">
                {sortedChats?.map((chat) => {
                    // Filter out the current user to find the other chat participant
                    const currentUserEmail = auth?.currentUser?.email;
                    const otherUser = chat?.users?.find((u) => u?.email !== currentUserEmail);
                    if (!otherUser) return null; // Skip if no valid chat partner found

                    return (
                        <button key={chat?.id} className="flex items-start justify-between w-[100%] border-b border-[#9090902c] px-5 pb-3 pt-3" onClick={() => setSelectedUser(otherUser)}>
                            <div className="flex items-start gap-3">
                                <img src={otherUser?.image || defaultAvatar} className="h-[40px] w-[40px] rounded-full object-cover" alt="" />
                                <span>
                                    <h2 className="p-0 font-semibold text-[#2A3d39] text-left text-[17px]">{otherUser?.fullName}</h2>
                                    <p className="p-0 font-light text-[#2A3d39] text-left text-[14px]">{chat?.lastMessage || ""}</p>
                                </span>
                            </div>
                            <p className="p-0 font-regular text-gray-400 text-left text-[11px]">
                                {chat?.lastMessageTimestamp ? formatTimestamp(chat.lastMessageTimestamp) : ""}
                            </p>
                        </button>
                    );
                })}
            </main>
        </section>
    );
};

export default Chatlist;