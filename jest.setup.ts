// Global Jest setup — runs once before all tests.
// Sets dummy env vars so modules that read process.env don't blow up.
process.env.JWT_SECRET = 'test-secret-32-chars-minimum-len!';
process.env.FIREBASE_PROJECT_ID = 'test-project';
process.env.FIREBASE_CLIENT_EMAIL = 'test@test-project.iam.gserviceaccount.com';
process.env.FIREBASE_PRIVATE_KEY = '-----BEGIN RSA PRIVATE KEY-----\ntest\n-----END RSA PRIVATE KEY-----';
