import { FaTrash, FaReply, FaFlag } from "react-icons/fa";
import { AdvancedImage } from '@cloudinary/react';
import { Cloudinary } from "@cloudinary/url-gen";
import React from "react";
import { useState } from "react";
import { FaThumbsUp } from "react-icons/fa";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "../firebase";


const cld = new Cloudinary({
    cloud: {
        cloudName: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'dfnzttf4v'
    },
    url: {
        secure: true
    }
});

const ChatBubble = ({
    msg,
    lastSeenMessageId,
    lastSeenRef,
    userDetails,
    usersById,
    renderMessageContent,
    setConfirmDeleteId,
    setReportingMessage,
    setReplyTo,
    chatPath
}) => {

    const isMe = msg.senderId === userDetails?.id;
    const amIStaff = userDetails?.role === "staff";
    const sender = usersById?.[msg.senderId];
    const isSenderStaff = sender?.role === "staff";
    const isStaff = sender?.role === "staff";


    const bubbleClass = `chat-bubble ${msg.senderId === userDetails.id ? "me" : "other"}${isStaff ? " staff" : ""}`;
    const myBubbleClass = isMe
  ? `chat-bubble me${isStaff ? " staff" : ""}` // 'isStaff' refers to the current user
  : null;

    const [likes, setLikes] = useState(0);
    const hasReacted = msg.reactions?.thumbsUp?.includes(userDetails.id);

    const handleReactionToggle = async (messageId, userId, hasReacted) => {
        const messageRef = doc(db, ...chatPath, messageId); // adjust collection name
        await updateDoc(messageRef, {
            [`reactions.thumbsUp`]: hasReacted
                ? arrayRemove(userId)
                : arrayUnion(userId)
        });
    };


    return (
        <div
            key={msg.id}
            id={`msg-${msg.id}`}
            ref={msg.id === lastSeenMessageId ? lastSeenRef : null}
            className={bubbleClass}
        >
            {(!isMe) && (
            <div className="chat-name">{msg.name}</div>
)}

            {msg.replyTo && (
                <div className="reply-reference">
                    <strong>{msg.replyTo.name}</strong>: {msg.replyTo.msg}
                </div>
            )}

            {renderMessageContent(msg)}

            <div
                className={`time-dlt-rep ${msg.senderId === userDetails?.id ? "align-left" : "align-right"}`}
            >
                <div className="action-icons">
  
                    {((isMe) || (isMe && amIStaff)) && (
                        <FaTrash
                            className={`delete-btn ${isStaff ? " staff" : ""}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(msg.id);
                            }}
                        />
                    )}

                    {/* Report button: show only if message is not mine and sender is not staff */}
                    {!isMe && !isSenderStaff && (
                        <FaFlag
                            className="report-btn"
                            onClick={() => setReportingMessage(msg)}
                        />
                    )}

                    {/* Reply button logic */}
                    {( // show reply button if
                        (isMe && amIStaff) ||    // 1) my message and I am staff
                        (!isMe && !isSenderStaff) || // 2) other's message but sender is NOT staff
                        (!isSenderStaff || isMe)
                    ) && (
                            <FaReply
                                className={`reply-btn ${isStaff ? " staff" : ""}`}
                                onClick={() => setReplyTo(msg)}
                            />
                        )}

                        {(!isMe && 
                        <div className="reaction-wrapper" onClick={() => handleReactionToggle(msg.id, userDetails.id, hasReacted)}>
                            <FaThumbsUp className={`thumbs-up-icon ${isSenderStaff ? "staff" : ""} ${hasReacted ? "active" : ""}`} />

                            {msg.reactions?.thumbsUp?.length > 0 && (
                                <span className={`reaction-count ${isSenderStaff ? "staff" : ""}`}>{msg.reactions.thumbsUp.length}</span>
                            )}
                        </div>
                    )}
                </div>


                {msg.time && (
                    <div className="chat-time">
                        {msg.time.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatBubble;