import { useContext, useEffect } from "react";
import { UNSAFE_NavigationContext as NavigationContext } from "react-router-dom";

export function useNavigationBlocker(shouldBlock, message = "Are you sure?") {
  const navigator = useContext(NavigationContext).navigator;

  useEffect(() => {
    if (!shouldBlock) return;

    const unblock = navigator.block((tx) => {
      const confirmLeave = window.confirm(message);
      if (confirmLeave) {
        unblock(); // Allow navigation
        tx.retry(); // Retry the transition
      }
      // If not confirmed, stay on the page
    });

    return unblock;
  }, [shouldBlock, message, navigator]);
}