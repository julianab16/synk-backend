import { Request, Response } from 'express';
import GlobalController from './GlobalController';
import UserDAO from '../dao/UserDAO';
import { User } from '../models/User';
import { auth, db } from '../config/firebase';
import * as admin from 'firebase-admin';
import fetch from 'node-fetch';

/**
 * UserController - handles register, login (email/password), and social login.
 *
 * Notes:
 * - Passwords are handled by Firebase Authentication; do NOT store plaintext passwords in Firestore.
 * - For email/password login the server uses Firebase Auth REST endpoint; set FIREBASE_API_KEY in .env.
 * - For social login the client must perform provider sign-in (Google/Facebook) with Firebase client SDK
 *   and send the resulting idToken to the server for verification.
 */
class UserController extends GlobalController<User> {
  constructor() {
    super(UserDAO);
  }

  /**
   * Register a new user:
   * - creates Firebase Auth user (email + password)
   * - creates a Firestore profile document keyed by the auth uid
   *
   * Body: { firstName, lastName, email, password, age?, photo? }
   */
  async register(req: Request, res: Response): Promise<any> {
    try {
      const { firstName, lastName, email, password, age, photo } = req.body;
      if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Check if auth user already exists
      try {
        await auth.getUserByEmail(email);
        return res.status(409).json({ message: 'Email already registered' });
      } catch (err: any) {
        if (err.code && err.code !== 'auth/user-not-found') {
          console.error('Error checking user existence:', err);
          return res.status(500).json({ message: 'Internal error' });
        }
        // user not found -> continue
      }

      // Create in Firebase Authentication (Firebase hashes the password)
      const created = await auth.createUser({
        email,
        password,
        displayName: `${firstName} ${lastName}`,
      });

      const uid = created.uid;
      const now = admin.firestore.FieldValue.serverTimestamp();

      // Create Firestore profile (no password)
      const profile = {
        id: uid,
        firstName,
        lastName,
        email,
        age: typeof age === 'number' ? age : Number(age) || 0,
        photo: photo ?? '',
        oauth: [],
        createdAt: now,
        updatedAt: now,
        status: 'offline',
      } as FirebaseFirestore.DocumentData;

      await db.collection('users').doc(uid).set(profile);

      return res.status(201).json({
        message: 'User registered',
        user: { id: uid, firstName, lastName, email },
      });
    } catch (error: any) {
      console.error('Register error:', error);
      return res.status(500).json({ message: error?.message ?? 'Registration failed' });
    }
  }

