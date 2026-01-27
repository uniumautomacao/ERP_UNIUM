---
title: PAC Solution Automation Reference
---

# Reference

## Environment variable setup (shell)

```
export TENANT_ID="00000000-0000-0000-0000-000000000000"
export APP_ID="11111111-1111-1111-1111-111111111111"
export CLIENT_SECRET="***"
```

## Certificate auth example

```
export TENANT_ID="00000000-0000-0000-0000-000000000000"
export APP_ID="11111111-1111-1111-1111-111111111111"
export CERT_PATH="/secure/path/spn.pfx"
export CERT_PASSWORD="***"

/Users/bschron/.dotnet/tools/pac auth create --name "src-b52c-spn" \
  --environment b52cf2e9-4b61-e3d6-8fae-c290205ed8e5 \
  --tenant "$TENANT_ID" \
  --applicationId "$APP_ID" \
  --certificateDiskPath "$CERT_PATH" \
  --certificatePassword "$CERT_PASSWORD"
```

## Optional import flags

```
--async --max-async-wait-time 120
--skip-lower-version
--force-overwrite
```

## Notes

- Keep solution artifacts in /tmp to avoid repo churn.
- Do not store secrets in git. Use env vars or a secret manager.
