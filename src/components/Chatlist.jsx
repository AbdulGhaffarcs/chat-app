import React, { useState, useEffect, useMemo } from "react";
import { RiMore2Fill } from "react-icons/ri";
import SearchModal from "./SearchModal";
import { formatTimestamp } from "../utils/formatTimestamp";
import { auth, db, listenForChats } from "../firebase/firebase";
import { doc, onSnapshot } from "firebase/firestore";
const Chatlist = ({ setSelectedUser }) => {
    const [chats, setChats] = useState([]);
    const [user, setUser] = useState(null);

    useEffect(() => {
        // guard: don't try to build a doc ref when there's no authenticated user yet
        if (!auth?.currentUser?.uid) return;

        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            setUser(docSnap.data());
        });
        return () => unsubscribe();
    }, [auth?.currentUser?.uid]);

    console.log(user?.fullName);

    useEffect(() => {
        const unsubscribe = listenForChats(setChats);

        return () => {
            unsubscribe();
        };
    }, []);

    // safer: ensure chats is an array and handle missing timestamps
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
const defaultAvatar = "/assets/user.jpg"; // use public/ assets via absolute URL (served at /assets/...)
    return (
        <section className="relative hidden lg:flex flex-col item-start justify-start bg-white h-[100vh] w-[100%] md:w-[600px]  ">
            <header className="flex items-center justify-between w-[100%] lg:border-b border-b-1 border-[#898989b9] p-4 sticky md:static top-0 z-[100] border-r border-[#9090902c]">
                <main className="flex items-center gap-3">
                    <img src={user?.image || defaultAvatar} className="w-[44px] h-[44px] object-cover rounded-full" alt="" />
                    <span>
                        <h3 className="p-0 font-semibold text-[#2A3D39] md:text-[17px]">{user?.fullName || "ChatFrik user"}</h3>
                        <p className="p-0 font-light text-[#2A3D39] text-[15px]">@{user?.username || "chatfrik"}</p>
                    </span>
                </main>
                <button className="bg-[#D9F2ED] w-[35px] h-[35px] p-2 flex items-center justify-center rounded-lg">
                    <RiMore2Fill color="#01AA85" className="w-[28px] h-[28px]" />
                </button>
            </header>

            <div className="w-[100%] mt-[10px] px-5">
                <header className="flex items-center justify-between">
                    <h3 className="text-[16px]">Messages ({chats?.length || 0})</h3>
                    <SearchModal startChat={startChat} />
                </header>
            </div>

            <main className="flex flex-col items-start mt-[1.5rem] pb-3 custom-scrollbar w-[100%] h-[100%]">
                {sortedChats?.map((chat) => (
                    <button key={chat?.id} className="flex items-start justify-between w-[100%] border-b border-[#9090902c] px-5 pb-3 pt-3">
                        {chat?.users
                            ?.filter((u) => u?.email !== auth?.currentUser?.email)
                            ?.map((u) => (
                                <React.Fragment key={u?.uid || u?.email}>
                                    <div className="flex items-start gap-3" onClick={() => startChat(u)}>
                                        <img src={u?.image || defaultAvatar} className="h-[40px] w-[40px] rounded-full object-cover" alt="" />
                                        <span>
                                            <h2 className="p-0 font-semibold text-[#2A3d39] text-left text-[17px]">{u?.fullName || "ChatFrik User"}</h2>
                                            <p className="p-0 font-light text-[#2A3d39] text-left text-[14px]">{chat?.lastMessage || ""}</p>
                                        </span>
                                    </div>
                                    <p className="p-0 font-regular text-gray-400 text-left text-[11px]">
                                        {chat?.lastMessageTimestamp ? formatTimestamp(chat.lastMessageTimestamp) : ""}
                                    </p>
                                </React.Fragment>
                            ))}
                    </button>
                ))}
            </main>
        </section>
    );
};

export default Chatlist;