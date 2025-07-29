import React, { useState } from "react";
import { nanoid } from "nanoid";
import { doc, setDoc, serverTimestamp, collection } from "firebase/firestore";
import { db } from "../firebase";
import "./VoteMessage.css"; // Reuse existing modal styles
import { FaBullhorn } from "react-icons/fa";

const AnnouncementMessage = ({ onClose, userDetails, usersById, chatPath, title }) => {
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementBody, setAnnouncementBody] = useState("");
  const [announcementDuration, setAnnouncementDuration] = useState("24h");


  const sendAnnouncement = async () => {
  if (!announcementTitle.trim() || !announcementBody.trim()) return;

  onClose();

  const groupId = chatPath.join("_");
  const customId = `${groupId
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()}_${nanoid(8)}`;

  const now = new Date();
  let expiryTime = null;

  switch (announcementDuration) {
    case "24h":
      expiryTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      break;
    case "7d":
      expiryTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      expiryTime = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      break;
    case "forever":
    default:
      expiryTime = null;
  }

  const announcementDoc = doc(collection(db, ...chatPath), customId);
  await setDoc(announcementDoc, {
    type: "announcement",
    title: announcementTitle,
    message: announcementBody,
    name: userDetails.name,
    senderId: userDetails.id,
    time: serverTimestamp(),
    expiry: expiryTime ? expiryTime.toISOString() : null
  });

  const seenDocRef = doc(db, "UserDetails", userDetails.id, "chatLastSeen", title);
  await setDoc(seenDocRef, { lastSeenId: customId }, { merge: true });
};


  return (
    <div className="vote-modal">
      <div className="vote-modal-content">
        <h3><FaBullhorn style={{ marginRight: "8px" }} />Make Announcement</h3>

        <p>Title</p>
        <input
          type="text"
          placeholder="Enter announcement title"
          value={announcementTitle}
          onChange={(e) => setAnnouncementTitle(e.target.value)}
        />

        <p>Message</p>
        <textarea
          placeholder="Enter announcement message"
          value={announcementBody}
          onChange={(e) => setAnnouncementBody(e.target.value)}
          rows={5}
        />

        <p>Duration</p>
<select
  value={announcementDuration}
  onChange={(e) => setAnnouncementDuration(e.target.value)}
>
  <option value="24h">24 Hours</option>
  <option value="7d">7 Days</option>
  <option value="30d">30 Days</option>
  <option value="forever">Forever</option>
</select>


        <div className="vote-actions">
          <button onClick={sendAnnouncement}>Send</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementMessage;
