<script lang="ts">
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Chapters — Koma</title></svelte:head>

<div class="section-head" style="margin-top:26px">
  <div>
    <h2>Step 3 — chapters</h2>
    <p class="muted small" style="margin:6px 0 0">
      Plan a chapter into pages of panels, then draw page by page. A chapter is
      finished when every page in it is approved.
    </p>
  </div>
</div>

{#if data.chapters.length === 0}
  <div class="card">
    <p class="muted">Read the story first — it has no chapters yet.</p>
  </div>
{:else}
  <div class="stack">
    {#each data.chapters as c, i}
      <a class="card chapter" href="/p/{data.project.id}/chapters/{c.id}">
        <div class="chapter-row">
          <div class="num">{String(i + 1).padStart(2, "0")}</div>
          <div class="body">
            <div class="row spread">
              <h3>{c.title}</h3>
              {#if c.status === "approved"}
                <span class="pill ok">approved</span>
              {:else if c.pages > 0}
                <span class="pill warn">{c.approved}/{c.pages} pages</span>
              {:else}
                <span class="pill">not planned</span>
              {/if}
            </div>
            <div class="muted small" style="margin-top:4px">
              {c.source.split(/\s+/).length.toLocaleString()} words
              {#if c.pages > 0}· {c.pages} pages{/if}
            </div>
            {#if c.pages > 0}
              <div class="bar">
                <div
                  style="width:{Math.round((c.approved / c.pages) * 100)}%"
                ></div>
              </div>
            {/if}
          </div>
          <div class="go">→</div>
        </div>
      </a>
    {/each}
  </div>
{/if}

<style>
  .chapter {
    display: block;
    padding: 16px 18px;
    transition: border-color 0.15s;
  }
  .chapter:hover {
    border-color: var(--line-strong);
  }
  .chapter-row {
    display: grid;
    grid-template-columns: 46px minmax(0, 1fr) 24px;
    gap: 14px;
    align-items: center;
  }
  .num {
    font-family: var(--serif);
    font-size: 1.5rem;
    color: var(--muted);
  }
  .bar {
    height: 4px;
    background: var(--line);
    border-radius: 999px;
    overflow: hidden;
    margin-top: 10px;
  }
  .bar div {
    height: 100%;
    background: var(--ok);
  }
  .go {
    color: var(--muted);
    font-size: 1.2rem;
  }
</style>
