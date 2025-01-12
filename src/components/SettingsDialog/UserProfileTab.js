import React, { useState } from "react";

const UserProfileTab = () => {
  const [username, setUsername] = useState("User123");

  return (
    <div>
      <h3>User Profile</h3>
      <label>
        Username:
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ marginLeft: "10px", padding: "5px", borderRadius: "5px" }}
        />
      </label>
    </div>
  );
};

export default UserProfileTab;
