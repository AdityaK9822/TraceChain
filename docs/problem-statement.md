# Problem Statement

**SIH PS 26183** — Crypto Fraud Wallet Attribution System

## The gap

When a cyber fraud victim reports a scammer's crypto wallet address, investigators
have no fast way to find out which exchange the stolen funds ended up in. Manually
walking a blockchain explorer hop by hop is slow, expert-only, and doesn't scale to
the volume of complaints coming through NCRP/SAHYOG.

## What we're building

Given a reported wallet address, automatically trace its outgoing transactions
hop-by-hop and identify the exchange (VASP) wallet where funds were deposited -
visualized as a live fund-flow graph, ending in a one-click investigation report.

This turns a manual, expert-only process into an instant, visual tool any
investigator can run.

## Why this matters

Once an exchange deposit is identified, law enforcement can issue a legal request
(production order / MLAT) to that exchange for the KYC records behind the deposit
wallet - the step that actually identifies a suspect. Today, most complaints stall
before ever reaching that step.

See [roadmap.md](./roadmap.md) for what's intentionally out of scope for v1.
