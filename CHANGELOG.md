# Changelog

All notable changes to the AvraAPI Node.js SDK are documented in this file.

This project follows [Semantic Versioning](https://semver.org/) and the
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format.

## [Unreleased]

## [1.2.0] - 2026-10-01

### Added

- Added the complete typed Universal Payment Gateway lifecycle for trusted
  Node.js backends: availability, checkout creation, server-side completion,
  callback verification, and sensitive callback verification.
- Added gateway-specific services for PayHere advanced payment operations,
  MarxPay, OnePay, KOKO, PayPlus, and WebXPay, plus safe callback/return
  payload wrappers and Payment Elements/redirect presentation helpers.
- Added one-shot `withPrivacyMode()` support across provider services. It
  sends `X-Privacy-Mode: 1` for the next SDK request only, then clears the
  setting automatically.
- Added verified ESM, CommonJS, and TypeScript package-consumer coverage,
  together with offline contract tests for provider services and UPG.

### Changed

- Aligned the public Node.js SDK contract, typed results, gateway environment
  selection, reconciliation options, error mapping, and server-only UPG safety
  boundary with the PHP SDK v1.5.2 contract.
- Added a private, opt-in Development-sandbox testbed for read-only gateway
  reconciliation of existing transactions. It never creates or changes a
  payment during release validation.

## [1.1.2]

### Added

- Added Currency Service and Security Service functions.

## [1.0.2]

### Added

- Added Base64 HTML-to-PDF conversion support.

## [1.0.0]

### Added

- Initial public release with the base microservice integrations.
