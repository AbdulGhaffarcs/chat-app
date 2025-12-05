import React, { useState, useEffect, useMemo } from "react";
// UPDATED: Added RiArchiveLine for the context menu
import { RiMore2Fill, RiArchiveLine } from "react-icons/ri";
import SearchModal from "./SearchModal";
import { formatTimestamp } from "../utils/formatTimestamp";
// UPDATED: Imported archiveChat
import { auth, db, listenForChats, archiveChat } from "../firebase/firebase";
import { doc, onSnapshot } from "firebase/firestore";
// TEMP: Import mock data for fallback presentation
import mockChatData from "../data/chats";

const Chatlist = ({ setSelectedUser }) => {
    const [chats, setChats] = useState([]);
    const [user, setUser] = useState(null);
    // NEW STATE: For the context menu (right-click/long press)
    const [contextMenuChat, setContextMenuChat] = useState(null); 

    const currentUserId = auth?.currentUser?.uid; // Get current user ID

    // Live listener for the logged-in user's profile data
    useEffect(() => {
        if (!auth?.currentUser?.uid) return;

        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setUser(docSnap.data());
            } else {
                setUser({
                    fullName: auth.currentUser.email.split('@')[0],
                    username: auth.currentUser.email.split('@')[0],
                    image: '',
                });
            }
        });
        return () => unsubscribe();
    }, []);

    // Live listener for the user's chat list, with a mock fallback for presentation
    useEffect(() => {
        if (!auth?.currentUser?.uid) return;

        const unsubscribe = listenForChats((liveChats) => {
            const currentUser = auth.currentUser;

            let finalChats = [];

            if (liveChats.length > 0) {
                finalChats = liveChats;
            } else if (currentUser && mockChatData.length > 0) {
                // ... (Mock chat creation logic remains here) ...
                const mockChat = mockChatData[0];
                const userToReplaceEmail = "baxo@mailinator.com"; 
                const mockUser2 = mockChat.users.find(u => u.email !== userToReplaceEmail);

                if (mockUser2) {
                    const loggedInUserInChat = { 
                        email: currentUser.email,
                        fullName: user?.fullName || currentUser.email.split('@')[0],
                        uid: currentUser.uid,
                        image: user?.image || '/assets/user.jpg',
                        status: "online",
                        lastSeen: mockChat.lastMessageTimestamp,
                        username: user?.username || currentUser.email.split('@')[0],
                    };
                    
                    const presentationChat = {
                        ...mockChat,
                        id: `${currentUser.uid}-${mockUser2.uid}`, 
                        users: [
                            loggedInUserInChat,
                            mockUser2
                        ],
                    };
                    finalChats = [presentationChat];
                }
            } 
            
            // NEW FILTERING: Hide chats archived by the current user
            const unarchivedChats = finalChats.filter(chat => {
                const isArchivedByCurrentUser = chat.archivedBy && chat.archivedBy[currentUserId];
                return !isArchivedByCurrentUser;
            });

            setChats(unarchivedChats);
        });

        return () => {
            unsubscribe();
        };
    }, [auth?.currentUser?.uid, user]);

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
    
    // NEW LOGIC: Context Menu Handlers
    const handleContextMenuOpen = (e, chat) => {
        e.preventDefault(); // Prevent native browser context menu
        
        // Use coordinates to position the menu near the click
        const rect = e.currentTarget.getBoundingClientRect();
        setContextMenuChat({
            ...chat,
            x: rect.right, 
            y: rect.top,
        });
    };
    
    const handleContextMenuClose = () => {
        setContextMenuChat(null);
    };

    const handleArchive = async (chatId) => {
        if (!currentUserId) return;

        try {
            // Archive chat (set status to true)
            await archiveChat(chatId, currentUserId, true);
            handleContextMenuClose();
        } catch (error) {
            console.error("Failed to archive chat:", error);
            alert("Failed to archive chat.");
        }
    };

    const renderContextMenu = () => {
        if (!contextMenuChat || !currentUserId) return null;

        const { x, y, id, users } = contextMenuChat;
        const otherUser = users.find((u) => u?.uid !== currentUserId);

        return (
            <div className="fixed inset-0 z-[100]" onClick={handleContextMenuClose}>
                <div 
                    className="absolute bg-white rounded-xl shadow-2xl p-2 w-48"
                    style={{ 
                        left: `${x}px`,
                        top: `${y}px`,
                        transform: `translate(-100%, 0%)` // Position menu left of the click
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-2 border-b text-sm font-semibold text-gray-700">
                        Chat with {otherUser?.fullName}
                    </div>
                    
                    <ul className="py-1">
                        <li className="flex items-center p-2 hover:bg-gray-100 cursor-pointer text-gray-800" onClick={() => handleArchive(id)}>
                            <RiArchiveLine size={20} className="mr-3" /> Archive Chat
                        </li>
                        {/* You can add an "Unarchive" option here if you implement a separate view for archived chats */}
                    </ul>
                </div>
            </div>
        );
    };

    return (
        <section className="relative flex flex-col item-start justify-start bg-white h-screen w-full lg:max-w-md border-r border-[#9090902c]">
            {renderContextMenu()} 
            <header className="flex items-center justify-between w-[100%] lg:border-b border-b-1 border-[#898989b9] p-4 sticky md:static top-0 z-[100] border-r border-[#9090902c]">
                <main className="flex items-center gap-3">
                    <img src={user?.image || defaultAvatar} className="w-[44px] h-[44px] object-cover rounded-full" alt="" />
                    <span>
                        <h3 className="p-0 font-semibold text-[#2A3D39] md:text-[17px]">{user?.fullName || "ChatFrik user"}</h3>
                        <p className="p-0 font-light text-[#2A3D39] text-[15px]">@{user?.username || "chatfrik"}</p>
                    </span>
                </main>
                <button className="p-2 rounded-lg text-[#01AA85] hover:bg-gray-100">
                    <RiMore2Fill size={24} />
                </button>
            </header>

            <div className="w-[100%] mt-[10px] px-5">
                <header className="flex items-center justify-between">
                    <h3 className="text-[16px]">Messages ({safeChats?.length || 0})</h3>
                    <SearchModal startChat={startChat} />
                </header>
            </div>

            <main className="flex flex-col items-start mt-[1.5rem] pb-3 custom-scrollbar w-[100%] h-[100%]">
                {safeChats?.map((chat) => {
                    const currentUserEmail = auth?.currentUser?.email;
                    const otherUser = chat?.users?.find((u) => u?.email !== currentUserEmail);
                    if (!otherUser) return null; 

                    return (
                        <button key={chat?.id} 
                                // ADDED: Context menu trigger (right-click/long press)
                                onContextMenu={(e) => handleContextMenuOpen(e, chat)}
                                className="flex items-start justify-between w-[100%] border-b border-[#9090902c] px-5 pb-3 pt-3 transition-colors duration-150 hover:bg-[#f3f9f9]" 
                                onClick={() => setSelectedUser(otherUser)}>
                            <div className="flex items-start gap-3">
                                <img src={otherUser?.image || defaultAvatar} className="h-[40px] w-[40px] rounded-full object-cover" alt="" />
                                <span>
                                    <h2 className="p-0 font-semibold text-[#2A3d39] text-left text-[17px]">{otherUser?.fullName || "ChatFrik User"}</h2>
                                    <p className="p-0 font-light text-[#2A3d39] text-left text-[14px]">{chat?.lastMessage || ""}</p>
                                </span>
                            </div>
                            <p className="p-0 font-regular text-gray-400 text-left text-[11px]">
                                {/* Note: FormatTimestamp is still used, this doesn't show the archive icon */}
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