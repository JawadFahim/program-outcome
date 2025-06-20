import { jwtVerify} from 'jose';
import Cookies from 'js-cookie';

const SECRET_KEY = process.env.JWT_SECRET || 'a-secure-and-long-secret-key-for-testing';
const JWT_SECRET = new TextEncoder().encode(SECRET_KEY);

const TEACHER_TOKEN_NAME = 'auth_token';
const ADMIN_TOKEN_NAME = 'admin_auth_token';

// --- Teacher JWT Functions ---

/**
 * Stores the authentication token in a browser cookie.
 * @param token The JWT string.
 */
export const setAuthTokenCookie = (token: string): void => {
    Cookies.set(TEACHER_TOKEN_NAME, token, {
        expires: 1 / 48, // Expires in 30 minutes
        secure: process.env.NODE_ENV === 'production',
        path: '/',
    });
};

/**
 * Retrieves the authentication token from the browser cookie.
 * @returns The token string, or undefined if not found.
 */
export const getAuthTokenCookie = (): string | undefined => {
    return Cookies.get(TEACHER_TOKEN_NAME);
};

/**
 * Removes the authentication token cookie.
 */
export const removeAuthTokenCookie = (): void => {
    Cookies.remove(TEACHER_TOKEN_NAME);
};

/**
 * A convenience function to get the teacherId directly from the token in the cookie.
 * This safely decodes the token on the client-side without verification,
 * as verification is handled by the server-side middleware.
 * @returns The teacher ID string if the user is authenticated, otherwise null.
 */
export const getTeacherIdFromAuth = (): string | null => {
    const token = getAuthTokenCookie();
    if (!token) return null;

    try {
        const claims = JSON.parse(atob(token.split('.')[1]));
        return claims.teacherId || null;
    } catch  {
        console.log("Error decoding JWT");
        return null;
    }
};


// --- Admin JWT Functions ---

export const setAdminAuthTokenCookie = (token: string): void => {
    Cookies.set(ADMIN_TOKEN_NAME, token, {
        expires: 1 / 48, // Expires in 30 minutes
        secure: process.env.NODE_ENV === 'production',
        path: '/',
    });
};

export const getAdminAuthTokenCookie = (): string | undefined => {
    return Cookies.get(ADMIN_TOKEN_NAME);
};

export const removeAdminAuthTokenCookie = (): void => {
    Cookies.remove(ADMIN_TOKEN_NAME);
};

// --- General JWT Verification (for Middleware) ---

export const verifyJwt = async (token: string) => {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload;
    } catch (e) {
        console.log("Error verifying JWT", e);
        return null;
    }
}; 