// In-memory store for OTPs. 
// NOTE: This is not suitable for production. In a production environment,
// you should use a more persistent and secure storage like Redis or a database table.
export const otpStore: { [key: string]: { otp: string, expires: number } } = {}; 