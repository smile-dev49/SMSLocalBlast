# @sms-localblast/config

Shared engineering configuration for the SMS LocalBlast monorepo.

## Contents

- `tsconfig/base.json` — strict TypeScript defaults extended by apps and libraries.

## Usage

In a package `tsconfig.json`:

```json
{
  "extends": "@sms-localblast/config/tsconfig/base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```
