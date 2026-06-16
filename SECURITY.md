# Security Policy

## Reporting a vulnerability

If you find a security issue in Aperture, please report it privately rather than opening a public issue.

**Preferred:** [GitHub Security Advisories](https://github.com/kioie/aperture/security/advisories/new) on this repository.

**Alternative:** email **security@kioie.dev** with a description, steps to reproduce, and impact if known.

We aim to acknowledge reports within a few business days and will coordinate disclosure once a fix is available.

## Supported versions

Security fixes are applied to the latest release on npm (`@kioie/aperture`). Older versions are not routinely backported unless the issue is critical.

## npm publishing

Releases are published to npm under the `@kioie` scope. The maintainer account requires **npm two-factor authentication (2FA)** for publishes and other sensitive account actions.

New versions are only published after `npm test`, `npm run build`, and eval checks pass locally (`prepublishOnly`).

## Scope

Aperture indexes and reads source files under a repository root you provide. It does not execute code, run shell commands, or fetch remote content. Path handling is constrained to stay within the declared repository root. Report traversal or read-beyond-root issues here; general agent or MCP client concerns belong with those tools.
