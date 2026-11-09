<script lang="ts">
  import { LOCKED } from "$lib/config";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();
  const project = $derived(data.project);
</script>

<svelte:head>
  <title>{project.title} — Koma</title>
  {#if project.analysis_status === "running"}
    <meta http-equiv="refresh" content="3" />
  {/if}
</svelte:head>

{#if form?.message}
  <div class="err" style="margin-bottom:16px">{form.message}</div>
{/if}

<div class="grid cols-2 start" style="margin-top:26px">
  <section class="card">
    <div class="row spread">
      <h2>The story</h2>
      <span class="pill"
        >{project.story.split(/\s+/).length.toLocaleString()} words</span
      >
    </div>
    <div class="divider"></div>
    <div class="prose">{project.story}</div>
  </section>

  <aside class="stack">
    <section class="card">
      <div class="row spread">
        <h2>Step 1 — read</h2>
        {#if project.analysed_at}
          <span class="pill ok">read</span>
        {:else}
          <span class="pill accent">next</span>
        {/if}
      </div>
      <p class="muted small" style="margin-top:10px">
        One pass over the whole text. Koma lists every character and every
        place, and the variants the story shows: a haircut, a new coat, a market
        after the fire.
      </p>
      {#if project.analysed_at}
        <div class="note" style="margin-bottom:14px">
          Read by <strong>{project.analyser}</strong> on {new Date(
            project.analysed_at,
          ).toLocaleString()}. Re-reading replaces the catalog and every page.
        </div>
        <div class="row">
          <a class="btn primary" href="/p/{project.id}/catalog"
            >Open the catalog →</a
          >
          <form method="POST" action="?/analyse">
            <button class="btn ghost small" type="submit">Re-read</button>
          </form>
        </div>
      {:else if project.analysis_status === "running"}
        <div class="running">
          <div class="bar"><div></div></div>
          <p class="small">
            Reading the story with the model —
            <strong>{project.analysis_note || "starting"}</strong> parts. This page
            refreshes itself, and you can leave it.
          </p>
        </div>
      {:else}
        {#if project.analysis_status === "error"}
          <div class="err" style="margin-bottom:12px">
            The model read stopped: {project.analysis_note}
          </div>
        {/if}
        {#if data.model}
          <p class="small" style="color:var(--ok)">
            A model key is set. This pass uses it, in parts, beside the request.
          </p>
        {:else}
          <p class="small muted">
            No model key set — the built-in extractor reads this story. Set <span
              class="mono">KOMA_API_KEY</span
            >
            for a model pass; the catalog is identical in shape.
          </p>
        {/if}
        <form method="POST" action="?/analyse">
          <button class="btn primary" type="submit">Read the story →</button>
        </form>
      {/if}
    </section>

    <section class="card">
      <h2>Locked for v1</h2>
      <p class="muted small">
        These decide the look of every page and cannot be changed in the
        interface.
      </p>
      <ul class="locked">
        {#each LOCKED as l}
          <li><span>{l.label}</span><strong>{l.value}</strong></li>
        {/each}
      </ul>
      <p class="muted small" style="margin:0">
        They live in <span class="mono">src/lib/config.ts</span>, one file and
        one series.
      </p>
    </section>

    {#if project.analysed_at}
      <section class="card">
        <h2>What was found</h2>
        <div class="row" style="margin-top:10px">
          <span class="pill"
            >{data.progress.total -
              data.progress.approved -
              data.progress.excluded} to approve</span
          >
          <span class="pill">{data.progress.approved} approved</span>
          <a class="small" href="/p/{project.id}/catalog">Review →</a>
        </div>
      </section>
    {/if}
  </aside>
</div>

<style>
  .locked {
    list-style: none;
    padding: 0;
    margin: 10px 0 14px;
  }
  .locked li {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 8px 0;
    border-bottom: 1px solid var(--line);
    font-size: 0.88rem;
  }
  .locked li span {
    color: var(--muted);
  }
  .locked li:last-child {
    border-bottom: 0;
  }
</style>
