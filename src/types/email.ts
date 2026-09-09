export interface ZohoTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  obtained_at: number;
}

export interface ZohoAccount {
  accountId: string;
  emailAddress: string;
  displayName: string;
  isPrimary: boolean;
}

export interface ZohoFolder {
  folderId: string;
  folderName: string;
  path: string;
  unreadCount: number;
  messageCount: number;
  mode: string;
}

export interface ZohoEmail {
  messageId: string;
  subject: string;
  fromAddress: string;
  toAddress: string;
  receivedTime: string;
  sentDateInGMT: string;
  summary: string;
  hasAttachment: boolean;
  isRead: boolean;
  folderId: string;
  status: string;
  size: string;
}

export interface ZohoEmailContent extends ZohoEmail {
  content: string;
  htmlContent: string;
}

export interface ZohoAttachment {
  attachmentId: string;
  attachmentName: string;
  size: number;
  type: string;
}

export interface AttachmentFile {
  name: string;
  type: string;
  data: string; // base64
  size: number;
}

export interface ComposeForm {
  to: string;
  subject: string;
  body: string;
}

export interface ZohoConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}
