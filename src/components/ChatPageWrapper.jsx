import React from "react";
import { useLocation } from "react-router-dom";
import ChatGroup from "../pages/ChatPage";

const ChatPageWrapper = () => {
  const location = useLocation();
  const { chatPath, title, userFilter, isStaffOnly } = location.state || {};

  return (
    <ChatGroup
      key={location.key} // 💡 forces re-mount when location changes
      chatPath={chatPath}
      title={title}
      userFilter={userFilter}
      isStaffOnly={isStaffOnly}
    />
  );
};

export default ChatPageWrapper;
