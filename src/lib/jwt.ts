import Cookies from 'js-cookie';
import { decodeJwt } from 'jose';

// --- Cookie Management ---

const TOKEN_COOKIE_NAME = 'auth_token';

/**
 * Stores the authentication token in a browser cookie.
 * @param token The JWT string.
 */
export const setAuthTokenCookie = (token: string): void => {
    // Expires in 30 minutes.
    Cookies.set(TOKEN_COOKIE_NAME, token, { expires: 1 / 48, secure: process.env.NODE_ENV === 'production' });
};

/**
 * Retrieves the authentication token from the browser cookie.
 * @returns The token string, or undefined if not found.
 */
export const getAuthTokenCookie = (): string | undefined => {
    return Cookies.get(TOKEN_COOKIE_NAME);
};

/**
 * Removes the authentication token cookie.
 */
export const removeAuthTokenCookie = (): void => {
    Cookies.remove(TOKEN_COOKIE_NAME);
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
        const payload = decodeJwt(token);
        return payload.teacherId as string || null;
    } catch (error) {
        console.error("Failed to decode token:", error);
        return null;
    }
}; 