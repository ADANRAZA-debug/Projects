// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS & DATA — PermissionCreep v1.0
// ─────────────────────────────────────────────────────────────────────────────

export const COMMON_SECRETS = [
  "secret","password","123456","qwerty","admin","letmein","welcome",
  "monkey","dragon","master","abc123","pass","test","1234","changeme",
  "default","root","token","key","jwt","auth","secure","mysecret","mykey",
  "supersecret","topsecret","privatekey","secretkey","jwtkey","jwtsecret",
  "your-256-bit-secret","your-secret","your_secret","shhhhh","keyboard cat",
  "secret123","password123","12345678","qwerty123","iloveyou","sunshine",
  "princess","football","charlie","donald","aa","bb","cc","dd","ee"
];

export const SCOPE_KNOWLEDGE_BASE = {
  // Google
  "https://www.googleapis.com/auth/gmail.readonly": { resource: "Email", level: 1, provider: "Google" },
  "https://www.googleapis.com/auth/gmail.send": { resource: "Email", level: 2, provider: "Google" },
  "https://www.googleapis.com/auth/gmail": { resource: "Email", level: 3, provider: "Google" },
  "https://www.googleapis.com/auth/drive.readonly": { resource: "Files", level: 1, provider: "Google" },
  "https://www.googleapis.com/auth/drive": { resource: "Files", level: 3, provider: "Google" },
  "https://www.googleapis.com/auth/cloud-platform": { resource: "Admin", level: 3, provider: "Google" },
  "https://www.googleapis.com/auth/userinfo.profile": { resource: "Users", level: 1, provider: "Google" },
  "https://www.googleapis.com/auth/userinfo.email": { resource: "Users", level: 1, provider: "Google" },
  // GitHub
  "repo": { resource: "Code", level: 3, provider: "GitHub" },
  "repo:status": { resource: "Code", level: 1, provider: "GitHub" },
  "repo:read": { resource: "Code", level: 1, provider: "GitHub" },
  "public_repo": { resource: "Code", level: 2, provider: "GitHub" },
  "read:user": { resource: "Users", level: 1, provider: "GitHub" },
  "user": { resource: "Users", level: 3, provider: "GitHub" },
  "user:email": { resource: "Users", level: 1, provider: "GitHub" },
  "admin:org": { resource: "Admin", level: 3, provider: "GitHub" },
  "delete_repo": { resource: "Code", level: 3, provider: "GitHub" },
  "write:packages": { resource: "Files", level: 2, provider: "GitHub" },
  "read:packages": { resource: "Files", level: 1, provider: "GitHub" },
  "gist": { resource: "Files", level: 2, provider: "GitHub" },
  "notifications": { resource: "Messaging", level: 1, provider: "GitHub" },
  "workflow": { resource: "Admin", level: 2, provider: "GitHub" },
  // AWS
  "s3:GetObject": { resource: "Files", level: 1, provider: "AWS" },
  "s3:PutObject": { resource: "Files", level: 2, provider: "AWS" },
  "s3:DeleteObject": { resource: "Files", level: 3, provider: "AWS" },
  "s3:*": { resource: "Files", level: 3, provider: "AWS" },
  "iam:*": { resource: "Admin", level: 3, provider: "AWS" },
  "ec2:*": { resource: "Admin", level: 3, provider: "AWS" },
  "lambda:*": { resource: "Admin", level: 3, provider: "AWS" },
  // Azure
  "https://graph.microsoft.com/.default": { resource: "Admin", level: 3, provider: "Azure" },
  "User.Read": { resource: "Users", level: 1, provider: "Azure" },
  "User.ReadWrite.All": { resource: "Users", level: 3, provider: "Azure" },
  "Mail.Read": { resource: "Email", level: 1, provider: "Azure" },
  "Mail.Send": { resource: "Email", level: 2, provider: "Azure" },
  "Files.ReadWrite.All": { resource: "Files", level: 3, provider: "Azure" },
  // Okta
  "okta.users.manage": { resource: "Users", level: 3, provider: "Okta" },
  "okta.users.read": { resource: "Users", level: 1, provider: "Okta" },
  "okta.apps.manage": { resource: "Admin", level: 3, provider: "Okta" },
  // Generic/OIDC
  "read": { resource: "General", level: 1, provider: "Generic" },
  "write": { resource: "General", level: 2, provider: "Generic" },
  "delete": { resource: "General", level: 3, provider: "Generic" },
  "read:profile": { resource: "Users", level: 1, provider: "Generic" },
  "read:email": { resource: "Users", level: 1, provider: "Generic" },
  "write:profile": { resource: "Users", level: 2, provider: "Generic" },
  "admin": { resource: "Admin", level: 3, provider: "Generic" },
  "admin:*": { resource: "Admin", level: 3, provider: "Generic" },
  "*:write": { resource: "Admin", level: 3, provider: "Generic" },
  "openid": { resource: "Users", level: 1, provider: "OIDC" },
  "profile": { resource: "Users", level: 1, provider: "OIDC" },
  "email": { resource: "Users", level: 1, provider: "OIDC" },
  "offline_access": { resource: "General", level: 2, provider: "OIDC" },
};

export const RESOURCE_CATEGORIES = ["Users", "Files", "Email", "Admin", "Messaging", "Code", "General"];

export const RESOURCE_COLORS = {
  Users: "#6366F1",
  Files: "#0EA5E9",
  Email: "#8B5CF6",
  Admin: "#EF4444",
  Messaging: "#F59E0B",
  Code: "#10B981",
  General: "#64748B"
};

export const SAMPLE_TOKENS = {
  algNone: "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ1c2VyXzEyMyIsInJvbGUiOiJhZG1pbiIsInNjb3BlIjoiKiIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20ifQ.",
  weakHS256: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
  overprivileged: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJzdmMtYWNjb3VudCIsImlzcyI6Imh0dHBzOi8vYXV0aC5leGFtcGxlLmNvbSIsImF1ZCI6Imh0dHBzOi8vYXBpLmV4YW1wbGUuY29tIiwiZXhwIjo5OTk5OTk5OTk5LCJpYXQiOjE3MDAwMDAwMDAsInNjb3BlIjoiYWRtaW46KiByZXBvIGRlbGV0ZV9yZXBvIGlhbToqIHMzOioiLCJqdGkiOiJhYmMxMjMifQ.fake-signature",
  secure: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtleS0yMDI0LTAxIn0.eyJzdWIiOiJ1c2VyXzQ1NiIsImlzcyI6Imh0dHBzOi8vYXV0aC5leGFtcGxlLmNvbSIsImF1ZCI6Imh0dHBzOi8vYXBpLmV4YW1wbGUuY29tIiwiZXhwIjoxNzEwMDAwMDAwLCJpYXQiOjE3MDk5OTY0MDAsIm5iZiI6MTcwOTk5NjQwMCwic2NvcGUiOiJyZWFkOnByb2ZpbGUgcmVhZDplbWFpbCIsImp0aSI6InVuaXF1ZS1pZC0xMjMifQ.fake-rs256-signature"
};
