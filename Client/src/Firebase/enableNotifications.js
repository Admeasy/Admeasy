import { getToken } from "firebase/messaging";
import { messaging } from "../Firebase/Firebase";
import { toast } from "react-toastify";

/**
 * Enables notifications for the user.
 * @param {string} userId - The ID of the logged-in user or mentor.
 * @param {string} userRole - The role ('user' or 'mentor').
 * @param {boolean} force - Whether to bypass session storage dismissal check.
 */
export const enableNotifications = async (userId, userRole = "user", force = false) => {
    console.log("enableNotifications called", {
        userId,
        userRole,
        force,
        permission: Notification.permission,
        vapidKeyExists: !!import.meta.env.VITE_VAPID_KEY
    });

    try {
        if (!("Notification" in window)) {
            console.error("This browser does not support desktop notification");
            return null;
        }

        // If not forced, check if the user already dismissed notifications in this session
        if (!force && sessionStorage.getItem("notifications_prompt_dismissed") === "true") {
            console.log("Notifications prompt was dismissed in this session.");
            return null;
        }

        // Check current notification permission status
        if (Notification.permission === "denied") {
            console.log("Notification permission is denied by the user in browser settings.");
            if (force) {
                toast.warn("Notification permission is blocked. Please enable it in your browser settings to receive updates.", {
                    toastId: "notification-denied-warn"
                });
            }
            return null;
        }

        if (Notification.permission === "granted") {
            console.log("Notification permission already granted. Syncing token...");
        } else {
            console.log("Requesting notification permission...");
        }

        const permission = await Notification.requestPermission();
        console.log("Permission result:", permission);

        if (permission === "granted") {
            const token = await getToken(messaging, {
                vapidKey: import.meta.env.VITE_VAPID_KEY,
            });

            console.log("FCM Token obtained:", token ? "Success" : "Failed");

            if (token && userId) {
                await fetch("/api/notifications/subscribe", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ userId, token, userRole }),
                });
            }

            // Remove any dismissal flag if they finally granted it
            sessionStorage.removeItem("notifications_prompt_dismissed");

            if (force) {
                toast.success("Notifications enabled! You'll stay updated with the latest activity.", {
                    toastId: "notification-success"
                });
            }

            return token;

        } else {
            // Permission was either 'denied' or 'default' (meaning they dismissed the browser prompt)
            console.log("Notification permission not granted:", permission);

            // If they dismissed/denied, we save it to session storage so we don't annoy them for the rest of the session
            if (!force) {
                sessionStorage.setItem("notifications_prompt_dismissed", "true");
            }
            return null;
        }
    } catch (error) {
        console.error("Error enabling notifications:", error);
        return null;
    }
};
