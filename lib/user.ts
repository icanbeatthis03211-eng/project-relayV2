const USER_ID_KEY = "project-relay-user-id";

function generateUUID(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback UUID v4 generator
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Returns a stable anonymous user id stored in localStorage.
 * Since this app has no real authentication, every browser gets
 * its own UUID which is used as the `user_id` column value for
 * all feedbacks / checklist_status rows it creates.
 */
export function getUserId(): string {
  if (typeof window === "undefined") {
    return "server";
  }
  let id = window.localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = generateUUID();
    window.localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}
