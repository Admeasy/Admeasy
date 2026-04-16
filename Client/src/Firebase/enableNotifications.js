import { getToken } from"firebase/messaging";
import { messaging } from"../Firebase/Firebase";
import { toast } from"react-toastify";

/**
 * Enables notifications for the user.
 * @param {string} userId - The ID of the logged-in user or mentor.
 * @param {string} userRole - The role ('user'or'mentor').
 * @param {boolean} force - Whether to bypass session storage dismissal check.
 */
export const enableNotifications = async (userId, userRole ="user", force = false) => {

 try {
 if (!("Notification"in window)) {
 console.error("This browser does not support desktop notification");
 return null;
 }

 // If not forced, check if the user already dismissed notifications in this session
 if (!force && sessionStorage.getItem("notifications_prompt_dismissed") ==="true") {
 return null;
 }

 // If permission is already granted, just get the token
 if (Notification.permission ==="granted") {
 const token = await getToken(messaging, {
 vapidKey: import.meta.env.VITE_VAPID_KEY,
 });

 if (token && userId) {
 await fetch("/api/notifications/subscribe", {
 method:"POST",
 headers: {
"Content-Type":"application/json",
 },
 body: JSON.stringify({ userId, token, userRole }),
 });
 }

 // Remove any dismissal flag
 sessionStorage.removeItem("notifications_prompt_dismissed");

 if (force) {
 toast.success("Notifications enabled! You'll stay updated with the latest activity.", {
 toastId:"notification-success"
 });
 }

 return token;
 }

 // Request permission (will work if status is"default", but will immediately return"denied"if previously denied)
 const permission = await Notification.requestPermission();

 if (permission ==="granted") {
 const token = await getToken(messaging, {
 vapidKey: import.meta.env.VITE_VAPID_KEY,
 });

 if (token && userId) {
 await fetch("/api/notifications/subscribe", {
 method:"POST",
 headers: {
"Content-Type":"application/json",
 },
 body: JSON.stringify({ userId, token, userRole }),
 });
 }

 // Remove any dismissal flag if they finally granted it
 sessionStorage.removeItem("notifications_prompt_dismissed");

 if (force) {
 toast.success("Notifications enabled! You'll stay updated with the latest activity.", {
 toastId:"notification-success"
 });
 }

 return token;

 } else if (permission ==="denied") {
 // Permission was denied - user must enable it in browser settings
 if (force) {
 toast.warn("Notification permission is blocked. Please enable it in your browser settings to receive updates.", {
 toastId:"notification-denied-warn"
 });
 }
 // Don't save to session storage if forced, so user can try again
 if (!force) {
 sessionStorage.setItem("notifications_prompt_dismissed","true");
 }
 return null;
 } else {
 // Permission was'default'(meaning they dismissed the browser prompt)
 // If they dismissed, we save it to session storage so we don't annoy them for the rest of the session
 if (!force) {
 sessionStorage.setItem("notifications_prompt_dismissed","true");
 }
 return null;
 }
 } catch (error) {
 console.error("Error enabling notifications:", error);
 return null;
 }
};
