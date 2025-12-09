/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect } from 'react';
import { RiArrowLeftLine, RiArchiveLine, RiUserAddLine, RiTimeLine } from 'react-icons/ri'; 
import { auth, listenForNotifications } from '../firebase/firebase';
import { formatTimestamp } from '../utils/formatTimestamp'; 

const Notifications = ({ onBack }) => {
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const currentUser = auth.currentUser;
    const currentUserId = currentUser?.uid;

    useEffect(() => {
        if (!currentUserId) {
            setIsLoading(false);
            return;
        }
        
        setIsLoading(true);
        
        const notificationTypes = ['archived_update', 'friend_request'];
        
        const unsubscribe = listenForNotifications((liveNotifications) => {
            setNotifications(liveNotifications);
            setIsLoading(false);
        }, currentUserId, notificationTypes); 

        return () => unsubscribe();
    }, [currentUserId]);
    
    // Helper function to render icons based on notification type
    const getIconAndColor = (type) => {
        if (type === 'friend_request') {
            return { icon: <RiUserAddLine size={20} />, color: 'text-blue-500' };
        }
        if (type === 'archived_update') {
            return { icon: <RiArchiveLine size={20} />, color: 'text-green-500' };
        }
        // Default
        return { icon: <RiArchiveLine size={20} />, color: 'text-gray-500' };
    };
    if (isLoading) {
        // We still need the header for navigation, but the content area will be blank
        return (
            <section className="flex flex-col items-start justify-start h-screen w-full bg-white">
                <header className="w-full h-[82px] p-4 bg-white border-b border-gray-200 flex items-center">
                    <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100">
                        <RiArrowLeftLine className="w-6 h-6 text-gray-500" />
                    </button>
                    <h1 className="text-xl font-semibold text-gray-800 ml-4">Activity Center</h1>
                    <div className="flex-grow text-center">
                        <h1 className="text-xl font-semibold text-gray-800">Archived Chats Notificaiton</h1>
                    </div>
                </header>
                    
                {/* Main area is intentionally left blank while loading */}
            </section>
        );
    }

    return (
        <section className="flex flex-col items-start justify-start h-screen w-full bg-white">
            <header className="w-full h-[82px] p-4 bg-white border-b border-gray-200 flex items-center">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100">
                    <RiArrowLeftLine className="w-6 h-6 text-gray-500" />
                </button>
                <h1 className="text-xl font-semibold text-gray-800 ml-4">Activity Center</h1>
            </header>
            
            <main className="w-full p-4 overflow-y-auto">
                {notifications.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                        {notifications.map((notification) => {
                            const { icon, color } = getIconAndColor(notification.type);
                            
                            return (
                                <li key={notification.id} className="py-3 cursor-pointer hover:bg-gray-50 transition duration-150 px-2 rounded-lg flex items-start">
                                    <div className={`mr-4 pt-1 ${color}`}>
                                        {icon}
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-gray-900">{notification.title || "New Activity"}</h4>
                                            <p className="text-xs text-gray-400 flex items-center">
                                                <RiTimeLine className="mr-1" size={12} />
                                                {notification.timestamp ? formatTimestamp(notification.timestamp) : "..."}
                                            </p>
                                        </div>
                                        <p className="text-gray-600 mt-1">{notification.body}</p>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <div className="text-center py-10 text-gray-500">
                        You have no new notifications.
                    </div>
                )}
            </main>
        </section>
    );
};

export default Notifications;