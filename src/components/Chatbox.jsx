import React, { useEffect, useMemo, useRef, useState } from "react";
import { formatTimestamp } from "../utils/formatTimestamp";
import { RiSendPlaneFill, RiAttachmentLine, RiCloseLine, RiDeleteBinLine, RiReplyLine, RiFileCopyLine } from "react-icons/ri"; 
import { FaFileAlt } from "react-icons/fa";
import { auth, listenForMessages, sendMessage, uploadChatAttachment, deleteChatAndMessages, deleteMessage } from "../firebase/firebase"; 
import logo from "/assets/logo.png";


const defaultAvatar = "/assets/user.jpg";

const compressImage = (file, { quality = 0.7, maxWidth = 1024, maxHeight = 1024, mimeType = 'image/jpeg' }) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onerror = (error) => reject(error);
        
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                let width = img.width;
                let height = img.height;
                
                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob((blob) => {
                    if (!blob) {
                        return reject(new Error("Canvas compression failed."));
                    }
                    const compressedFile = new File([blob], file.name.replace(/\.(png|gif)$/i, '.jpeg'), {
                        type: mimeType,
                        lastModified: Date.now(),
                    });
                    resolve(compressedFile);
                }, mimeType, quality);
            };
            img.onerror = (error) => reject(error);
        };
    });
};


