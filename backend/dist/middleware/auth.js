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
exports.authorize = exports.protect = exports.requireRole = exports.requireAuth = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("../config/auth");
/**
 * Global authentication middleware
 *
 * Reads JWT from cookie, verifies it, and attaches user info to req.user.
 * Does NOT reject requests if token is missing/invalid - allows public endpoints.
 * Use requireAuth or requireRole to enforce authentication.
 */
const authenticate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Read token from cookie
        const token = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a[auth_1.authConfig.cookieName];
        if (!token) {
            req.user = null;
            return next();
        }
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, auth_1.authConfig.jwtSecret);
        // Attach user info to request
        req.user = {
            id: decoded.userId,
            role: decoded.role,
            email: decoded.email,
        };
        next();
    }
    catch (error) {
        // Invalid token - treat as unauthenticated
        req.user = null;
        next();
    }
});
exports.authenticate = authenticate;
/**
 * Middleware to require authentication
 *
 * Returns 401 if user is not authenticated.
 */
const requireAuth = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            error: 'Authentication required',
            message: 'You must be logged in to access this resource',
        });
        return;
    }
    next();
};
exports.requireAuth = requireAuth;
/**
 * Middleware to require specific role(s)
 *
 * Returns 403 if user doesn't have one of the required roles.
 * Automatically requires authentication.
 */
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                error: 'Authentication required',
                message: 'You must be logged in to access this resource',
            });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                error: 'Insufficient permissions',
                message: `This resource requires one of the following roles: ${roles.join(', ')}`,
                userRole: req.user.role,
            });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
/**
 * Legacy middleware for backward compatibility
 * @deprecated Use requireAuth instead
 */
exports.protect = exports.requireAuth;
/**
 * Legacy middleware for backward compatibility
 * @deprecated Use requireRole instead
 */
const authorize = (...roles) => {
    return (0, exports.requireRole)(...roles);
};
exports.authorize = authorize;
