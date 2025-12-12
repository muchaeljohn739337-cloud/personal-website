// Compatibility shim: some codebases import from './utils/decimals'
// This file re-exports helpers from './decimal' to prevent TS2307 errors.

export type { Decimal } from 'decimal.js';
export * from "./decimal";
