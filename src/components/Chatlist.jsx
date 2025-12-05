import React, { useState, useEffect, useMemo } from "react";
// UPDATED: Imported RiArchiveLine, RiArrowLeftLine for back navigation in archived view
import { RiMore2Fill, RiArchiveLine, RiArrowLeftLine } from "react-icons/ri"; 
import SearchModal from "./SearchModal";
import { formatTimestamp } from "../utils/formatTimestamp";
// UPDATED: Imported archiveChat
import { auth, db, listenForChats, archiveChat } from "../firebase/firebase"; 
import { doc, onSnapshot } from "firebase/firestore";
// TEMP: Import mock data for fallback presentation
import mockChatData from "../data/chats";

const Chatlist = ({ setSelectedUser }) => {
    // UPDATED: Now stores all chats fetched from Firebase, before client-side filtering
    const [allChats, setAllChats] = useState([]); 
    const [user, setUser] = useState(null);
    const [contextMenuChat, setContextMenuChat] = useState(null); 
    // NEW STATE: Toggles the view between active chats and the archived list
    const [isViewingArchived, setIsViewingArchived] = useState(false); 

    const currentUserId = auth?.currentUser?.uid; 

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
    }, [auth?.currentUser?.uid]);

    // Live listener for the user's chat list
    useEffect(() => {
        if (!auth?.currentUser?.uid) return;

        const unsubscribe = listenForChats((liveChats) => {
            const currentUser = auth.currentUser;
            let finalChats = [];

            if (liveChats.length > 0) {
                finalChats = liveChats;
            } else if (currentUser && mockChatData.length > 0) {
                // Mock chat creation logic
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
            
            // Store all fetched chats for later filtering
            setAllChats(finalChats);
        });

        return () => {
            unsubscribe();
        };
    }, [auth?.currentUser?.uid, user]);


    // NEW COMPUTED VALUES: Filter chats into active and archived lists
    const [activeChats, archivedChats] = useMemo(() => {
        const active = [];
        const archived = [];

        if (!currentUserId) return [[], []];

        for (const chat of allChats) {
            const isArchived = chat.archivedBy && chat.archivedBy[currentUserId];
            if (isArchived) {
                archived.push(chat);
            } else {
                active.push(chat);
            }
        }
        return [active, archived];
    }, [allChats, currentUserId]);
    
    
    // Determine which list to display based on state
    const currentChatList = isViewingArchived ? archivedChats : activeChats;
    const currentChatCount = isViewingArchived ? archivedChats.length : activeChats.length;

    const sortedChats = useMemo(() => {
        return [...currentChatList].sort((a, b) => {
            const aTS = a?.lastMessageTimestamp
                ? a.lastMessageTimestamp.seconds + (a.lastMessageTimestamp.nanoseconds || 0) / 1e9
                : 0;
            const bTS = b?.lastMessageTimestamp
                ? b.lastMessageTimestamp.seconds + (b.lastMessageTimestamp.nanoseconds || 0) / 1e9
                : 0;
            return bTS - aTS;
        });
    }, [currentChatList]);

    const startChat = (user) => {
        setSelectedUser(user);
    };
    const defaultAvatar = "/assets/user.jpg";
    
    // Context Menu Handlers
    const handleContextMenuOpen = (e, chat) => {
        e.preventDefault(); 
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

    // UPDATED: Combined Archive/Unarchive logic
    const handleArchiveToggle = async (chatId, archiveStatus) => {
        if (!currentUserId) return;

        try {
            await archiveChat(chatId, currentUserId, archiveStatus);
            handleContextMenuClose();
            // Optional: Immediately deselect user if the current chat was archived
            if (setSelectedUser) setSelectedUser(null);
        } catch (error) {
            console.error(`Failed to ${archiveStatus ? 'archive' : 'unarchive'} chat:`, error);
            alert(`Failed to ${archiveStatus ? 'archive' : 'unarchive'} chat.`);
        }
    };

    const renderContextMenu = () => {
        if (!contextMenuChat || !currentUserId) return null;

        const { x, y, id, users } = contextMenuChat;
        const otherUser = users.find((u) => u?.uid !== currentUserId);
        
        // Determine the action based on the current view
        const isArchived = isViewingArchived || (contextMenuChat.archivedBy && contextMenuChat.archivedBy[currentUserId]);
        const actionText = isArchived ? 'Unarchive Chat' : 'Archive Chat';
        const actionIcon = isArchived ? <RiArchiveLine size={20} className="mr-3 transform rotate-180" /> : <RiArchiveLine size={20} className="mr-3" />;
        const archiveStatus = !isArchived; // New status is the opposite

        return (
            <div className="fixed inset-0 z-[100]" onClick={handleContextMenuClose}>
                <div 
                    className="absolute bg-white rounded-xl shadow-2xl p-2 w-48"
                    style={{ 
                        left: `${x}px`,
                        top: `${y}px`,
                        transform: `translate(-100%, 0%)` 
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-2 border-b text-sm font-semibold text-gray-700">
                        Chat with {otherUser?.fullName}
                    </div>
                    
                    <ul className="py-1">
                        <li className="flex items-center p-2 hover:bg-gray-100 cursor-pointer text-gray-800" onClick={() => handleArchiveToggle(id, archiveStatus)}>
                            {actionIcon} {actionText}
                        </li>
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
                    {/* NEW: Back button for archived view (Mobile/Desktop) */}
                    {isViewingArchived && (
                        <button onClick={() => setIsViewingArchived(false)} className="p-1 text-[#2A3D39] hover:text-[#01AA85] mr-2">
                             <RiArrowLeftLine size={24} />
                        </button>
                    )}
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
                    {/* UPDATED HEADER TEXT */}
                    <h3 className="text-[16px]">{isViewingArchived ? 'Archived Chats' : `Messages (${currentChatCount})`}</h3>
                    <SearchModal startChat={startChat} />
                </header>
            </div>

            <main className="flex flex-col items-start mt-[1.5rem] pb-3 custom-scrollbar w-[100%] h-[100%]">
                
                {/* NEW: ARCHIVE CHATS BUTTON (WhatsApp Style) - Visible only when viewing active chats */}
                {!isViewingArchived && archivedChats.length > 0 && (
                    <button 
                        onClick={() => setIsViewingArchived(true)} 
                        className="flex items-center gap-4 w-full border-b border-[#9090902c] px-5 pb-3 pt-3 transition-colors duration-150 hover:bg-[#f3f9f9] text-[#01AA85] font-semibold"
                    >
                        <RiArchiveLine size={24} />
                        <span className="flex-grow text-left">Archived</span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{archivedChats.length}</span>
                    </button>
                )}
                
                {sortedChats.length === 0 && (
                    <p className="text-center w-full text-gray-500 mt-10">
                        {isViewingArchived ? "Your archive is empty." : "No active chats found."}
                    </p>
                )}

                {/* Chat List Items */}
                {sortedChats?.map((chat) => {
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