  /**
   * Login with email and password.
   * Uses Firebase REST API (requires FIREBASE_API_KEY).
   * Body: { email, password }
   */
async login(req: Request, res: Response): Promise<any> {
    try {
      // Prefer client-provided idToken (client-side sign-in recommended)
      const { idToken, email, password } = req.body;

      if (idToken && typeof idToken === 'string') {
        try {
          const decoded = await auth.verifyIdToken(idToken);
          const uid = decoded.uid;
          const profile = await UserDAO.getById(uid);
          return res.status(200).json({ message: 'Authentication successful', user: profile ?? { id: uid, email: decoded.email }, token: idToken });
        } catch (err: any) {
          console.error('verifyIdToken failed:', err);
          return res.status(401).json({ message: 'Invalid or expired token' });
        }
      }

      // Fallback: email/password sign-in via Firebase REST (requires FIREBASE_API_KEY)
      if (!email || !password) {
        return res.status(400).json({ message: 'Provide idToken or email and password' });
      }

      const apiKey = (process.env.FIREBASE_API_KEY || '').trim();
      if (!apiKey) {
        console.error('FIREBASE_API_KEY not defined');
        return res.status(500).json({ message: 'Server authentication not configured (FIREBASE_API_KEY missing)' });
      }

      const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        console.error('Firebase REST signInWithPassword response:', data);
        // Map common Firebase REST error codes to friendly messages
        const code = data?.error?.message;
        const friendly =
          code === 'EMAIL_NOT_FOUND' || code === 'INVALID_PASSWORD' || code === 'INVALID_LOGIN_CREDENTIALS'
            ? 'Invalid email or password'
            : code === 'USER_DISABLED'
            ? 'User account disabled'
            : 'Invalid email or password';
        return res.status(401).json({ message: friendly });
      }

      const returnedIdToken = data?.idToken;
      const uid = data?.localId;
      if (!returnedIdToken || typeof returnedIdToken !== 'string') {
        console.error('Login: no idToken returned from Firebase REST API', data);
        return res.status(500).json({ message: 'Authentication failed (no token returned)' });
      }

      // verify token server-side
      try {
        await auth.verifyIdToken(returnedIdToken);
      } catch (err: any) {
        console.error('Token verification failed:', err);
        return res.status(401).json({ message: 'Invalid authentication token' });
      }

      const profile = uid ? await UserDAO.getById(uid) : null;
      const userResponse = profile ?? { id: uid ?? null, email };

      return res.status(200).json({
        message: 'Authentication successful',
        user: userResponse,
        token: returnedIdToken,
        expiresIn: Number(data?.expiresIn) || undefined,
      });
    } catch (error: any) {
      console.error('Login error:', error);
      if (!res.headersSent) {
        return res.status(500).json({ message: 'An error occurred during authentication' });
      }
      return;
    }
  }
  
  /**
   * Social login - client must sign in with Google/Facebook using Firebase client SDK
   * and send the resulting idToken to this endpoint.
   * Body: { idToken }
   */
  async socialLogin(req: Request, res: Response): Promise<any> {
    try {
      const { idToken } = req.body;
      if (!idToken) {
        return res.status(400).json({ message: 'idToken is required' });
      }

      const decoded = await auth.verifyIdToken(idToken);
      const uid = decoded.uid;
      const email = decoded.email ?? '';
      const displayName = decoded.name ?? '';
      const picture = decoded.picture ?? '';
      const provider = decoded.firebase?.sign_in_provider ?? 'social';

      // Ensure profile exists
      let profile = await UserDAO.getById(uid);
      if (!profile) {
        const [firstName = '', lastName = ''] = displayName.split(' ');
        const now = admin.firestore.FieldValue.serverTimestamp();
        const newProfile = {
          id: uid,
          firstName,
          lastName,
          email,
          age: 0,
          photo: picture,
          oauth: [provider],
          createdAt: now,
          updatedAt: now,
          status: 'offline',
        } as FirebaseFirestore.DocumentData;

        await db.collection('users').doc(uid).set(newProfile);
        profile = await UserDAO.getById(uid);
      }

      return res.status(200).json({ message: 'OK', user: profile, token: idToken });
    } catch (error: any) {
      console.error('socialLogin error:', error);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  }

  /**
   * GET /users/me - returns the profile for the authenticated user
   */
  async me(req: Request, res: Response): Promise<any> {
    try {
      // Auth middleware attaches user.uid to req.user
      const anyReq: any = req;
      const uid = anyReq.user?.uid as string | undefined;
      if (!uid) return res.status(401).json({ message: 'Unauthorized' });
      // debug log: show requested uid
      console.log('[UserController.me] requested uid=', uid);
      const profile = await UserDAO.getById(uid);
      console.log('[UserController.me] profile lookup ->', profile ? `found id=${profile.id}` : 'not found');
      if (!profile) return res.status(404).json({ message: 'Profile not found' });
      return res.status(200).json(profile);
    } catch (err: any) {
      console.error('me error', err);
      return res.status(500).json({ message: 'Failed to get profile' });
    }
  }

  /**
   * Override delete to handle cases where Firestore doc id != auth uid.
   * Tries to delete by provided id (usually the uid). If not found, falls back
   * to finding the document by the authenticated user's email and deleting that.
   */
  async delete(req: Request, res: Response): Promise<any> {
    try {
      const id = req.params.id;
      console.log('[UserController.delete] requested id=', id);

      // Try direct delete by id (GlobalDAO.delete now returns boolean)
      const daoAny: any = this.dao;
      const deleted = await daoAny.delete(id);
      if (deleted) {
        // If the requester is the same user, also remove the Firebase Auth user.
        try {
          const anyReq: any = req;
          const requesterUid = anyReq.user?.uid as string | undefined;
          const allowAdmin = String(process.env.ALLOW_ADMIN_DELETE || '').toLowerCase() === 'true';
          if (requesterUid === id || allowAdmin) {
            try {
              await auth.deleteUser(id);
              console.log('[UserController.delete] deleted auth user uid=', id);
            } catch (e: any) {
              console.error('[UserController.delete] failed to delete auth user', id, e?.message ?? e);
              // continue — profile deleted, but auth user deletion failed
            }
          } else {
            console.log('[UserController.delete] skipping auth.deleteUser for uid=', id, ' requester=', requesterUid);
          }
        } catch (e) {
          console.error('[UserController.delete] auth deletion check failed', e);
        }

        return res.sendStatus(204);
      }

      // Fallback: if auth middleware provided an email, find the doc by email
      const anyReq: any = req;
      const email = anyReq.user?.email as string | undefined;
      if (email && typeof daoAny.findByEmail === 'function') {
        console.log('[UserController.delete] fallback: searching by email=', email);
        const found = await daoAny.findByEmail(email);
        if (found && found.id) {
          console.log('[UserController.delete] found doc by email id=', found.id);
          const deleted2 = await daoAny.delete(found.id);
          if (deleted2) return res.sendStatus(204);
        }
      }

      return res.status(404).json({ message: 'Not found' });
    } catch (err: any) {
      console.error('[UserController.delete] error', err);
      return res.status(500).json({ message: 'Delete failed' });
    }
  }
}

export default new UserController();