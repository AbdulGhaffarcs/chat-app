import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { addDoc, collection, doc, getDoc ,onSnapshot, serverTimestamp, setDoc, updateDoc, deleteDoc, getDocs, writeBatch } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAH5XJJ1Dlyb84MONrLiU5OvCWQ29I8NtM",
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

export const deleteMessage = async (chatId, messageId) => {
    const messageRef = doc(db, "chats", chatId, "messages", messageId);
    await deleteDoc(messageRef);
};

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

export const uploadChatAttachment = async (file, chatId) => {
    const fileExtension = file.name.split('.').pop();
    const path = `chats/${chatId}/${Date.now()}.${fileExtension}`;
    
    const attachmentRef = ref(storage, path);
    
    const snapshot = await uploadBytes(attachmentRef, file);
    const url = await getDownloadURL(snapshot.ref);
    
    return { url, type: file.type.startsWith('image/') ? 'image' : 'file' };
};


export const  listenForChats = (setChats) => {
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


export { auth, db, storage, ref, uploadBytes, getDownloadURL };