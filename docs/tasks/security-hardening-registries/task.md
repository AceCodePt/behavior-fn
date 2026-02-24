# Task: Security Hardening for Multi-Registry

## Goal

Implement comprehensive security measures for the multi-registry system to protect users from malicious behaviors and supply chain attacks.

## Context

**Why:** With multi-registry support, users can install behaviors from untrusted third-party sources. This introduces security risks:
- Arbitrary code execution from malicious behaviors
- Dependency confusion attacks
- Man-in-the-middle attacks on registry fetches
- Supply chain compromises

**Current State:** Basic `--dry-run` preview and warnings are implemented.

**Required For:** Production-ready multi-registry system.

## Requirements

### 1. Integrity Verification

- [ ] **Checksums/Hashes:** Validate file integrity using SHA-256 hashes
- [ ] **Signature Verification:** Support signed behaviors with cryptographic signatures
- [ ] **Trusted Registry List:** Maintain allowlist of verified registries

### 2. Content Security

- [ ] **Sandbox Preview:** Safe preview of behavior code before installation
- [ ] **Static Analysis:** Detect suspicious patterns (eval, network calls, file system access)
- [ ] **Dependency Scanning:** Warn about known vulnerable dependencies

### 3. Authentication & Authorization

- [ ] **Token Management:** Secure storage for registry credentials
- [ ] **OAuth Support:** Support OAuth flows for private registries
- [ ] **Certificate Pinning:** Verify SSL/TLS certificates for HTTPS registries

### 4. Audit & Transparency

- [ ] **Installation Log:** Track what was installed from where and when
- [ ] **Lockfile:** Record exact versions and hashes of installed behaviors
- [ ] **Diff View:** Show changes when updating behaviors

### 5. User Controls

- [ ] **Allowlist Mode:** Require explicit approval for new registries
- [ ] **Permission Levels:** Granular permissions (read-only, install, etc.)
- [ ] **Revocation:** Ability to revoke trust from compromised registries

## Architecture

### Proposed Components

```typescript
// src/security/verifier.ts
export class BehaviorVerifier {
  validateChecksum(content: string, expectedHash: string): boolean;
  verifySignature(content: string, signature: string, publicKey: string): boolean;
  scanForMaliciousPatterns(content: string): SecurityReport;
}

// src/security/audit-log.ts
export class AuditLog {
  logInstallation(behavior: string, registry: string, timestamp: Date): void;
  logUpdate(behavior: string, oldVersion: string, newVersion: string): void;
  getHistory(behavior: string): AuditEntry[];
}

// src/security/lockfile.ts
export class Lockfile {
  record(behavior: string, version: string, hash: string): void;
  verify(behavior: string): boolean;
  diff(oldLock: Lockfile, newLock: Lockfile): Diff[];
}
```

### Registry Response (Enhanced)

```json
{
  "name": "tooltip",
  "version": "1.0.0",
  "files": [
    {
      "path": "tooltip/behavior.ts",
      "content": "...",
      "hash": "sha256:abc123...",
      "signature": "..."
    }
  ],
  "signature": "...",
  "publicKey": "..."
}
```

## Implementation Phases

### Phase 1: Integrity Verification
- [ ] SHA-256 checksums for files
- [ ] Signature verification (optional)
- [ ] Registry allowlist system

### Phase 2: Content Security
- [ ] Static analysis for suspicious patterns
- [ ] Dependency vulnerability scanning
- [ ] Sandbox preview mode

### Phase 3: Audit System
- [ ] Installation audit log
- [ ] Lockfile generation
- [ ] Diff view for updates

### Phase 4: Advanced Authentication
- [ ] Secure credential storage
- [ ] OAuth support
- [ ] Certificate pinning

## Success Criteria

1. ✅ All files verified with checksums before installation
2. ✅ Audit log tracks all registry operations
3. ✅ Lockfile ensures reproducible installations
4. ✅ Static analysis warns about suspicious code
5. ✅ Users can allowlist/blocklist registries
6. ✅ Comprehensive security documentation

## Related Tasks

- **Blocked by:** [Multi-Registry Support](../multi-registry-support/task.md)
- **Blocks:** None
- **Related:** None

## Priority

**Medium** - Important for production use, but not blocking initial multi-registry rollout.

## Estimated Effort

**4-6 days** across all phases.
