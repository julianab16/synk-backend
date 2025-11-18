export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  photo?: string;
  password: string;
  oauth?: string[];
  createdAt: number;
  updatedAt: number;
  status: "online" | "offline";
}
