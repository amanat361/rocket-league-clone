## Description
I encountered a segmentation fault crash while running my Rocket League clone project with Bun. The application crashed after running for approximately 349 seconds with a segmentation fault at address 0x0.

## Environment
- Bun Canary v1.2.6-canary.72 (ff974246)
- Linux x64 (WSL)
- WSL Kernel v5.15.167 | glibc v2.35

## Steps to Reproduce
1. Created a TypeScript-based game project (Rocket League clone)
2. Ran the project using `bun run index.ts`
3. After running for ~349 seconds, Bun crashed with a segmentation fault

## Error Message
```
Bun Canary v1.2.6-canary.72 (ff974246) Linux x64
WSL Kernel v5.15.167 | glibc v2.35
CPU: sse42 popcnt avx avx2
Args: "bun" "run" "index.ts"
Features: http_server jsc dev_server tsconfig 
Builtins: "bun:main" 
Elapsed: 349102ms | User: 329ms | Sys: 638ms
RSS: 0.02ZB | Peak: 0.31GB | Commit: 0.02ZB | Faults: 396

panic: Segmentation fault at address 0x0
oh no: Bun has crashed. This indicates a bug in Bun, not your code.
```

## Crash Report URL
https://bun.report/1.2.6/lr2ff97424Eggg0Bo5jzqE+xyQos7u/D6jr5/CqzxogDksllBA2AA

## Additional Context
The project is a 3D game using JavaScript/TypeScript. The crash occurred during normal execution of the game. I'm happy to provide more details or a minimal reproduction if needed.
