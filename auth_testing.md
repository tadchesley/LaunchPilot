# Emergent Auth Testing Playbook for LaunchPilot

## Test Credentials
Stored at /app/memory/test_credentials.md

## Quick Setup — create a test user/session in MongoDB
```bash
mongosh "mongodb://localhost:27017/test_database" --eval "
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: userId,
  email: 'test.user.' + Date.now() + '@example.com',
  name: 'Test User',
  picture: 'https://via.placeholder.com/150',
  auth_provider: 'google',
  created_at: new Date()
});
db.user_sessions.insertOne({
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
});
print('Session token: ' + sessionToken);
print('User ID: ' + userId);
"
```

## API tests
```bash
API=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)
curl -s -X GET "$API/api/auth/me" -H "Authorization: Bearer SESSION_TOKEN"
```

## Browser test
Set cookie `session_token` then navigate to /dashboard.
