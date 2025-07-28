import { FaTrash, FaReply, FaFlag } from "react-icons/fa";
import { AdvancedImage } from '@cloudinary/react';
import { Cloudinary } from "@cloudinary/url-gen";
import React from "react";

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
    setReplyTo
}) => {

    const isMe = msg.senderId === userDetails?.id;
    const amIStaff = userDetails?.role === "staff";
    const sender = usersById?.[msg.senderId];
    const isSenderStaff = sender?.role === "staff";
    const isStaff = sender?.role === "staff";


    const bubbleClass = `chat-bubble ${msg.senderId === userDetails.id ? "me" : "other"}${isStaff ? " staff" : ""}`;


    return (
        <div
            key={msg.id}
            id={`msg-${msg.id}`}
            ref={msg.id === lastSeenMessageId ? lastSeenRef : null}
            className={bubbleClass}
        >
            <div className="chat-name">{msg.name}</div>

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