import { db } from "../utils/firebase";
import { User } from "../models/User";

const USERS_REF = db.ref("users");

export async function createUser(user: User) {
  const newUserRef = USERS_REF.child(user.id);
  await newUserRef.set(user);
  return user;
}

export async function findUserByEmail(email: string) {
  const snapshot = await USERS_REF.orderByChild("email").equalTo(email).once("value");
  const data = snapshot.val();
  if (!data) return null;

  const uid = Object.keys(data)[0];
  return data[uid];
}
