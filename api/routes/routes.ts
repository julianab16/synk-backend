import { Router } from "express";
import { register } from "../controllers/UserController";

const router = Router();

router.post("/register", register);

export default router;