const Chatbox = ({ selectedUser, onChatDeleted }) => {
    const [messages, setMessages] = useState([]);
    const [messageText, sendMessageText] = useState("");
    const [attachmentFile, setAttachmentFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);
    const scrollRef = useRef(null);

    // MODIFIED STATE: Stores message data and click position for the menu
    const [contextMenuMsg, setContextMenuMsg] = useState(null); 
    
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
    
    // NEW HANDLER: Captures message and position
    const handleContextMenuOpen = (e, msg) => {
        e.preventDefault(); // Prevent text selection/default context menu
        
        // Calculate position relative to the viewport
        const rect = e.currentTarget.getBoundingClientRect();
        
        // Use clientY and clientX relative to the chat area
        const x = rect.left + rect.width / 2;
        const y = rect.top - 10;// Adjust for scroll position;

        if (msg.id) {
            setContextMenuMsg({
                ...msg,
                x: x, 
                y: y,
                isSender: msg.sender === senderEmail,
            });
        }
    };
    
    const handleContextMenuClose = () => {
        setContextMenuMsg(null);
    };

    const handleCopyMessage = (text) => {
        navigator.clipboard.writeText(text || "").then(() => {
            console.log("Message copied to clipboard.");
        }).catch(err => {
            console.error("Could not copy text: ", err);
        });
        handleContextMenuClose();
    };

    const handleDeleteMessage = async (messageId) => {
        if (!window.confirm("Are you sure you want to delete this message?")) {
            return;
        }
        handleContextMenuClose();
        try {
            await deleteMessage(chatId, messageId);
        } catch (error) {
            console.error("Error deleting message:", error);
            alert("Failed to delete message.");
        }
    };

    const handleAttachmentClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const originalFile = e.target.files[0];
        if (!originalFile) return;

        if (originalFile.type.startsWith('image/')) {
            if (originalFile.size > 512000) { 
                setIsUploading(true); 
                try {
                    const compressedImage = await compressImage(originalFile, { 
                        quality: 0.7, 
                        maxWidth: 1024,
                        maxHeight: 1024,
                    });
                    setAttachmentFile(compressedImage);
                } catch (error) {
                    console.error("Image compression failed:", error);
                    alert("Image compression failed. Please try a different file.");
                    setAttachmentFile(null);
                } finally {
                    setIsUploading(false);
                }
            } else {
                setAttachmentFile(originalFile);
            }
        } else {
            setAttachmentFile(originalFile);
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
        
        if (!messageText.trim() && !attachmentFile) return;
        if (isUploading) return;
        
        setIsUploading(true);
        let attachmentData = {};

        try {
            if (attachmentFile) {
                attachmentData = await uploadChatAttachment(attachmentFile, chatId);
            }
            
            await sendMessage(
                messageText, 
                chatId, 
                user1?.uid, 
                user2?.uid, 
                attachmentData
            );
            
            sendMessageText("");
            handleRemoveAttachment();
        } catch (error) {
            console.error("Failed to send message/upload attachment:", error);
            alert("Failed to send message. Check console for details.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteChat = async () => {
        if (!window.confirm("Are you sure you want to delete this entire chat history? This action is permanent and cannot be undone.")) {
            return;
        }

        try {
            await deleteChatAndMessages(chatId);
            if (onChatDeleted) {
                onChatDeleted(); 
            }
        } catch (error) {
            console.error("Error deleting chat:", error);
            alert("Failed to delete chat. Check console for details.");
        }
    };

    const renderMessageContent = (msg) => {
        if (msg.fileURL) {
            if (msg.fileType === 'image') {
                return (
                    <div className="flex flex-col gap-2">
                        <a href={msg.fileURL} target="_blank" rel="noopener noreferrer">
                            <img src={msg.fileURL} alt="Attachment" className="max-w-xs max-h-52 rounded-lg object-cover cursor-pointer" />
                        </a>
                        {msg.text && <p className="text-sm mt-1">{msg.text}</p>}
                    </div>
                );
            } else {
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
        return <h4>{msg.text}</h4>;
    };

    // NEW FUNCTION: Renders the Context Menu Popover (positioned absolutely)
    const renderContextMenu = () => {
        if (!contextMenuMsg) return null;

        const { x, y, text, id, isSender } = contextMenuMsg;
        
        return (
            <div className="fixed inset-0 z-50" onClick={handleContextMenuClose}>
                <div 
                    className="absolute bg-white rounded-xl shadow-2xl p-2 w-56"
                    style={{ 
                        left: `${x}px`,
                        top: `${y}px`,
                        transform: `translate(-50%, 10px)` // Show below the click point (was -110% before)
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-2 border-b text-sm font-semibold text-gray-700">
                        {text ? text.substring(0, 30) + (text.length > 30 ? '...' : '') : 'Message Options'}
                    </div>
                    
                    <ul className="py-1">
                        <li className="flex items-center p-2 hover:bg-gray-100 cursor-pointer text-gray-800" onClick={() => handleCopyMessage(text)}>
                            <RiFileCopyLine size={20} className="mr-3" /> Copy
                        </li>
                        
                        <li className="flex items-center p-2 hover:bg-gray-100 cursor-pointer text-gray-500">
                            <RiReplyLine size={20} className="mr-3" /> Reply (Stub)
                        </li>
                        
                        {isSender && (
                            <li className="flex items-center p-2 hover:bg-red-100 cursor-pointer text-red-600" onClick={() => handleDeleteMessage(id)}>
                                <RiDeleteBinLine size={20} className="mr-3" /> Delete
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        );
    };


    return (
        <>
            {renderContextMenu()} {/* RENDER THE CONTEXT MENU HERE */}
            
            {selectedUser ? (
                <section className="flex flex-col items-start justify-start h-screen w-[100%] background-image">
                    <header className="w-[100%] h-[82px] m:h-fit p-4 bg-white flex items-center justify-between">
                        <main className="flex items-center gap-3">
                            <span>
                                <img src={selectedUser?.image || defaultAvatar} className="w-11 h-11 object-cover rounded-full" alt="" />
                            </span>
                            <span>
                                <h3 className="font-semibold text-[#2A3D39] text-lg">{selectedUser?.fullName || "Chatfrik User"}</h3>
                                <p className="font-light text-[#2A3D39] text-sm">@{selectedUser?.username || "chatfrik"}</p>
                            </span>
                        </main>
                        {/* DELETE CHAT BUTTON */}
                        <button onClick={handleDeleteChat} className="p-2 text-red-500 hover:text-red-700 disabled:opacity-50" disabled={isUploading}>
                             <RiDeleteBinLine size={24} /> 
                        </button>
                    </header>

                    <main className="custom-scrollbar relative h-[100vh] w-[100%] flex flex-col justify-between">
                        <section className="px-3 pt-5 b-20 lg:pb-10">
                            <div ref={scrollRef} className="overflow-auto h-[80vh]">
                                {sortedMessages?.map((msg) => (
                                    <div key={msg.id}> 
                                        {msg?.sender === senderEmail ? (
                                            <div className="flex flex-col items-end w-full">
                                                <span className="flex gap-3 me-10 h-auto">
                                                    <div className="flex flex-col items-end">
                                                        {/* MODIFIED: Added onClick to capture event and open menu */}
                                                        <div 
                                                            className="flex items-start bg-white justify-center p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-lg transition-shadow"
                                                            onClick={(e) => handleContextMenuOpen(e, msg)}
                                                        >
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
                                                        {/* MODIFIED: Added onClick to capture event and open menu */}
                                                        <div 
                                                            className="flex items-start bg-white justify-center p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-lg transition-shadow"
                                                            onClick={(e) => handleContextMenuOpen(e, msg)}
                                                        >
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
                        
                        {attachmentFile && (
                            <div className="absolute bottom-[60px] p-3 w-full bg-white border-t border-gray-200 flex items-center justify-between z-10">
                                <span className="flex items-center gap-3 text-sm text-gray-700">
                                    <FaFileAlt size={18} className="text-[#01AA85]" />
                                    {attachmentFile.name} 
                                    {isUploading && <span className="text-xs text-blue-500">(Processing...)</span>}
                                </span>
                                <button type="button" onClick={handleRemoveAttachment} className="text-red-500 hover:text-red-700" disabled={isUploading}>
                                    <RiCloseLine size={24} />
                                </button>
                            </div>
                        )}
                        
                        <div className={`sticky lg:bottom-0 bottom-[60px] p-3 h-fit w-[100%] ${attachmentFile ? 'pt-16' : ''}`}>
                            <form onSubmit={handleSendMessage} action="" className="flex items-center bg-white h-[45px] w-[100%] px-2 rounded-lg relative shadow-lg">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                                
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