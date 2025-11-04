# BIAN Banking API Mapper

**A BIAN-aligned architecture analysis tool that maps an enterprise's existing REST APIs to BIAN Service Domains, detects overlapping capabilities, and visualises how banking functionality could be reorganised into standardised service boundaries.**

Built as a developer/architect tool — not a banking application.

[![tests](https://img.shields.io/badge/tests-33%20passing-brightgreen)](#testing)
[![build](https://img.shields.io/badge/build-api%20%2B%20web%20clean-brightgreen)](#quickstart)
[![BIAN](https://img.shields.io/badge/BIAN%20Service%20Landscape-14.0.0-blue)](#bian-grounding--data-provenance)
[![licence](https://img.shields.io/badge/licence-MIT-lightgrey)](#licence--attribution)

> **This is an independent proof-of-concept.** It is **not** affiliated with,
> endorsed by, or certified by BIAN. Every score, percentage and confidence
> band shown is this tool's own analytical metric — never a BIAN
> certification, conformance score, or compliance measure.
> See [BIAN: what it is and why this project uses it](#bian-what-it-is-and-why-this-project-uses-it).

---

## Table of contents

- [Purpose — the problem this solves](#purpose--the-problem-this-solves)
- [BIAN: what it is and why this project uses it](#bian-what-it-is-and-why-this-project-uses-it)
- [What the tool actually does](#what-the-tool-actually-does)
- [Features](#features)
- [How it works](#how-it-works)
- [Tech stack](#tech-stack)
- [Architecture & project layout](#architecture--project-layout)
- [Quickstart](#quickstart)
- [Demo walkthrough](#demo-walkthrough)
- [API reference](#api-reference)
- [BIAN grounding & data provenance](#bian-grounding--data-provenance)
- [Testing](#testing)
- [Scope: what this deliberately is not](#scope-what-this-deliberately-is-not)
- [Limitations](#limitations)
- [Licence & attribution](#licence--attribution)

---

## Purpose — the problem this solves

A mid-size bank accumulates hundreds of APIs. Each team builds its own, in
its own vocabulary, on its own timeline:

```
