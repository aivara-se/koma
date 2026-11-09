<script lang="ts">
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  // Group the approved pages by chapter, in reading order.
  const chapters = $derived.by(() => {
    const groups: { title: string; pages: PageData["pages"] }[] = [];
    for (const page of data.pages) {
      const last = groups[groups.length - 1];
      if (last && last.title === page.chapterTitle) last.pages.push(page);
      else groups.push({ title: page.chapterTitle, pages: [page] });
    }
    return groups;
  });
</script>

<svelte:head><title>The book — {data.project.title}</title></svelte:head>

<div class="book-head">
  <div>
    <h2>The book</h2>
    <p class="muted small" style="margin:6px 0 0">
      Every approved page, in reading order: {data.progress.approved} of {data
        .progress.pages} planned.
    </p>
  </div>
  {#if data.pages.length > 0}
    <a class="btn primary" href="/p/{data.project.id}/book/download"
      >Download CBZ</a
    >
  {/if}
</div>

{#if data.pages.length === 0}
  <div class="card empty">
    <h3>Nothing approved yet</h3>
    <p class="muted small" style="max-width:560px">
      A page joins the book when you approve it. Plan a chapter, draw the pages,
      and the book builds itself.
    </p>
    <a class="btn" href="/p/{data.project.id}/chapters">Go to the chapters →</a>
  </div>
{:else}
  {#each chapters as chapter, i}
    <section>
      <div class="chapter-mark">
        <span class="num">{String(i + 1).padStart(2, "0")}</span>
        <h3>{chapter.title}</h3>
      </div>
      {#each chapter.pages as page}
        <figure class="page">
          {#if page.image}
            <img src={page.image.href} alt={page.beat} loading="lazy" />
          {/if}
          <figcaption>
            <span>Page {page.idx + 1}</span>
            {page.beat}
          </figcaption>
        </figure>
      {/each}
    </section>
  {/each}
{/if}

<style>
  .book-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 16px;
    flex-wrap: wrap;
    margin: 24px 0 28px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--line);
  }
  .empty {
    padding: 26px;
  }
  section {
    margin-bottom: 40px;
  }
  .chapter-mark {
    display: flex;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 14px;
  }
  .chapter-mark .num {
    font-family: var(--serif);
    color: var(--muted);
    font-size: 1.3rem;
  }
  .page {
    margin: 0 auto 22px;
    max-width: 560px;
  }
  .page img {
    width: 100%;
    display: block;
    border: 1px solid var(--line-strong);
    border-radius: 4px;
    background: #08080a;
  }
  .page figcaption {
    display: flex;
    gap: 10px;
    font-size: 0.76rem;
    color: var(--muted);
    padding-top: 6px;
  }
  .page figcaption span {
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--accent);
    white-space: nowrap;
  }
</style>
