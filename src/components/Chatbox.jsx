import React, { useEffect, useMemo, useRef, useState } from "react";
import { formatTimestamp } from "../utils/formatTimestamp";
// ADDED: Icon for attachments
import { RiSendPlaneFill, RiAttachmentLine, RiCloseLine } from "react-icons/ri";
import { FaFileAlt } from "react-icons/fa";
// MODIFIED: Use new upload function
import { auth, listenForMessages, sendMessage, uploadChatAttachment } from "../firebase/firebase";
import logo from "/assets/logo.png";


const defaultAvatar = "/assets/user.jpg";

const Chatbox = ({ selectedUser }) => {
    const [messages, setMessages] = useState([]);
    const [messageText, sendMessageText] = useState("");
    // NEW: State for attachment management
    const [attachmentFile, setAttachmentFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);
    const scrollRef = useRef(null);

    const chatId = auth?.currentUser?.uid < selectedUser?.uid ? `${auth?.currentUser?.uid}-${selectedUser?.uid}` : `${selectedUser?.uid}-${auth?.currentUser?.uid}`;
    const user1 = auth?.currentUser;
    const user2 = selectedUser;
    const senderEmail = auth?.currentUser?.email;

    useEffect(() => {
        listenForMessages(chatId, setMessages);
    }, [chatId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const sortedMessages = useMemo(() => {
        return [...messages].sort((a, b) => {
            const aTimestamp = a?.timestamp?.seconds + a?.timestamp?.nanoseconds / 1e9;
            const bTimestamp = b?.timestamp?.seconds + b?.timestamp?.nanoseconds / 1e9;

            return aTimestamp - bTimestamp;
        });
    }, [messages]);
    
    // NEW: Handlers for file selection
    const handleAttachmentClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setAttachmentFile(e.target.files[0]);
        }
    };

    const handleRemoveAttachment = () => {
        setAttachmentFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = null;
        }
    };


    const handleSendMessage = async (e) => {
        e.preventDefault();
        
        // Ensure either text or an attachment is present
        if (!messageText.trim() && !attachmentFile) return;
        if (isUploading) return;
        
        setIsUploading(true);
        let attachmentData = {};

        try {
            if (attachmentFile) {
                // 1. Upload attachment to Firebase Storage
                attachmentData = await uploadChatAttachment(attachmentFile, chatId);
            }
            
            // 2. Send message payload
            await sendMessage(
                messageText, 
                chatId, 
                user1?.uid, 
                user2?.uid, 
                attachmentData // Pass the URL/Type if available
            );
            
            // 3. Reset UI state
            sendMessageText("");
            handleRemoveAttachment();
        } catch (error) {
            console.error("Failed to send message/upload attachment:", error);
            alert("Failed to send message. Check console for details.");
        } finally {
            setIsUploading(false);
        }
    };

    // NEW COMPONENT: Renders attachment preview in the message bubble
    const renderMessageContent = (msg) => {
        if (msg.fileURL) {
            if (msg.fileType === 'image') {
                // Renders image attachment
                return (
                    <div className="flex flex-col gap-2">
                        <a href={msg.fileURL} target="_blank" rel="noopener noreferrer">
                            <img src={msg.fileURL} alt="Attachment" className="max-w-xs max-h-52 rounded-lg object-cover cursor-pointer" />
                        </a>
                        {msg.text && <p className="text-sm mt-1">{msg.text}</p>}
                    </div>
                );
            } else {
                // Renders file attachment (e.g., document)
                return (
                    <div className="flex flex-col gap-2">
                        <a href={msg.fileURL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-teal-600 hover:underline bg-gray-100 p-2 rounded-lg">
                            <FaFileAlt size={20} />
                            <span>{msg.fileURL.split('/').pop().split('?')[0].slice(0, 20)}...</span>
                        </a>
                        {msg.text && <p className="text-sm mt-1">{msg.text}</p>}
                    </div>
                );
            }
        }
        // Renders text message
        return <h4>{msg.text}</h4>;
    };


    return (
        <>
            {selectedUser ? (
                <section className="flex flex-col items-start justify-start h-screen w-[100%] background-image">
                    <header className="w-[100%] h-[82px] m:h-fit p-4 bg-white">
                        <main className="flex items-center gap-3">
                            <span>
                                <img src={selectedUser?.image || defaultAvatar} className="w-11 h-11 object-cover rounded-full" alt="" />
                            </span>
                            <span>
                                <h3 className="font-semibold text-[#2A3D39] text-lg">{selectedUser?.fullName || "Chatfrik User"}</h3>
                                <p className="font-light text-[#2A3D39] text-sm">@{selectedUser?.username || "chatfrik"}</p>
                            </span>
                        </main>
                    </header>

                    <main className="custom-scrollbar relative h-[100vh] w-[100%] flex flex-col justify-between">
                        <section className="px-3 pt-5 b-20 lg:pb-10">
                            <div ref={scrollRef} className="overflow-auto h-[80vh]">
                                {sortedMessages?.map((msg, index) => (
                                    <div key={index}>
                                        {msg?.sender === senderEmail ? (
                                            <div className="flex flex-col items-end w-full">
                                                <span className="flex gap-3 me-10 h-auto">
                                                    <div>
                                                        <div className="flex items-start bg-white justify-center p-4 rounded-lg shadow-sm">
                                                            {renderMessageContent(msg)}
                                                        </div>
                                                        <p className="text-gray-400 text-sx mt-3 text-right">{formatTimestamp(msg?.timestamp)}</p>
                                                    </div>
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-start w-full">
                                                <span className="flex gap-3 w-fit h-auto ms-10">
                                                    <img src={defaultAvatar} className="h-11 w-11 object-cover rounded-full" alt="" />
                                                    <div>
                                                        <div className="flex items-start bg-white justify-center p-4 rounded-lg shadow-sm">
                                                            {renderMessageContent(msg)}
                                                        </div>
                                                        <p className="text-gray-400 text-sx mt-3">{formatTimestamp(msg?.timestamp)}</p>
                                                    </div>
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                        
                        {/* Attachment Preview (NEW) */}
                        {attachmentFile && (
                            <div className="absolute bottom-[60px] p-3 w-full bg-white border-t border-gray-200 flex items-center justify-between z-10">
                                <span className="flex items-center gap-3 text-sm text-gray-700">
                                    <FaFileAlt size={18} className="text-[#01AA85]" />
                                    {attachmentFile.name} 
                                    {isUploading && <span className="text-xs text-blue-500">(Uploading...)</span>}
                                </span>
                                <button onClick={handleRemoveAttachment} className="text-red-500 hover:text-red-700">
                                    <RiCloseLine size={24} />
                                </button>
                            </div>
                        )}
                        
                        <div className={`sticky lg:bottom-0 bottom-[60px] p-3 h-fit w-[100%] ${attachmentFile ? 'pt-16' : ''}`}>
                            <form onSubmit={handleSendMessage} action="" className="flex items-center bg-white h-[45px] w-[100%] px-2 rounded-lg relative shadow-lg">
                                {/* Hidden File Input (NEW) */}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                                
                                {/* Attachment Button (NEW) */}
                                <button type="button" onClick={handleAttachmentClick} className="p-2 text-[#01AA85] hover:text-[#019379] disabled:opacity-50" disabled={isUploading}>
                                    <RiAttachmentLine size={20} />
                                </button>
                                
                                <input 
                                    value={messageText} 
                                    onChange={(e) => sendMessageText(e.target.value)} 
                                    className="h-full text-[#2A3D39] outline-none text-[16px] pl-3 pr-[50px] rounded-lg w-[100%]" 
                                    type="text" 
                                    placeholder={attachmentFile ? "Add a caption..." : "Write your message..."}
                                    disabled={isUploading}
                                />
                                <button type="submit" className="flex items-center justify-center absolute right-3 p-2 rounded-full bg-[#D9f2ed] hover:bg-[#c8eae3] disabled:opacity-50" disabled={isUploading || (!messageText.trim() && !attachmentFile)}>
                                    <RiSendPlaneFill color="#01AA85" />
                                </button>
                            </form>
                        </div>
                    </main>
                </section>
            ) : (
                <section className="h-screen w-[100%] bg-[#e5f6f3]">
                    <div className="flex flex-col justify-center items-center h-[100vh]">
                        <img src={logo} alt="" width={100} />
                        <h1 className="text-[30px] font-bold text-teal-700 mt-5">Welcome to Chatfrik</h1>
                        <p className="text-gray-500">Connect and chat with friends easily, securely, fast and free</p>
                    </div>
                </section>
            )}
        </>
    );
};

export default Chatbox;