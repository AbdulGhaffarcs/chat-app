import React, { useEffect, useMemo, useRef, useState } from "react";
import { formatTimestamp } from "../utils/formatTimestamp";
import { RiSendPlaneFill } from "react-icons/ri";
import { auth, listenForMessages, sendMessage } from "../firebase/firebase";

const defaultAvatar = "/assets/user.jpg";

const Chatbox = ({ selectedUser }) => {
    const [messages, setMessages] = useState([]);
    const [messageText, sendMessageText] = useState("");
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef(null);

    const chatId = useMemo(() => {
        if (!auth?.currentUser?.uid || !selectedUser?.uid) return null;
        return auth.currentUser.uid < selectedUser.uid 
            ? `${auth.currentUser.uid}-${selectedUser.uid}` 
            : `${selectedUser.uid}-${auth.currentUser.uid}`;
    }, [selectedUser]);

    const user1 = auth?.currentUser;
    const user2 = selectedUser;
    const senderEmail = auth?.currentUser?.email;

    useEffect(() => {
        if (!chatId) return;
        
        const unsubscribe = listenForMessages(chatId, setMessages);
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [chatId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const sortedMessages = useMemo(() => {
        return [...messages].sort((a, b) => {
            const aTimestamp = a?.timestamp?.seconds || 0 + (a?.timestamp?.nanoseconds || 0) / 1e9;
            const bTimestamp = b?.timestamp?.seconds || 0 + (b?.timestamp?.nanoseconds || 0) / 1e9;
            return aTimestamp - bTimestamp;
        });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        
        if (!messageText.trim() || isSending || !chatId) return;
        
        setIsSending(true);
        
        try {
            await sendMessage(messageText, chatId, user1?.uid, user2?.uid);
            sendMessageText("");
        } catch (error) {
            console.error("Error sending message:", error);
            alert("Failed to send message");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <>
            {selectedUser ? (
                <section className="flex flex-col items-start justify-start h-screen w-[100%] background-image">
                    <header className="w-[100%] h-[82px] m:h-fit p-4 bg-white">
                        <main className="flex items-center gap-3">
                            <span>
                                <img 
                                    src={selectedUser?.image || defaultAvatar} 
                                    className="w-11 h-11 object-cover rounded-full" 
                                    alt={selectedUser?.fullName || "User"} 
                                />
                            </span>
                            <span>
                                <h3 className="font-semibold text-[#2A3D39] text-lg">
                                    {selectedUser?.fullName || "Chatfrik User"}
                                </h3>
                                <p className="font-light text-[#2A3D39] text-sm">
                                    @{selectedUser?.username || "chatfrik"}
                                </p>
                            </span>
                        </main>
                    </header>

                    <main className="custom-scrollbar relative h-[100vh] w-[100%] flex flex-col justify-between">
                        <section className="px-3 pt-5 pb-20 lg:pb-10">
                            <div ref={scrollRef} className="overflow-auto h-[80vh]">
                                {sortedMessages?.map((msg, index) => (
                                    <div key={index}>
                                        {msg?.sender === senderEmail ? (
                                            <div className="flex flex-col items-end w-full mb-4">
                                                <span className="flex gap-3 me-10 h-auto max-w-[70%]">
                                                    <div className="w-full">
                                                        <div className="flex items-center bg-white justify-center p-6 rounded-lg shadow-sm">
                                                            <h4 className="break-words">{msg.text}</h4>
                                                        </div>
                                                        <p className="text-gray-400 text-xs mt-3 text-right">
                                                            {formatTimestamp(msg?.timestamp)}
                                                        </p>
                                                    </div>
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-start w-full mb-4">
                                                <span className="flex gap-3 ms-10 max-w-[70%] h-auto">
                                                    <img 
                                                        src={selectedUser?.image || defaultAvatar} 
                                                        className="h-11 w-11 object-cover rounded-full" 
                                                        alt="User" 
                                                    />
                                                    <div className="w-full">
                                                        <div className="flex items-center bg-white justify-center p-6 rounded-lg shadow-sm">
                                                            <h4 className="break-words">{msg.text}</h4>
                                                        </div>
                                                        <p className="text-gray-400 text-xs mt-3">
                                                            {formatTimestamp(msg?.timestamp)}
                                                        </p>
                                                    </div>
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                        <div className="sticky lg:bottom-0 bottom-[60px] p-3 h-fit w-[100%]">
                            <form onSubmit={handleSendMessage} className="flex items-center bg-white h-[45px] w-[100%] px-2 rounded-lg relative shadow-lg">
                                <input 
                                    value={messageText} 
                                    onChange={(e) => sendMessageText(e.target.value)} 
                                    className="h-full text-[#2A3D39] outline-none text-[16px] pl-3 pr-[50px] rounded-lg w-[100%]" 
                                    type="text" 
                                    placeholder="Write your message..." 
                                    disabled={isSending}
                                />
                                <button 
                                    type="submit" 
                                    disabled={isSending || !messageText.trim()}
                                    className="flex items-center justify-center absolute right-3 p-2 rounded-full bg-[#D9f2ed] hover:bg-[#c8eae3] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <RiSendPlaneFill color="#01AA85" />
                                </button>
                            </form>
                        </div>
                    </main>
                </section>
            ) : (
                <section className="h-screen w-[100%] bg-[#e5f6f3]">
                    <div className="flex flex-col justify-center items-center h-[100vh]">
                        <img src="/assets/logo.png" alt="Logo" width={100} />
                        <h1 className="text-[30px] font-bold text-teal-700 mt-5">Welcome to Chatfrik</h1>
                        <p className="text-gray-500">Connect and chat with friends easily, securely, fast and free</p>
                    </div>
                </section>
            )}
        </>
    );
};

export default Chatbox;