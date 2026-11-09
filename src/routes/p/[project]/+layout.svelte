<script lang="ts">
  import { page } from "$app/state";
  import type { LayoutData } from "./$types";

  let {
    data,
    children,
  }: { data: LayoutData; children: import("svelte").Snippet } = $props();

  const tab = (path: string) => {
    const base = `/p/${data.project.id}`;
    if (path === "")
      return page.url.pathname === base || page.url.pathname === `${base}/`;
    return page.url.pathname.startsWith(`${base}${path}`);
  };

  const planned = $derived(data.chapters.some((c) => c.pages > 0));
  const pages = $derived(data.chapters.reduce((n, c) => n + c.pages, 0));
  const approved = $derived(data.chapters.reduce((n, c) => n + c.approved, 0));

  const step = $derived(
    !data.project.analysed_at
      ? 1
      : !data.project.catalog_approved_at
        ? 2
        : approved < pages || pages === 0
          ? planned
            ? 4
            : 3
          : 4,
  );
</script>

<div class="shell">
  <header class="topbar">
    <a class="wordmark" href="/"><span class="dot"></span> Koma</a>
    <nav class="tabs">
      <a href="/p/{data.project.id}" class:active={tab("")} class="tab"
        >1 · Story</a
      >
      <a
        href="/p/{data.project.id}/catalog"
        class:active={tab("/catalog")}
        class="tab">2 · Catalog</a
      >
      {#if data.project.catalog_approved_at}
        <a
          href="/p/{data.project.id}/chapters"
          class:active={tab("/chapters")}
          class="tab">3 · Pages</a
        >
      {:else}
        <span class="tab off" title="Lock the catalog first">3 · Pages</span>
      {/if}
    </nav>
  </header>

  <div class="title-row">
    <div>
      <div class="muted small eyebrow">Story</div>
      <h1>{data.project.title}</h1>
      <div class="row muted small" style="margin-top:8px">
        <span>{data.project.story.length.toLocaleString()} characters</span>
        <span>·</span>
        <span>{data.chapters.length} chapters</span>
        <span>·</span>
        <span
          >{data.progress.approved}/{data.progress.total} catalog entries approved</span
        >
        <span>·</span>
        <span>{approved}/{pages} pages approved</span>
      </div>
    </div>
    {#if data.project.catalog_approved_at}
      <span class="pill ok"
        >catalog locked {new Date(
          data.project.catalog_approved_at,
        ).toLocaleDateString()}</span
      >
    {/if}
  </div>

  <div class="steps">
    <div class={step > 1 ? "done" : step === 1 ? "now" : ""}>
      1 · Read the story
    </div>
    <div class={step > 2 ? "done" : step === 2 ? "now" : ""}>
      2 · Approve the cast
    </div>
    <div class={step > 3 ? "done" : step === 3 ? "now" : ""}>
      3 · Plan the pages
    </div>
    <div class={step > 4 ? "done" : step === 4 ? "now" : ""}>
      4 · Draw and approve
    </div>
  </div>

  {@render children()}
</div>

<style>
  .title-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 20px;
    flex-wrap: wrap;
    margin-bottom: 6px;
  }
  .eyebrow {
    letter-spacing: 0.16em;
    text-transform: uppercase;
    font-size: 0.68rem;
  }
  h1 {
    margin-top: 2px;
  }
  .tab {
    font-variant-numeric: tabular-nums;
  }
</style>
