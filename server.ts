import express, { RequestHandler } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import os from 'os';
import getAllUsersHandler, {
  getUserByIdHandler,
  updateUserByIdHandler,
  deleteUserByIdHandler,
  getUserSessionsHandler
} from './src/api/users/index.js';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001; //  Port for the backend server

app.use(cors());
app.use(express.json());

// Type assertion for all handlers to ensure Express compatibility
const typedGetAllUsersHandler: RequestHandler = getAllUsersHandler as unknown as RequestHandler;
const typedGetUserByIdHandler: RequestHandler = getUserByIdHandler as unknown as RequestHandler;
const typedUpdateUserByIdHandler: RequestHandler = updateUserByIdHandler as unknown as RequestHandler;
const typedDeleteUserByIdHandler: RequestHandler = deleteUserByIdHandler as unknown as RequestHandler;
const typedGetUserSessionsHandler: RequestHandler = getUserSessionsHandler as unknown as RequestHandler;

// User API Routes
app.get('/api/users', typedGetAllUsersHandler);             // GET all users
app.get('/api/users/:userId', typedGetUserByIdHandler);    // GET a single user by ID
app.patch('/api/users/:userId', typedUpdateUserByIdHandler);  // PATCH update a user by ID
app.delete('/api/users/:userId', typedDeleteUserByIdHandler); // DELETE a user by ID
app.get('/api/users/:userId/sessions', typedGetUserSessionsHandler); // Add route for user sessions

const getNetworkAddress = () => {
  for (const interfaceDetails of Object.values(os.networkInterfaces())) {
    if (!interfaceDetails) continue;
    for (const details of interfaceDetails) {
      const { family, address, internal } = details;
      if (family === 'IPv4' && !internal) return address;
    }
  }
  return 'localhost';
};

app.listen(PORT, () => {
  const host = getNetworkAddress();
  console.log(`Backend server is running on http://${host}:${PORT}`);
  console.log('Ensure your CLERK_SECRET_KEY is set in your .env file.');
}); 
