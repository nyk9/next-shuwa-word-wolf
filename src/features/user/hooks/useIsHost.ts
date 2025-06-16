"use client";

import { useEffect, useState } from "react";

export const useIsHost = () => {
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    const checkIsHost = () => {
      if (typeof window !== "undefined") {
        const username = localStorage.getItem("user");
        if (username === "rustacean") {
          setIsHost(true);
        }
      }
    };

    checkIsHost();
  }, []);
  return isHost;
};
