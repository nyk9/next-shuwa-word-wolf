"use client";

import { useEffect, useState } from "react";
import { useIsHost } from "../hooks/useIsHost";

export default function ShowUsername(props: { allUsers: string[] }) {
  const [user, setUser] = useState<string | null>(null);
  const users = props.allUsers;
  const isHost = useIsHost();
  console.log(isHost);
  useEffect(() => {
    setUser(localStorage.getItem("user"));
  }, []);
  return (
    <div>
      {isHost ? (
        <>
          {users.map((user, index) => {
            return (
              <div key={index}>
                ユーザー{index}: {user}
              </div>
            );
          })}
        </>
      ) : (
        <>ホストではありません</>
      )}
      <div>ユーザー名：{user}</div>
    </div>
  );
}

