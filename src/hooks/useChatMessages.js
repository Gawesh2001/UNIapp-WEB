// hooks/useChatMessages.js
import { useState, useEffect } from "react";
import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  orderBy,
  serverTimestamp,
  deleteDoc
} from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "react-toastify";
import { Filter } from 'bad-words';

const useChatMessages = ({ chatPath, title, userDetails }) => {
  const [messages, setMessages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [lastSeenMessageId, setLastSeenMessageId] = useState(null);

  const filter = new Filter();
  filter.addWords("paki", "hentai", "bastard", "hutto");

  const cleanOffensiveWords = (text) => {
    return filter.clean(text);
  };

  // Load messages
  useEffect(() => {
    if (!userDetails || !chatPath) return;

    const chatRef = collection(db, ...chatPath);
    const q = query(chatRef, orderBy("time", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        time: doc.data().time ? doc.data().time.toDate() : new Date()
      }));
      setMessages(chats);
    });

    return () => unsubscribe();
  }, [userDetails, chatPath]);

  // Send message function
  const sendMessage = async (message, replyTo = null) => {
    if (!message.trim()) return;

    try {
      setIsUploading(true);
      const chatRef = collection(db, ...chatPath);
      const newMsg = cleanOffensiveWords(message.trim());

      const groupId = chatPath.join("_");
      const customId = `${groupId
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()}_${nanoid(8)}`;

      await setDoc(doc(chatRef, customId), {
        msg: newMsg,
        name: userDetails.name,
        senderId: userDetails.id,
        time: serverTimestamp(),
        replyTo: replyTo ? {
          name: replyTo.name,
          msg: replyTo.msg,
          imageUrl: replyTo.imageUrl || null,
        } : null
      });

      // Update last seen
      const seenDocRef = doc(
        db,
        "UserDetails",
        userDetails.id,
        "chatLastSeen",
        title
      );
      await setDoc(seenDocRef, { lastSeenId: customId }, { merge: true });
      
    } catch (error) {
      toast.error("Failed to send message");
      console.error("Error sending message:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return {
    messages,
    sendMessage,
    isUploading,
    lastSeenMessageId
  };
};

export default useChatMessages;