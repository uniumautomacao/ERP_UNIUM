---
name: pac-solution-automation
description: Automates export/import of a Dataverse solution using pac CLI and service principal auth. Use when the user asks to export a solution, import a solution, move solutions between environments, or run pac solution export/import as managed.
---

# PAC Solution Automation

## Quick Start

Use the pac CLI binary at:

```
/Users/bschron/.dotnet/tools/pac
```

Target IDs (fixed):
- SolutionId: f5bd366c-66ed-f011-8406-000d3a891a53
- Source environment: b52cf2e9-4b61-e3d6-8fae-c290205ed8e5
- Target environment: 0fe81aea-6a5f-e327-8de3-1c56d9ac4eee
- Solution unique name: UNIUMCodeApps

## Credentials (service principal)

Do NOT store secrets in the repo. Use environment variables:

```
TENANT_ID=...
APP_ID=...
CLIENT_SECRET=...
```

Or certificate auth:

```
TENANT_ID=...
APP_ID=...
CERT_PATH=/path/to/cert.pfx
CERT_PASSWORD=...
```

## Workflow (managed export + import)

1) Auth in source environment:

```
/Users/bschron/.dotnet/tools/pac auth create --name "src-b52c-spn" \
  --environment b52cf2e9-4b61-e3d6-8fae-c290205ed8e5 \
  --tenant "$TENANT_ID" \
  --applicationId "$APP_ID" \
  --clientSecret "$CLIENT_SECRET"
```

2) Export managed solution to /tmp:

```
/Users/bschron/.dotnet/tools/pac solution export \
  --environment b52cf2e9-4b61-e3d6-8fae-c290205ed8e5 \
  --name UNIUMCodeApps \
  --path "/tmp/UNIUMCodeApps_managed.zip" \
  --managed \
  --overwrite
```

3) Auth in target environment:

```
/Users/bschron/.dotnet/tools/pac auth create --name "tgt-0fe8-spn" \
  --environment 0fe81aea-6a5f-e327-8de3-1c56d9ac4eee \
  --tenant "$TENANT_ID" \
  --applicationId "$APP_ID" \
  --clientSecret "$CLIENT_SECRET"
```

4) Import and publish:

```
/Users/bschron/.dotnet/tools/pac solution import \
  --environment 0fe81aea-6a5f-e327-8de3-1c56d9ac4eee \
  --path "/tmp/UNIUMCodeApps_managed.zip" \
  --publish-changes
```

5) Verify in target:

```
/Users/bschron/.dotnet/tools/pac solution list \
  --environment 0fe81aea-6a5f-e327-8de3-1c56d9ac4eee \
  --json
```

## Optional: Deployment settings

If needed, generate and fill a settings file:

```
/Users/bschron/.dotnet/tools/pac solution create-settings \
  --solution-zip "/tmp/UNIUMCodeApps_managed.zip" \
  --settings-file "/tmp/UNIUMCodeApps.settings.target.json"
```

Then import with:

```
--settings-file "/tmp/UNIUMCodeApps.settings.target.json"
```

## Troubleshooting

- If auth fails, check SPN permissions in both environments.
- If token expires, re-run pac auth create.
- If SPN is not available, fall back to interactive auth:
  `pac auth create --environment <env-id> --deviceCode`

## Additional resources

- See `reference.md` for environment variable and certificate examples.
