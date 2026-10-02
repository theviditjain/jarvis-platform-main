/**
 * /chat/[session_id] — redirects to /chat which now handles
 * all session routing internally via the sidebar.
 * The session_id is passed as a URL param and loaded from cache.
 */
export { default } from "../page";
