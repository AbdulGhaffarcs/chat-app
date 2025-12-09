import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth"; 
import { getFirestore } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { addDoc, collection, doc, getDoc ,onSnapshot, serverTimestamp, setDoc, updateDoc, deleteDoc, getDocs, writeBatch, query, where, orderBy, limit } from "firebase/firestore";

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyClsGnBEohLixzC3BThefaTp3o7TJkT_t4",
  authDomain: "chat-app-19d50.firebaseapp.com",
  projectId: "chat-app-19d50",
  storageBucket: "chat-app-19d50.firebasestorage.app",
  messagingSenderId: "758864400678",
  appId: "1:758864400678:web:d130da8b2d49b431fe31e7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider(); 


/**
 * Handles signing in the user using Google authentication and saves user data to Firestore.
 */
export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        
        const userDocRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userDocRef);

        if (!docSnap.exists()) {
            await setDoc(userDocRef, {
                uid: user.uid,
                email: user.email,
                username: user.email?.split("@")[0],
                fullName: user.displayName || user.email?.split("@")[0],
                image: user.photoURL || "", 
            });
        }
        
        return user;
    } catch (error) {
        console.error("Google Sign-in error:", error);
        throw error; 
    }
};

/**
 * Deletes a single message from a chat's message subcollection.
 */
export const deleteMessage = async (chatId, messageId) => {
    const messageRef = doc(db, "chats", chatId, "messages", messageId);
    await deleteDoc(messageRef);
};

/**
 * Deletes an entire chat document and all its associated messages.
 */
export const deleteChatAndMessages = async (chatId) => {
    const chatRef = doc(db, "chats", chatId);
    const messagesRef = collection(db, "chats", chatId, "messages");
    const snapshot = await getDocs(messagesRef);
    
    const batch = writeBatch(db);

    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    
    batch.delete(chatRef);

    await batch.commit();
};

/**
 * Uploads a file attachment to Firebase Storage and returns the URL and type.
 */
export const uploadChatAttachment = async (file, chatId) => {
    const fileExtension = file.name.split('.').pop();
    const path = `chats/${chatId}/${Date.now()}.${fileExtension}`;
    
    const attachmentRef = ref(storage, path);
    
    const snapshot = await uploadBytes(attachmentRef, file);
    const url = await getDownloadURL(snapshot.ref);
    
    return { url, type: file.type.startsWith('image/') ? 'image' : 'file' };
};

/**
 * Sends a new message, updating the chat document's last message field.
 */
export const sendMessage = async (messageText, chatId, user1, user2, attachment = {}) => {
    const chatRef = doc(db, "chats", chatId);

    const user1Doc = await getDoc(doc(db, "users", user1));
    const user2Doc = await getDoc(doc(db, "users", user2));

    console.log(user1Doc);
    console.log(user2Doc);

    const user1Data = user1Doc.data();
    const user2Data = user2Doc.data();

    const chatDoc = await getDoc(chatRef);
    
    const lastMessage = attachment.url ? (attachment.type === 'image' ? "Sent an image" : "Sent a file") : messageText;

    if (!chatDoc.exists()) {
        await setDoc(chatRef, {
            users: [user1Data, user2Data],
            lastMessage: lastMessage,
            lastMessageTimestamp: serverTimestamp(),
        });
    } else {
        await updateDoc(chatRef, {
            lastMessage: lastMessage,
            lastMessageTimestamp: serverTimestamp(),
        });
    }

    const messageRef = collection(db, "chats", chatId, "messages");

    const messagePayload = {
        text: messageText,
        sender: auth.currentUser.email,
        timestamp: serverTimestamp(),
    };
    
    if (attachment.url) {
        messagePayload.fileURL = attachment.url;
        messagePayload.fileType = attachment.type;
        if (attachment.type !== 'image' && !messageText.trim()) {
            messagePayload.text = "";
        }
    }
    
    await addDoc(messageRef, messagePayload);
};

// --- Archive & Read Status Functions ---

/**
 * Updates the archived status for a specific user within a chat.
 */
export const archiveChat = async (chatId, userId, archiveStatus) => {
    const chatRef = doc(db, "chats", chatId);
    try {
        await updateDoc(chatRef, {
            [`archivedBy.${userId}`]: archiveStatus, 
        });
        console.log(`Chat ${chatId} archive status set to ${archiveStatus} for user ${userId}`);
    } catch (error) {
        console.error("Error updating archive status:", error);
        throw error;
    }
};

/**
 * Resets the unread message count for a specific user in a given chat (marks as read).
 */
export const markChatAsRead = async (chatId, userId) => {
    const chatRef = doc(db, "chats", chatId);
    const updateField = `unreadCount.${userId}`;
    
    try {
        await updateDoc(chatRef, {
            [updateField]: 0 // Resetting count to zero
        });
        console.log(`Chat ${chatId} marked as read for user ${userId}`);
    } catch (error) {
        console.error("Error marking chat as read:", error);
    }
};

// --- Real-time Listeners ---

/**
 * Sets up a real-time listener for all chats the current user is a participant in.
 */
export const listenForChats = (setChats) => {
    const chatsRef = collection(db , "chats"); 
    const unsubscribe = onSnapshot(chatsRef, (snapshot) => {
        const chatList = snapshot.docs.map((doc ) => ({
            id : doc.id, 
            ...doc.data()  
        }));
    
    const currentUserEmail = auth.currentUser?.email;

    const filteredChats = currentUserEmail
        ? chatList.filter((chat) => chat.users.some((user) => user.email === currentUserEmail))
        : [];

    setChats(filteredChats); 
    });
    return unsubscribe;

} 

/**
 * Sets up a real-time listener for messages within a specific chat ID.
 */
export const listenForMessages = (chatId, setMessages) => {
    const chatRef = collection(db, "chats", chatId, "messages");
    onSnapshot(chatRef, (snapshot) => {
        const messages = snapshot.docs.map((doc) => ({
            id: doc.id, 
            ...doc.data()
        }));
        setMessages(messages);
    });
};

/**
 * Sets up a real-time listener for notifications based on recipient and message type.
 * @param {function} setNotifications - React state setter.
 * @param {string} userId - The current user's UID.
 * @param {string[]} types - An array of notification types to fetch (e.g., ['friend_request', 'archived_update']).
 */
export const listenForNotifications = (setNotifications, userId, types = []) => {
    if (!userId) return () => {};

    const notificationsRef = collection(db, "notifications");
    let q = query(
        notificationsRef,
        where("recipientId", "==", userId),
        orderBy("timestamp", "desc"),
        limit(50)
    );
    
    if (types.length > 0) {
        q = query(q, where("type", "in", types));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const notificationsList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        }));
        setNotifications(notificationsList);
    }, (error) => {
        console.error("Error listening for notifications:", error);
    });

    return unsubscribe;
};

// --- Exports ---
export { auth, db, storage, ref, uploadBytes, getDownloadURL, addDoc, collection, doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc, deleteDoc, getDocs, writeBatch, query, where, orderBy, limit };