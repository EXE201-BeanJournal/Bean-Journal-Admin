import { useEffect, useState, FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Form from "../../components/form/Form";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import TextArea from "../../components/form/input/TextArea";
import { RawClerkUser, EmailAddressInterface, ExternalAccountInterface, ClerkSession } from "../../types/clerk";
import Badge from "../../components/ui/badge/Badge";

// Define a simpler UserData for the form state
interface UserFormData {
  firstName: string;
  lastName: string;
  username: string;
  role: string; // Will be part of publicMetadata, but kept for simplicity if desired
  publicMetadata: string; // JSON string
  privateMetadata: string; // JSON string
  unsafeMetadata: string; // JSON string
}

export default function EditUserPage() {
  const { userId } = useParams<{ userId: string }>();

  const [user, setUser] = useState<UserFormData>({
    firstName: "",
    lastName: "",
    username: "",
    role: "", // Default role or extract from publicMetadata on fetch
    publicMetadata: "{}",
    privateMetadata: "{}",
    unsafeMetadata: "{}",
  });
  const [emailAddresses, setEmailAddresses] = useState<EmailAddressInterface[]>([]);
  const [primaryEmailId, setPrimaryEmailId] = useState<string | null>(null);
  const [externalAccounts, setExternalAccounts] = useState<ExternalAccountInterface[]>([]);
  const [passwordEnabled, setPasswordEnabled] = useState<boolean>(false);
  const [sessions, setSessions] = useState<ClerkSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState<boolean>(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (!userId) {
      setError("User ID is missing.");
      setLoading(false);
      setSessionsLoading(false);
      return;
    }

    const fetchUser = async () => {
      setLoading(true);
      setError(null);
      setSaveSuccess(false);
      try {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: "Failed to fetch user data" }));
          throw new Error(errorData.error || `Error ${response.status}`);
        }
        const data: RawClerkUser = await response.json();

        const currentPublicMetadata = data.publicMetadata || {};
        const currentRole =
          typeof currentPublicMetadata?.["role"] === "string"
            ? currentPublicMetadata["role"]
            : "user";

        setUser({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          username: data.username || "",
          role: currentRole, // Keep role separate for now, or merge into publicMetadata string
          publicMetadata: JSON.stringify(currentPublicMetadata, null, 2),
          privateMetadata: JSON.stringify(data.privateMetadata || {}, null, 2),
          unsafeMetadata: JSON.stringify(data.unsafeMetadata || {}, null, 2),
        });
        setEmailAddresses(data.emailAddresses || []);
        setPrimaryEmailId(data.primaryEmailAddressId || null);
        setExternalAccounts(data.externalAccounts || []);
        setPasswordEnabled(data.passwordEnabled);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "An unknown error occurred while fetching user data."
        );
      }
      setLoading(false);
    };

    const fetchSessions = async () => {
      setSessionsLoading(true);
      setSessionsError(null);
      try {
        const response = await fetch(`/api/users/${userId}/sessions`);
        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: "Failed to fetch user sessions" }));
          throw new Error(errorData.error || `Error ${response.status}`);
        }
        const sessionsData: ClerkSession[] = await response.json();
        setSessions(sessionsData);
      } catch (err) {
        setSessionsError(
          err instanceof Error
            ? err.message
            : "An unknown error occurred while fetching sessions."
        );
      }
      setSessionsLoading(false);
    };

    fetchUser();
    fetchSessions();
  }, [userId]);

  // Handler for standard Input elements that use React.ChangeEvent
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUser((prevUser) => ({ ...prevUser, [name]: value }));
  };

  // Dedicated handler for TextArea components that provide value directly
  const handleTextAreaChange = (name: string, value: string) => {
    setUser((prevUser) => ({ ...prevUser, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId) return;

    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    let parsedPublicMetadata, parsedPrivateMetadata, parsedUnsafeMetadata;
    try {
      parsedPublicMetadata = JSON.parse(user.publicMetadata);
      // Ensure role is part of the publicMetadata if it was edited separately
      // Or, if role field is primary, merge it into the public metadata object
      if (
        user.role &&
        typeof parsedPublicMetadata === "object" &&
        parsedPublicMetadata !== null
      ) {
        parsedPublicMetadata.role = user.role;
      }

      parsedPrivateMetadata = JSON.parse(user.privateMetadata);
      parsedUnsafeMetadata = JSON.parse(user.unsafeMetadata);
    } catch (parseError) {
      setError(
        "Invalid JSON in metadata fields. Please correct and try again. Error: " +
          (parseError instanceof Error
            ? parseError.message
            : String(parseError))
      );
      setIsSaving(false);
      return;
    }

    const updatePayload = {
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      publicMetadata: parsedPublicMetadata,
      privateMetadata: parsedPrivateMetadata,
      unsafeMetadata: parsedUnsafeMetadata,
    };

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Failed to update user" }));
        throw new Error(errorData.error || `Error ${response.status}`);
      }
      setSaveSuccess(true);
      // Fetch user again to get the latest data including any backend modifications
      const updatedUserResponse = await fetch(`/api/users/${userId}`);
      const updatedUserData: RawClerkUser = await updatedUserResponse.json();
      const currentPublicMetadata = updatedUserData.publicMetadata || {};
      const currentRole =
        typeof currentPublicMetadata?.["role"] === "string"
          ? currentPublicMetadata["role"]
          : "user";
      setUser({
        firstName: updatedUserData.firstName || "",
        lastName: updatedUserData.lastName || "",
        username: updatedUserData.username || "",
        role: currentRole,
        publicMetadata: JSON.stringify(currentPublicMetadata, null, 2),
        privateMetadata: JSON.stringify(
          updatedUserData.privateMetadata || {},
          null,
          2
        ),
        unsafeMetadata: JSON.stringify(
          updatedUserData.unsafeMetadata || {},
          null,
          2
        ),
      });
      setEmailAddresses(updatedUserData.emailAddresses || []);
      setPrimaryEmailId(updatedUserData.primaryEmailAddressId || null);
      setExternalAccounts(updatedUserData.externalAccounts || []);
      setPasswordEnabled(updatedUserData.passwordEnabled);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unknown error occurred while updating user."
      );
    }
    setIsSaving(false);
  };

  if (loading) {
    return <div className="p-4">Loading user data...</div>;
  }

  return (
    <>
      <PageMeta
        title={`Edit User ${userId || ""}`}
        description={`Edit details for user ${userId || ""}`}
      />
      <PageBreadcrumb
        pageTitle={`Edit User: ${user.firstName} ${user.lastName}`.trim()}
      />

      <ComponentCard title="User Information">
        {error && (
          <div className="mb-4 p-3 text-red-700 bg-red-100 border border-red-300 rounded-md">
            Error: {error}
          </div>
        )}
        {saveSuccess && (
          <div className="mb-4 p-3 text-green-700 bg-green-100 border border-green-300 rounded-md">
            User updated successfully!
          </div>
        )}

        <Form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              type="text"
              id="firstName"
              name="firstName"
              value={user.firstName}
              onChange={handleChange}
              placeholder="Enter first name"
              disabled={isSaving}
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              type="text"
              id="lastName"
              name="lastName"
              value={user.lastName}
              onChange={handleChange}
              placeholder="Enter last name"
              disabled={isSaving}
            />
          </div>
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              type="text"
              id="username"
              name="username"
              value={user.username}
              onChange={handleChange}
              placeholder="Enter username"
              disabled={isSaving}
            />
          </div>
          <div>
            <Label htmlFor="role">Role (within Public Metadata)</Label>
            <Input
              type="text"
              id="role"
              name="role"
              value={user.role}
              onChange={handleChange}
              placeholder="Enter role (e.g., admin, user)"
              disabled={isSaving}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              This role is stored within the Public Metadata. You can also edit
              it directly in the JSON below.
            </p>
          </div>

          <div>
            <Label htmlFor="publicMetadata">Public Metadata (JSON)</Label>
            <TextArea
              value={user.publicMetadata}
              onChange={(value) =>
                handleTextAreaChange("publicMetadata", value)
              }
              rows={5}
              placeholder='{
  "role": "user",
  "theme": "dark"
}'
              disabled={isSaving}
              className="font-mono"
            />
          </div>
          <div>
            <Label htmlFor="privateMetadata">Private Metadata (JSON)</Label>
            <TextArea
              value={user.privateMetadata}
              onChange={(value) =>
                handleTextAreaChange("privateMetadata", value)
              }
              rows={5}
              placeholder='{
  "internal_notes": "VIP customer"
}'
              disabled={isSaving}
              className="font-mono"
            />
          </div>
          <div>
            <Label htmlFor="unsafeMetadata">Unsafe Metadata (JSON)</Label>
            <TextArea
              value={user.unsafeMetadata}
              onChange={(value) =>
                handleTextAreaChange("unsafeMetadata", value)
              }
              rows={5}
              placeholder='{
  "preferences_last_updated": 1678886400
}'
              disabled={isSaving}
              className="font-mono"
            />
          </div>

          <div className="flex items-center space-x-4">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 text-white bg-brand-500 rounded-lg hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-opacity-50 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
            <Link
              to="/users"
              className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Cancel
            </Link>
          </div>
        </Form>
      </ComponentCard>

      {/* Email Addresses Section */}
      <ComponentCard title="Email Addresses" className="mt-6">
        {emailAddresses.length > 0 ? (
          <ul className="space-y-3">
            {emailAddresses.map((email) => (
              <li key={email.id} className="p-3 border rounded-md dark:border-gray-700 flex justify-between items-center">
                <div>
                  <span className="font-medium dark:text-gray-200">{email.emailAddress}</span>
                  <div className="text-sm space-x-2">
                    <Badge color={email.verification.status === 'verified' ? 'success' : 'warning'}>
                      {email.verification.status}
                    </Badge>
                    {email.id === primaryEmailId && (
                      <Badge color='info'>Primary</Badge>
                    )}
                    {email.linkedTo && email.linkedTo.length > 0 && (
                       <Badge color='light'>Linked ({email.linkedTo.map(link => link.type).join(', ')})</Badge>
                    )}
                  </div>
                </div>
                {/* Placeholder for future actions */}
                {/* <button className="text-sm text-blue-500 hover:underline">Actions</button> */}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No email addresses found for this user.</p>
        )}
        {/* Placeholder for Add Email functionality */}
        {/* <div className="mt-4">
          <button className="px-4 py-2 text-sm text-white bg-blue-500 rounded-md hover:bg-blue-600">
            Add Email Address
          </button>
        </div> */}
      </ComponentCard>

      {/* Social Accounts Section */}
      <ComponentCard title="Social Accounts" className="mt-6">
        {externalAccounts.length > 0 ? (
          <ul className="space-y-3">
            {externalAccounts.map((account) => (
              <li key={account.id} className="p-3 border rounded-md dark:border-gray-700 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  {/* Basic icon placeholder, ideally replace with actual provider icons */}
                  <span className="text-xl">🌐</span> 
                  <div>
                    <span className="font-medium capitalize dark:text-gray-200">{account.provider}</span>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {account.emailAddress || account.identificationId}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {/* Placeholder for 'added date'. Need to check if this data is available in ExternalAccountInterface or needs formatting */}
                  {/* Added: {new Date(account.createdAt).toLocaleDateString()} - if createdAt exists */}
                  {/* <button className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">...</button> */}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No social accounts linked.</p>
        )}
      </ComponentCard>

      {/* Password Section */}
      <ComponentCard title="Password" className="mt-6">
        <div className="p-4 flex justify-between items-center">
          {passwordEnabled ? (
            <span className="text-gray-700 dark:text-gray-300">Password is set.</span>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">None</span>
          )}
          <button 
            onClick={() => alert('Set password functionality not yet implemented.')} 
            className="px-4 py-2 text-sm font-medium text-brand-500 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 focus:outline-none"
          >
            + Set password
          </button>
        </div>
      </ComponentCard>

      {/* Placeholder for Passkeys Section */}
      <ComponentCard title="Passkeys" className="mt-6">
         <p className="p-3 text-gray-500 dark:text-gray-400">Passkey management options will appear here.</p>
      </ComponentCard>

      {/* Devices Section */}
      <ComponentCard title="Devices (Active Sessions)" className="mt-6">
        {sessionsLoading && <p className="p-3 text-gray-500 dark:text-gray-400">Loading devices...</p>}
        {sessionsError && <p className="p-3 text-red-500">Error loading devices: {sessionsError}</p>}
        {!sessionsLoading && !sessionsError && sessions.length > 0 ? (
          <ul className="space-y-3">
            {sessions.map((session) => (
              <li key={session.id} className="p-3 border rounded-md dark:border-gray-700">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium dark:text-gray-200">
                      {session.latestActivity?.osName || 'Unknown OS'} 
                      {session.latestActivity?.isMobile ? ' (Mobile)' : ' (Desktop)'}
                    </span>
                    <Badge color={session.status === 'active' ? 'success' : 'warning'}>{session.status}</Badge>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {session.latestActivity?.browserName || 'Unknown Browser'} {session.latestActivity?.browserVersion || ''}
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                    <div>Last active: {new Date(session.lastActiveAt).toLocaleString()}</div>
                    <div>IP: {session.latestActivity?.ipAddress || 'N/A'}</div>
                    {session.latestActivity?.city && session.latestActivity?.country && (
                      <div>Location: {session.latestActivity.city}, {session.latestActivity.country}</div>
                    )}
                  </div>
                </div>
                {/* Placeholder for revoke action */}
                {/* <button className="mt-2 text-xs text-red-500 hover:underline">Revoke Session</button> */}
              </li>
            ))}
          </ul>
        ) : (
          !sessionsLoading && !sessionsError && <p className="text-gray-500 dark:text-gray-400">No active devices found for this user.</p>
        )}
      </ComponentCard>

    </>
  );
}

// Ideally, RawClerkUser and its sub-interfaces should be in a dedicated types file (e.g., src/types/clerk.ts)

// export type { RawClerkUser }; // This line should be removed
