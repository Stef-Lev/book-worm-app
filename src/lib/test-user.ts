// Development-only account that signs in without touching the database.
export const TEST_USER = {
  id: "000000000000000000000001",
  name: "Test User",
  email: "test@bookworm.dev",
  password: "test1234",
};

export function isTestLogin(email: string, password: string) {
  return (
    process.env.NODE_ENV !== "production" &&
    email === TEST_USER.email &&
    password === TEST_USER.password
  );
}
