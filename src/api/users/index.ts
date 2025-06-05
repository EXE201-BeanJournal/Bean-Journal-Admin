import type { Request, Response } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';

// Define a more specific error type for potential Clerk errors
interface ClerkError {
    status?: number;
    errors?: Array<{ code: string; message: string; longMessage?: string; meta?: unknown }>;
    clerkError?: boolean;
    // Include other properties that Clerk errors might have
}

// GET /api/users - Get all users (existing handler)
export default async function getAllUsersHandler(
  req: Request,
  res: Response
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  try {
    if (!process.env.CLERK_SECRET_KEY) {
      throw new Error('CLERK_SECRET_KEY is not set.');
    }
    const users = await clerkClient.users.getUserList(); 
    // Note: The User object from clerkClient.users.getUserList() might be slightly different
    // from clerkClient.users.getUser(). Ensure your RawClerkUser interface handles this.
    // For instance, getUserList() might return a list of User objects, 
    // while updateUser/getUser might return a single User object with potentially more/different fields.
    // The JSON structure you provided earlier seems to be from getUserList().
    return res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching all users from Clerk:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return res.status(500).json({ error: errorMessage });
  }
}

// GET /api/users/:userId - Get a single user by ID
export async function getUserByIdHandler(req: Request, res: Response) {
  try {
    if (!process.env.CLERK_SECRET_KEY) {
      throw new Error('CLERK_SECRET_KEY is not set.');
    }
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    const user = await clerkClient.users.getUser(userId);
    return res.status(200).json(user);
  } catch (error) {
    console.error(`Error fetching user ${req.params.userId} from Clerk:`, error);
    const specificError = error as ClerkError;
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    if (errorMessage.toLowerCase().includes('not found') || specificError?.status === 404) {
        return res.status(404).json({ error: 'User not found' });
    }
    return res.status(500).json({ error: errorMessage });
  }
}

// PATCH /api/users/:userId - Update a user by ID
export async function updateUserByIdHandler(req: Request, res: Response) {
  try {
    if (!process.env.CLERK_SECRET_KEY) {
      throw new Error('CLERK_SECRET_KEY is not set.');
    }
    const { userId } = req.params;
    const  updateData = req.body; // e.g., { firstName: "New", lastName: "Name", publicMetadata: { role: "admin" } }

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'Request body cannot be empty for update.'});
    }

    // Clerk SDK expects camelCase keys, e.g., firstName, lastName, publicMetadata
    // Ensure your frontend sends data in this format.
    const updatedUser = await clerkClient.users.updateUser(userId, updateData);
    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error(`Error updating user ${req.params.userId} in Clerk:`, error);
    const specificError = error as ClerkError;
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    if (errorMessage.toLowerCase().includes('not found') || specificError?.status === 404) {
        return res.status(404).json({ error: 'User not found' });
    }
    return res.status(500).json({ error: errorMessage });
  }
}

// DELETE /api/users/:userId - Delete a user by ID
export async function deleteUserByIdHandler(req: Request, res: Response) {
  try {
    if (!process.env.CLERK_SECRET_KEY) {
      throw new Error('CLERK_SECRET_KEY is not set.');
    }
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    await clerkClient.users.deleteUser(userId);
    return res.status(204).send(); // 204 No Content for successful deletion
  } catch (error) {
    console.error(`Error deleting user ${req.params.userId} from Clerk:`, error);
    const specificError = error as ClerkError;
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
     if (errorMessage.toLowerCase().includes('not found') || specificError?.status === 404) {
        return res.status(404).json({ error: 'User not found' });
    }
    return res.status(500).json({ error: errorMessage });
  }
}

// GET /api/users/:userId/sessions - Get all active sessions for a user
export async function getUserSessionsHandler(req: Request, res: Response) {
  try {
    if (!process.env.CLERK_SECRET_KEY) {
      throw new Error('CLERK_SECRET_KEY is not set.');
    }
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    // TODO: Define a SessionInterface in src/types/clerk.ts based on Clerk's Session object structure
    const sessions = await clerkClient.sessions.getSessionList({ userId });
    return res.status(200).json(sessions);
  } catch (error) {
    console.error(`Error fetching sessions for user ${req.params.userId} from Clerk:`, error);
    const specificError = error as ClerkError; // Using existing ClerkError interface
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    if (specificError?.status === 404) { // Or based on error message if session not found isn't 404 by default
        return res.status(404).json({ error: 'User sessions not found or user not found' });
    }
    return res.status(500).json({ error: errorMessage });
  }
} 