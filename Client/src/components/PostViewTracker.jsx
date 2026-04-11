import { useEffect, useRef, useState } from'react';
import { useUser } from'../context/UserContext';

/**
 * PostViewTracker Component
 * 
 * Tracks post views using IntersectionObserver
 * Only marks post as SEEN when:
 * - Post enters viewport
 * - Stays visible ≥ 1000ms
 * - Has ≥ 50% visibility
 * 
 * Critical: Pagination does NOT mark posts as seen
 * Only explicit view tracking with these conditions does
 */
const PostViewTracker = ({ postId, children }) => {
 const { user } = useUser();
 const elementRef = useRef(null);
 const [hasTracked, setHasTracked] = useState(false);
 const viewStartTimeRef = useRef(null);
 const observerRef = useRef(null);
 const timeoutRef = useRef(null);

 useEffect(() => {
 // Only track for authenticated users
 if (!user || !postId || hasTracked) return;

 const element = elementRef.current;
 if (!element) return;

 // Create IntersectionObserver to track visibility
 observerRef.current = new IntersectionObserver(
 (entries) => {
 entries.forEach((entry) => {
 const isVisible = entry.isIntersecting;
 const visibilityRatio = entry.intersectionRatio;

 if (isVisible && visibilityRatio >= 0.5) {
 // Post is visible and ≥ 50% in viewport
 if (!viewStartTimeRef.current) {
 viewStartTimeRef.current = Date.now();
 
 // Set timeout to track after 1000ms
 timeoutRef.current = setTimeout(() => {
 const viewDuration = Date.now() - viewStartTimeRef.current;
 
 // Double-check visibility before tracking
 if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
 trackView(postId, viewDuration, Math.round(entry.intersectionRatio * 100));
 setHasTracked(true);
 
 // Disconnect observer after tracking
 if (observerRef.current) {
 observerRef.current.disconnect();
 observerRef.current = null;
 }
 }
 }, 1000);
 }
 } else {
 // Post is not visible or < 50% visible
 // Reset tracking if it was partially visible
 if (viewStartTimeRef.current) {
 viewStartTimeRef.current = null;
 if (timeoutRef.current) {
 clearTimeout(timeoutRef.current);
 timeoutRef.current = null;
 }
 }
 }
 });
 },
 {
 threshold: [0, 0.25, 0.5, 0.75, 1.0], // Track at different visibility levels
 rootMargin:'0px',
 }
 );

 // Start observing
 observerRef.current.observe(element);

 // Cleanup
 return () => {
 if (timeoutRef.current) {
 clearTimeout(timeoutRef.current);
 }
 if (observerRef.current) {
 observerRef.current.disconnect();
 }
 };
 }, [user, postId, hasTracked]);

 const trackView = async (postId, viewDuration, viewportPercentage) => {
 try {
 const response = await fetch(`/api/posts/${postId}/view`, {
 method:'POST',
 credentials:'include',
 headers: {
'Content-Type':'application/json',
 },
 body: JSON.stringify({
 viewDuration,
 viewportPercentage,
 }),
 });

 if (!response.ok) {
 console.error('Failed to track view');
 }
 } catch (error) {
 console.error('Error tracking post view:', error);
 // Don't show error to user - view tracking is background operation
 }
 };

 return (
 <div ref={elementRef} style={{ width:'100%'}}>
 {children}
 </div>
 );
};

export default PostViewTracker;
