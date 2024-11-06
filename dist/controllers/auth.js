"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = __importDefault(require("../db/client"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const JWT_SECRET = process.env.JWT_SECRET;
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, username, password, firstName, lastName, userType, Sweetness, Spiciness, Dish, Sourness } = req.body;
        const existingUser = yield client_1.default.user.findFirst({
            where: { OR: [{ email }, { username }] }
        });
        if (existingUser) {
            return res.status(400).json({ error: "Email or Username already taken" });
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const user = yield client_1.default.user.create({
            data: {
                email,
                username,
                password: hashedPassword,
                firstName,
                lastName,
                Type: userType,
                Sweetness,
                Spiciness,
                Dish,
                Sourness
            }
        });
        res.status(201).json({ message: "User registered successfully", user });
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const user = yield client_1.default.user.findUnique({
            where: { email }
        });
        if (!user) {
            return res.status(400).json({ error: "Invalid email or password" });
        }
        // Check password
        const isPasswordValid = yield bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: "Invalid email or password" });
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN,
        });
        res.json({ message: "Login successful", token });
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.login = login;
