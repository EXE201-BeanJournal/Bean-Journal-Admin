import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";
import TableSkeleton from '../../components/common/TableSkeleton';

// Nested Interfaces for RawClerkUser (updated to camelCase)
interface VerificationErrorInterface { // Assuming this structure if present, or adjust as needed
  code: string;
  message: string;
  long_message: string;
}

interface VerificationInterface {
  status: string;
  strategy: string;
  externalVerificationRedirectURL?: string | null; // from your JSON
  attempts: number | null;
  expireAt: number | null; // from your JSON (note camelCase vs expire_at)
  nonce?: string | null; // from your JSON
  error?: VerificationErrorInterface | null;
}

interface LinkedToInterface {
  id: string;
  type: string;
}

interface EmailAddressInterface {
  id: string;
  emailAddress: string; // Updated from email_address
  verification: VerificationInterface;
  linkedTo: LinkedToInterface[];
  // object: string; // Was in previous, not in new JSON example for this level
  // reserved: boolean; // Was in previous, not in new JSON example
  // matches_sso_connection: boolean; // Was in previous, not in new JSON example
  // createdAt: number; // Was in previous, not in new JSON example for this level
  // updatedAt: number; // Was in previous, not in new JSON example for this level
}

interface ExternalAccountInterface {
  id: string;
  provider: string;
  identificationId: string; // Updated
  externalId: string; // from your JSON (provider_user_id was old name)
  approvedScopes: string; // Updated
  emailAddress: string; // Updated
  firstName: string | null; // Updated
  lastName: string | null; // Updated
  imageUrl: string; // Updated
  username: string | null;
  publicMetadata: Record<string, unknown>; // Updated
  label: string | null;
  verification: VerificationInterface;
  // object: string; // Was in previous, not in new JSON example
  // createdAt: number; // Was in previous, not in new JSON example
  // updatedAt: number; // Was in previous, not in new JSON example
}

// Updated RawClerkUser to match JSON structure (camelCase)
interface RawClerkUser {
  id: string;
  passwordEnabled: boolean;
  totpEnabled: boolean;
  backupCodeEnabled: boolean;
  twoFactorEnabled: boolean;
  banned: boolean;
  createdAt: number;
  updatedAt: number;
  imageUrl: string; // This is the primary one we need for avatar
  hasImage: boolean;
  primaryEmailAddressId: string | null;
  primaryPhoneNumberId: string | null;
  primaryWeb3WalletId: string | null;
  lastSignInAt: number | null;
  externalId: string | null; // This is different from externalAccounts[].externalId
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
  // Fields from previous interface that are not in the new example, commented out or removed:
  // object: string;
  // totp_enabled: boolean;
  // backup_code_enabled: boolean;
  // passkeys: Array<Record<string, unknown>>;
  // saml_accounts: Array<Record<string, unknown>>;
  // enterprise_accounts: Array<Record<string, unknown>>;
  // locked: boolean;
  // lockout_expires_in_seconds: number | null;
  // verification_attempts_remaining: number;
  // delete_self_enabled: boolean;
  // last_active_at: number | null;
  // mfa_enabled_at: number | null;
  // mfa_disabled_at: number | null;
  // legal_accepted_at: number | null;
  // profile_image_url: string; // imageUrl seems to be the correct one
}

interface DisplayUser {
  id: string;
  name: string;
  username: string | null;
  email: string;
  role: string;
  status: "Active" | "Inactive" | "Pending";
  avatar: string;
  lastLogin: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<DisplayUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null); 
      let rawResponseText = ''; 

      try {
        const response = await fetch('/api/users');
        rawResponseText = await response.text(); 

        if (!response.ok) {
          console.error(`Error response from /api/users (status ${response.status}):`, rawResponseText);
          throw new Error(`Failed to fetch users: ${response.statusText} (${response.status}). Response: ${rawResponseText.substring(0, 300)}...`);
        }
        
        const data: RawClerkUser[] = JSON.parse(rawResponseText);

        const formattedUsers: DisplayUser[] = data.map((user: RawClerkUser) => {
          let role = 'User'; // Default role
          const metadataRole = user.publicMetadata?.['role']; // Safe access using optional chaining and bracket notation
          if (typeof metadataRole === 'string') {
            role = metadataRole;
          }
          
          const primaryEmail = user.emailAddresses?.find(ea => ea.id === user.primaryEmailAddressId)?.emailAddress || 
                               user.emailAddresses?.[0]?.emailAddress || 
                               'N/A';

          return {
            id: user.id,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'N/A',
            username: user.username,
            email: primaryEmail,
            role: role,
            status: user.banned ? 'Inactive' : 'Active',
            avatar: user.imageUrl, 
            lastLogin: user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString() : 'Never',
          };
        });
        setUsers(formattedUsers);
      } catch (err) {
        console.error('Error during user fetch or JSON parse:', err);
        if (err instanceof SyntaxError && rawResponseText) {
          console.error('Raw response that caused JSON parse error:', rawResponseText);
          setError(`Failed to parse server response. Check console for raw response. Snippet: ${rawResponseText.substring(0, 300)}...`);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred while fetching users.');
        }
      }
      setLoading(false);
    };

    fetchUsers();
  }, []);

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <>
      <PageMeta
        title="User Management | Admin Dashboard"
        description="Manage users in the application."
      />
      <PageBreadcrumb pageTitle="User List" />
      <div className="space-y-6">
        <ComponentCard title="All Users">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Name & Username
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Email
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Role
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Last Login
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Status
                    </TableCell>
                     <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>
                {loading ? (
                  <TableSkeleton rows={5} />
                ) : (
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {users.map((user, index) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                      >
                        <TableCell className="px-5 py-4 text-start sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 overflow-hidden rounded-full">
                              <img
                                width={40}
                                height={40}
                                src={user.avatar} // This will now use user.imageUrl from RawClerkUser
                                alt={`${user.name}'s avatar`}
                              />
                            </div>
                            <div>
                              <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                                {user.name}
                              </span>
                              {user.username && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  @{user.username}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                          {user.email} {/* This will now use the primaryEmail logic */}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                          {user.role}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                          {user.lastLogin}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                          <Badge
                            size="sm"
                            color={
                              user.status === "Active"
                                ? "success"
                                : user.status === "Inactive"
                                ? "error"
                                : "warning"
                            }
                          >
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                          <Link to={`/users/edit/${user.id}`} className="mr-2 text-blue-500 hover:underline">
                            Edit
                          </Link>
                          <button onClick={() => console.log(`Delete user ${user.id}`)} className="text-red-500 hover:underline">Delete</button>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                )}
              </Table>
            </div>
          </div>
        </ComponentCard>
      </div>
    </>
  );
}
