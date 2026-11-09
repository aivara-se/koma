// Runs the checks a change is held to before handover. All must pass.
import { $ } from "bun";

// The `$app/*` types and `$lib` resolve through files this generates.
await $`bunx svelte-kit sync`;
await $`bunx svelte-check --tsconfig ./tsconfig.json --output human`;
await $`bun test`;
await $`bun run build`;
