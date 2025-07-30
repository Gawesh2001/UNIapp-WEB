import React, { useEffect, useState, useRef } from "react";
import "./ChatPage.css";
import UserSession from "../utils/UserSession";
import { db } from "../firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  deleteDoc,
  serverTimestamp,
  orderBy,
  query,
  where,
  getDocs,
  addDoc
} from "firebase/firestore";
import { FaChevronCircleLeft, FaTimes, FaChevronCircleRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { nanoid } from "nanoid";
import VoteMessage from "../components/VoteMessage";
import { Cloudinary } from "@cloudinary/url-gen";
import { AdvancedImage } from '@cloudinary/react';
import { toast } from "react-toastify";
import { Filter } from 'bad-words';
import ChatBubble from "../components/ChatBubble";
import ChatInput from "../components/ChatInput";
import AnnouncementMessage from "../components/AnnouncementMessage";


const cld = new Cloudinary({
  cloud: {
    cloudName: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'dfnzttf4v'
  },
  url: {
    secure: true
  }
});

const ChatGroup = ({ chatPath, title, userFilter, isStaffOnly }) => {
  const navigate = useNavigate();
  const [userDetails, setUserDetails] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef(null);
  const [sidebarUsers, setSidebarUsers] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const chatBoxRef = useRef(null);
  const lastSeenRef = useRef(null);
  const [lastSeenMessageId, setLastSeenMessageId] = useState(null);
  const inputRef = useRef(null);
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [mentionAlert, setMentionAlert] = useState(null);
  const isAtBottomRef = useRef(true);
  const [mentionQueue, setMentionQueue] = useState([]);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [showVoteForm, setShowVoteForm] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [imageToUpload, setImageToUpload] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [reportingMessage, setReportingMessage] = useState(null);
  const [usersById, setUsersById] = useState({});

  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);

  useEffect(() => {
    const user = UserSession.currentUser;
    setUserDetails({
      id: user.uid,
      name: user.name,
      email: user.email,
      role: user.role,
      faculty: user.faculty,
      degree: user.degree,
      batch: user.batch,
    });
  }, []);

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

      const latestMention = chats.find(
        (msg) =>
          msg.msg?.includes(`@${userDetails.name}`) &&
          msg.senderId !== userDetails.email
      );
      if (latestMention && !isAtBottomRef.current) {
        setMentionAlert(latestMention.id);
      }
    });

    return () => unsubscribe();
  }, [userDetails, chatPath]);

  

  // Load lastSeenMessageId from user's subcollection
  useEffect(() => {
    if (!userDetails || !title) return;

    const seenDocRef = doc(
      db,
      "UserDetails",
      userDetails.id,
      "chatLastSeen",
      title
    );
    getDoc(seenDocRef).then((docSnap) => {
      if (docSnap.exists()) {
        setLastSeenMessageId(docSnap.data().lastSeenId);
      }
    });
  }, [userDetails, title]);

  useEffect(() => {
    if (!chatBoxRef.current || !chatEndRef.current || !messages.length || !userDetails) return;

    const chatBox = chatBoxRef.current;
    const lastMessage = messages[messages.length - 1];
    const isNearBottom =
      chatBox.scrollTop + chatBox.clientHeight >= chatBox.scrollHeight - 80;

    const shouldScroll =
      lastMessage.senderId === userDetails.email || isNearBottom;

    if (shouldScroll) {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 0);
    }
  }, [messages, userDetails]);

  useEffect(() => {
    const chatBox = chatBoxRef.current;
    if (!chatBox || !messages.length) return;

    const handleScroll = () => {
      const isAtBottom =
        chatBox.scrollTop + chatBox.clientHeight >= chatBox.scrollHeight - 80;

      isAtBottomRef.current = isAtBottom;

      if (isAtBottom) {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg?.id !== lastSeenMessageId) {
          updateLastSeen(lastMsg.id);
        }
      }
    };

    chatBox.addEventListener("scroll", handleScroll);
    return () => chatBox.removeEventListener("scroll", handleScroll);
  }, [messages, lastSeenMessageId]);

  useEffect(() => {
    if (lastSeenRef.current) {
      lastSeenRef.current.scrollIntoView({ behavior: "auto", block: "start" });
    }
  }, [lastSeenMessageId]);

  const uploadImage = async () => {
    if (!imageToUpload) return null;

    const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'dfnzttf4v';
    const uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || 'uniapp';

    const formData = new FormData();
    formData.append('file', imageToUpload);
    formData.append('upload_preset', uploadPreset);

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      setIsUploading(false);

      if (!response.ok) {
        throw new Error(result.error?.message || "Upload failed");
      }

      // Return the URL with proper transformations to ensure it's accessible
      return `https://res.cloudinary.com/${cloudName}/image/upload/${result.public_id}.${result.format}`;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(`Image upload failed: ${error.message}`);
      setIsUploading(false);
      return null;
    }
  };

  const filter = new Filter();


  filter.addWords("paki", "hentai", "bastard", "hutto");

  const cleanOffensiveWords = (text) => {
    return filter.clean(text);
  };

  // Report Function
  const reportMessage = async ({ reportedUserId, reportedBy, messageId, reason }) => {
    try {
      const reportsRef = collection(db, "UserDetails", reportedUserId, "reports");

      const q = query(
        reportsRef,
        where("messageId", "==", messageId),
        where("reportedBy", "==", reportedBy)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        toast.error("You already reported this message.");
        return;
      }

      await addDoc(reportsRef, {
        reportedUserId,
        reportedBy,
        messageId,
        reason,
        timestamp: serverTimestamp(),
        status: "pending"
      });

      toast.info("Report submitted successfully!");
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error("Failed to submit report. Check console for details.");
    }
  };


  const sendMessage = async () => {
    if (!newMessage.trim() && !imageToUpload) return;

    let imageUrl = null;
    if (imageToUpload) {
      imageUrl = await uploadImage();
      if (!imageUrl) return;
    }

    const chatRef = collection(db, ...chatPath);
    const newMsg = cleanOffensiveWords(newMessage.trim());
    setNewMessage("");
    setReplyTo(null);
    setImageToUpload(null);

    const groupId = chatPath.join("_");
    const customId = `${groupId
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()}_${nanoid(8)}`;

    const docRef = doc(chatRef, customId);
    await setDoc(docRef, {
      msg: newMsg,
      name: userDetails.name,
      senderId: userDetails.id,
      time: serverTimestamp(),
      replyTo: replyTo ? {
        name: replyTo.name,
        msg: replyTo.msg,
        imageUrl: replyTo.imageUrl || null,  // Include imageUrl if it exists
        type: replyTo.imageUrl ? "image" : "text"  // Optional: Add type for easier rendering
      } : null,
      imageUrl: imageUrl || null
    });

    // Save last seen message
    const seenDocRef = doc(
      db,
      "UserDetails",
      userDetails.id,
      "chatLastSeen",
      title
    );
    await setDoc(seenDocRef, { lastSeenId: customId }, { merge: true });
  };

  const deleteMessage = async (id) => {
    const messageRef = doc(db, ...chatPath, id);
    await deleteDoc(messageRef);
  };

  const handleDeleteConfirmed = async (id) => {
    const messageRef = doc(db, ...chatPath, id);
    setConfirmDeleteId(null);
    await deleteDoc(messageRef);
  };

  useEffect(() => {
    if (!userFilter || userFilter.length === 0) return;

    const filters = userFilter
      .filter((f) => f.value)
      .map((f) => where(f.field, "==", f.value));

    const q = query(collection(db, "UserDetails"), ...filters);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSidebarUsers(users);
    });

    return () => unsubscribe();
  }, [userFilter]);

  useEffect(() => {
    const mapped = Object.fromEntries(sidebarUsers.map(user => [user.id, user]));
    setUsersById(mapped);
  }, [sidebarUsers]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    const caretPos = e.target.selectionStart;
    const textUpToCaret = value.slice(0, caretPos);
    const mentionMatch = textUpToCaret.match(/@(\w*)$/);

    if (mentionMatch) {
      const query = mentionMatch[1].toLowerCase();
      setMentionQuery(query);
      setShowMentionList(true);

      const filtered = sidebarUsers.filter(
        (user) =>
          user.name.toLowerCase().includes(query) && user.id !== userDetails.id
      );
      setMentionSuggestions(filtered);
    } else {
      setShowMentionList(false);
      setMentionQuery("");
      setMentionSuggestions([]);
    }
  };

  const handleMentionClick = (user) => {
    const input = inputRef.current;
    if (!input) return;

    const caretPos = input.selectionStart;
    const textBeforeCaret = newMessage.slice(0, caretPos);
    const textAfterCaret = newMessage.slice(caretPos);

    const mentionMatch = textBeforeCaret.match(/@(\w*)$/);
    if (!mentionMatch) return;

    const mentionStart = caretPos - mentionMatch[0].length;
    const mentionText = `@${user.name.split(" ").join(" ")}`;

    const newText =
      textBeforeCaret.slice(0, mentionStart) +
      mentionText +
      " " +
      textAfterCaret;

    setNewMessage(newText);
    setShowMentionList(false);
    setMentionQuery("");
    setMentionSuggestions([]);

    setTimeout(() => {
      input.focus();
      input.setSelectionRange(
        mentionStart + mentionText.length + 1,
        mentionStart + mentionText.length + 1
      );
    }, 0);
  };

  useEffect(() => {
    if (!messages.length || !userDetails || !lastSeenMessageId) return;

    const lastSeenIndex = messages.findIndex((msg) => msg.id === lastSeenMessageId);
    const checkMessages =
      lastSeenIndex === -1 ? messages : messages.slice(lastSeenIndex + 1);

    const unseenMentions = checkMessages.filter(
      (msg) =>
        (msg.msg?.includes(`@${userDetails.name}`) ||
          msg.replyTo?.name === userDetails.name) &&
        msg.senderId !== userDetails.id
    );

    setMentionQueue(unseenMentions);
    setMentionIndex(0);
  }, [messages, userDetails, lastSeenMessageId]);

  const updateLastSeen = async (messageId) => {
    if (!userDetails || !title || !messageId) return;

    const seenDocRef = doc(
      db,
      "UserDetails",
      userDetails.id,
      "chatLastSeen",
      title
    );

    await setDoc(seenDocRef, { lastSeenId: messageId }, { merge: true });
    setLastSeenMessageId(messageId);
  };

  useEffect(() => {
    const handleFocus = () => {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.id !== lastSeenMessageId) {
        updateLastSeen(lastMsg.id);
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [messages, lastSeenMessageId]);

  const handleVote = async (messageId, optionIndex) => {
    const messageRef = doc(db, ...chatPath, messageId);
    const messageSnap = await getDoc(messageRef);
    if (!messageSnap.exists()) return;

    const data = messageSnap.data();
    const currentVotes = data.votes || {};
    const allowMultiple = data.allowMultiple || false;

    const userVote = currentVotes[userDetails.id] || (allowMultiple ? [] : null);

    let updatedUserVote;

    if (allowMultiple) {
      // Multiple options allowed: add/remove optionIndex in array
      if (userVote.includes(optionIndex)) {
        updatedUserVote = userVote.filter(i => i !== optionIndex);
      } else {
        updatedUserVote = [...userVote, optionIndex];
      }
    } else {
      // Single option allowed: toggle optionIndex or set to optionIndex
      if (userVote === optionIndex) {
        // Clicking selected option again removes vote (optional)
        updatedUserVote = null;
      } else {
        updatedUserVote = optionIndex;
      }
    }

    const updatedVotes = {
      ...currentVotes,
      [userDetails.id]: updatedUserVote,
    };

    await setDoc(messageRef, { votes: updatedVotes }, { merge: true });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image (JPEG, PNG, GIF, or WEBP)');
      return;
    }

    if (file.size > maxSize) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    setImageToUpload(file);
  };

  const renderImagePreview = () => {
    if (!imageToUpload) return null;

    const objectUrl = URL.createObjectURL(imageToUpload);
    return (
      <div className="image-preview-container">
        <img src={objectUrl} alt="Preview" className="image-preview" />
        <button
          className="remove-image-btn"
          onClick={() => {
            setImageToUpload(null);
            setUploadProgress(0);
          }}
          disabled={isUploading}
        >
          <FaTimes />
        </button>
        {isUploading && (
          <div className="upload-progress-container">
            <div
              className="upload-progress-bar"
              style={{ width: `${uploadProgress}%` }}
            ></div>
            <span className="upload-progress-text">
              {uploadProgress}% {uploadProgress < 100 ? 'Uploading...' : 'Processing...'}
            </span>
          </div>
        )}
      </div>
    );
  };

  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  const renderMessageContent = (msg) => {

    const isMe = msg.senderId === userDetails?.id;
  const amIStaff = userDetails?.role === "staff";
  const sender = usersById?.[msg.senderId];
  const isSenderStaff = sender?.role === "staff";
  const isStaff = sender?.role === "staff";

    if (msg.imageUrl) {
      // Create a Cloudinary image instance with proper transformations
      const image = cld.image(msg.imageUrl.replace('https://res.cloudinary.com/dfnzttf4v/image/upload/', ''));

      return (
        <div className="message-image-container">
          <AdvancedImage
            cldImg={image}
            className="message-image"
            alt="Shared content"
            onClick={() => openImageModal(msg.imageUrl)}
          />
          {msg.msg && (
            <div
              className="chat-text"
              dangerouslySetInnerHTML={{
                __html: (msg.msg || "").replace(
                  /@([A-Za-z]+(?:\s[A-Za-z]+)?)/g,
                  '<span class="mention">@$1</span>'
                ),
              }}
            />
          )}
        </div>
      );
    }

    if (msg.type === "announcement") {
      const isMyAnnouncement = isMe;
const isStaffAnnouncement = isSenderStaff;

      const senderName = usersById?.[msg.senderId]?.name || "Unknown";

      const announcementClass = [
        "announcement-block",
        isMyAnnouncement ? "me" : "other",
        isStaffAnnouncement ? "staff" : ""
      ].filter(Boolean).join(" ");

      return (
        <div className={announcementClass}>
          <div className="sender-name">
            📢 <strong>{senderName}</strong>
          </div>
          <div className="announcement-header">
            <strong>{msg.title}</strong>
          </div>
          <div className="announcement-body">
            {msg.message}
          </div>
        </div>
      );
    }


    if (msg.type === "vote") {
      const isMyVote = msg.senderId === userDetails?.id;
      const isStaffVote = usersById?.[msg.senderId]?.role === "staff";

      const voteBlockClass = [
        "vote-block",
        isMyVote ? "me" : "other",
        isStaffVote ? "staff" : ""
      ].filter(Boolean).join(" ");

      return (
        <div className={voteBlockClass}>
          <div className="vote-header">
            <strong>{msg.question}</strong>
          </div>

          {msg.options.map((opt, idx) => {
            const voteCount = Object.values(msg.votes || {}).filter((userVotes) => {
              if (msg.allowMultiple) {
                return Array.isArray(userVotes) && userVotes.includes(idx);
              } else {
                return userVotes === idx;
              }
            }).length;

            const totalVotes = Object.keys(msg.votes || {}).length;
            const percent = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

            const userVotes = msg.votes?.[userDetails.id];
            const isChecked = msg.allowMultiple
              ? Array.isArray(userVotes) && userVotes.includes(idx)
              : userVotes === idx;

            return (
              <label key={idx} className={`vote-option-label ${isSenderStaff ? "staff" : isMe ? "me" : ""}`}>
                <input
                  type={msg.allowMultiple ? "checkbox" : "radio"}
                  name={`vote-${msg.id}`}
                  checked={isChecked || false}
                  onChange={() => handleVote(msg.id, idx)}
                // Removed the disabled={isMyVote} condition
                />
                <div className="vote-opt-count">
                  <span className="option-text">{opt}</span>
                  {totalVotes > 0 && (
                    <span className="vote-stats">
                      <span className="vote-bar" style={{ width: `${percent}%` }}></span>
                      <span className="vote-count">
                        {voteCount} vote{voteCount !== 1 ? "s" : ""}
                      </span>
                    </span>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      );
    }

    return (
      <div
        className="chat-text"
        dangerouslySetInnerHTML={{
          __html: (msg.msg || "").replace(
            /@([A-Za-z]+(?:\s[A-Za-z]+)?)/g,
            '<span class="mention">@$1</span>'
          ),
        }}
      />
    );
  };



  const nowInSeconds = Math.floor(Date.now() / 1000);

  const validAnnouncements = messages
    .filter(
      (msg) =>
        msg.type === "announcement" &&
        (!msg.expiresAt || msg.expiresAt.seconds > nowInSeconds)
    )
    .sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds);

  const currentAnnouncement = validAnnouncements[currentAnnouncementIndex];



  useEffect(() => {
    if (validAnnouncements.length <= 1) return; // no need to auto-rotate

    const interval = setInterval(() => {
      setCurrentAnnouncementIndex((prevIndex) =>
        (prevIndex + 1) % validAnnouncements.length
      );
    }, 10000); // change every 10 seconds

    return () => clearInterval(interval); // cleanup
  }, [validAnnouncements.length]);

  const handleNextAnnouncement = () => {
    setCurrentAnnouncementIndex((prevIndex) =>
      (prevIndex + 1) % validAnnouncements.length
    );
  };

  


  return (
    <div className="chat-page-wrapper">
      <div className="chat-container">
        <div className="chat-header">
          <FaChevronCircleLeft
            onClick={() => navigate(-1)}
            className="back-icon"
          />
          <span className="faculty-text">{title || "Loading..."}</span>
        </div>

        {currentAnnouncement && (
          <div className="announcement-banner">
            <div className="announcement-content">
              <div className="announcement-header">
                📢 <strong>{usersById?.[currentAnnouncement.senderId]?.name || "Unknown"}</strong>
                
              </div>
              <div className="announcement-body">
                <div className="banner-title">{currentAnnouncement.title}</div>
                <div className="banner-message">{currentAnnouncement.message}</div>
                  
                </div>
                <FaChevronCircleRight onClick={handleNextAnnouncement}
                  className="announcement-next-btn"
                  title="Next announcement" />

            </div>
          </div>
        )}



        <div className="chat-messages" ref={chatBoxRef}>
          {messages.map((msg) => (
            <ChatBubble
              key={msg.id}  // Changed from message.id to msg.id
              msg={msg}     // Changed from message to msg
              lastSeenMessageId={lastSeenMessageId}
              lastSeenRef={lastSeenRef}
              userDetails={userDetails}  // Changed from currentUser to userDetails (since that's what you have in state)
              usersById={usersById}
              renderMessageContent={renderMessageContent}
              setConfirmDeleteId={setConfirmDeleteId}
              setReportingMessage={setReportingMessage}
              setReplyTo={setReplyTo}
              chatPath={chatPath}
            />
          ))}
          <div ref={chatEndRef} />
          {showVoteForm && (
            <VoteMessage
              onClose={() => setShowVoteForm(false)}
              userDetails={userDetails}
              usersById={usersById}
              chatPath={chatPath}
              title={title}
            />
          )}
        </div>

        {showAnnouncementModal && (
          <AnnouncementMessage
            onClose={() => setShowAnnouncementModal(false)}
            userDetails={userDetails}
            usersById={usersById}
            chatPath={chatPath}
            title={title}
          />
        )}


        {replyTo && (
          <div className="reply-preview">
            Replying to <strong>{replyTo.name}</strong>: "{replyTo.msg}"
            <FaTimes
              className="cancel-reply"
              onClick={() => setReplyTo(null)}
              title="Cancel reply"
            />
          </div>
        )}

        {mentionQueue.length > 0 && mentionIndex < mentionQueue.length && (
          <button
            className="mention-alert-btn"
            onClick={() => {
              const currentMentionId = mentionQueue[mentionIndex]?.id;
              const el = document.getElementById(`msg-${currentMentionId}`);
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                updateLastSeen(currentMentionId);
              }

              if (mentionIndex + 1 < mentionQueue.length) {
                setMentionIndex(mentionIndex + 1);
              } else {
                setMentionQueue([]);
                setMentionIndex(0);
              }
            }}
          >
            @{mentionQueue.length - mentionIndex}
          </button>
        )}

        {renderImagePreview()}

        {isStaffOnly && userDetails?.role === "student" ? (
  <div className="staff-only-message">
    <p>🔒 Only lecturers or admins can send messages in this chat.</p>
  </div>
) : (
  <ChatInput
    newMessage={newMessage}
    setNewMessage={setNewMessage}
    sendMessage={sendMessage}
    isUploading={isUploading}
    setImageToUpload={setImageToUpload}
    setReplyTo={setReplyTo}
    replyTo={replyTo}
    sidebarUsers={sidebarUsers}
    userDetails={userDetails}
    setShowVoteForm={setShowVoteForm}
    setShowAnnouncementModal={setShowAnnouncementModal}
  />
)}

      </div>
      <div className="chat-sidebar">
        <h3>Members of {title ? title : "Loading..."}</h3>
        <ul>
          {sidebarUsers.map((user) => (
            <li key={user.id} className="sidebar-user">
              <span className={`initials-circle${user.role === "staff" ? " staff" : ""}`}>
                {user.name
                  .split(" ")
                  .map((word) => word[0])
                  .join("")
                  .toUpperCase()}
              </span>

              {user.name}
            </li>
          ))}
        </ul>
      </div>

      {confirmDeleteId && (
        <div className="modal-overlay" onClick={() => setConfirmDeleteId(null)}>
          <div className="delete-confirm-overlay">
            <div
              className="delete-confirm-popup"
              onClick={(e) => e.stopPropagation()}
            >
              <span>Delete this message?</span>
              <div className="popup-buttons">
                <button
                  className="confirm-btn"
                  onClick={() => handleDeleteConfirmed(confirmDeleteId)}
                >
                  Delete
                </button>
                <button
                  className="cancel-btn"
                  onClick={() => setConfirmDeleteId(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {reportingMessage && (
        <div className="modal-overlay" onClick={() => setReportingMessage(null)}>
          <div className="delete-confirm-overlay">
            <div className="delete-confirm-popup" onClick={(e) => e.stopPropagation()}>
              <span>Report this message as inappropriate?</span>

              {/* 👤 Sender Info */}
              <div className="report-sender-name">
                <strong>From:</strong> {reportingMessage.name || "Unknown User"}
              </div>

              {/* 🧾 Message Preview */}
              <div className="report-preview">
                {reportingMessage.imageUrl ? (
                  <img
                    src={reportingMessage.imageUrl}
                    className="report-image-preview"
                    alt="Reported"

                    onError={(e) => (e.target.style.display = "none")}
                  />
                ) : reportingMessage.type === "vote" ? (
                  <div className="report-text-preview">
                    <strong>Poll:</strong> {reportingMessage.question}
                  </div>
                ) : reportingMessage.msg ? (
                  <div className="report-text-preview">
                    {reportingMessage.msg.length > 100
                      ? reportingMessage.msg.slice(0, 100) + "..."
                      : reportingMessage.msg}
                  </div>
                ) : (
                  <div className="report-text-preview">[No content]</div>
                )}
              </div>

              <div className="popup-buttons">
                <button
                  className="confirm-btn"
                  onClick={() => {
                    reportMessage({
                      reportedUserId: reportingMessage.senderId,
                      reportedBy: userDetails.id,
                      messageId: reportingMessage.id,
                      reason: "Inappropriate content",
                    });
                    setReportingMessage(null);
                  }}
                >
                  Report
                </button>
                <button
                  className="cancel-btn"
                  onClick={() => setReportingMessage(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



      {selectedImage && (
        <div className="image-modal" onClick={closeImageModal}>
          <div className="image-modal-content" onClick={e => e.stopPropagation()}>
            <AdvancedImage
              cldImg={cld.image(selectedImage.replace('https://res.cloudinary.com/dfnzttf4v/image/upload/', ''))}
              className="modal-image"
              alt="Full size content"
            />
            <button className="image-modal-close" onClick={closeImageModal}>
              <FaTimes />
            </button>
          </div>
        </div>
      )}


    </div>
  );
};

export default ChatGroup;