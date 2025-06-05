// src/types/clerk.ts

export interface VerificationErrorInterface { 
  code: string;
  message: string;
  long_message: string;
}

export interface VerificationInterface {
  status: string;
  strategy: string;
  externalVerificationRedirectURL?: string | null; 
  attempts: number | null;
  expireAt: number | null; 
  nonce?: string | null; 
  error?: VerificationErrorInterface | null;
}

export interface LinkedToInterface {
  id: string;
  type: string;
}

export interface EmailAddressInterface {
  id: string;
  emailAddress: string; 
  verification: VerificationInterface;
  linkedTo: LinkedToInterface[];
}

export interface ExternalAccountInterface {
  id: string;
  provider: string;
  identificationId: string; 
  externalId: string; 
  approvedScopes: string; 
  emailAddress: string; 
  firstName: string | null; 
  lastName: string | null; 
  imageUrl: string; 
  username: string | null;
  publicMetadata: Record<string, unknown>; 
  label: string | null;
  verification: VerificationInterface;
}

export interface RawClerkUser {
  id: string;
  passwordEnabled: boolean;
  totpEnabled: boolean;
  backupCodeEnabled: boolean;
  twoFactorEnabled: boolean;
  banned: boolean;
  createdAt: number;
  updatedAt: number;
  imageUrl: string; 
  hasImage: boolean;
  primaryEmailAddressId: string | null;
  primaryPhoneNumberId: string | null;
  primaryWeb3WalletId: string | null;
  lastSignInAt: number | null;
  externalId: string | null; 
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  publicMetadata: Record<string, unknown>;
  privateMetadata: Record<string, unknown>;
  unsafeMetadata: Record<string, unknown>;
  emailAddresses: EmailAddressInterface[];
  phoneNumbers: Array<Record<string, unknown>>; 
  web3Wallets: Array<Record<string, unknown>>;  
  externalAccounts: ExternalAccountInterface[];
  createOrganizationEnabled: boolean;
  // Note: Fields like passkeys, saml_accounts etc., were removed as they weren't in the last JSON.
  // Add them back if they are indeed part of the clerkClient.users.getUser() response.
} 

// Interface for Clerk Session Object (based on typical structure)
export interface ClerkSession {
  id: string;
  userId: string;
  clientId: string;
  status: string; // e.g., "active", "revoked", "ended", "expired"
  lastActiveAt: number; // Timestamp
  expireAt: number; // Timestamp
  abandonAt: number; // Timestamp
  createdAt: number; // Timestamp
  updatedAt: number; // Timestamp
  // Optional fields often found in session details from IP/User Agent
  latestActivity?: {
    id: string;
    country: string; // e.g., "US"
    city: string; // e.g., "New York"
    ipAddress: string; // e.g., "123.45.67.89"
    isMobile: boolean;
    browserName: string; // e.g., "Chrome"
    browserVersion: string; // e.g., "91.0"
    deviceName: string; // e.g., "Unknown Device"
    deviceType: string; // e.g., "desktop"
    osName: string; // e.g., "Windows"
    osVersion: string; // e.g., "10"
  };
  // Actors if any (e.g. for session impersonation)
  actor?: Record<string, unknown> | null;
  // Other fields might exist, this is a common subset
} 