import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { createUser, findUserByEmail } from "../dao/UserDAO";
import { User } from "../models/User";
import { v4 as uuidv4 } from "uuid";

export async function register(req: Request, res: Response) {
  try {
    const { firstName, lastName, email, password, age, photo } = req.body;

    if (!firstName || !lastName || !email || !password)
      return res.status(400).json({ error: "Missing fields" });

    const existing = await findUserByEmail(email);
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const id = uuidv4();
    const now = Date.now();

    const newUser: User = {
      id,
      firstName,
      lastName,
      email,
      age: typeof age === "number" ? age : 0,
      photo,
      password: hashed,
      oauth: [],
      createdAt: now,
      updatedAt: now,
      status: "offline",
    };

    await createUser(newUser);

    return res.json({
      message: "User created",
      user: { id, firstName, lastName, email },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal error" });
  }
}
