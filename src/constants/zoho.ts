export const ZOHO_CONFIG = {
  TOKEN_BASE: "https://accounts.zoho.eu/oauth/v2",
  API_BASE: "https://mail.zoho.eu/api",
  SCOPES: [
    "ZohoMail.messages.READ",
    "ZohoMail.messages.CREATE",
    "ZohoMail.accounts.READ",
    "ZohoMail.folders.READ",
    "ZohoMail.attachments.READ",
    "ZohoMail.attachments.CREATE",
  ].join(","),
};

export const STORAGE_KEYS = {
  SESSION_TOKEN: "zoho_session_token",
  SAVED_CLIENT_ID: "zoho_saved_client_id",
  CACHED_ACCOUNT_ID: "zoho_account_id",
  CACHED_ACCOUNT_EMAIL: "zoho_account_email",
};

export const FOLDER_NAMES = {
  INBOX: "Inbox",
  SENT: "Sent",
  DRAFTS: "Drafts",
  TRASH: "Trash",
  SPAM: "Spam",
} as const;

export type FolderKey = keyof typeof FOLDER_NAMES;
export type FolderName = (typeof FOLDER_NAMES)[FolderKey];
