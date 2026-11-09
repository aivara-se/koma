<script lang="ts">
  import { DENSITY } from "$lib/config";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const chapter = $derived(data.chapter);
  const p = $derived(data.progress);
  const canApproveChapter = $derived(p.pages > 0 && p.approved === p.pages);
  const refs = (ids: string[]) =>
    ids
      .map((id) => data.byId[id])
      .filter((v): v is NonNullable<typeof v> => Boolean(v));
</script>

<svelte:head><title>{chapter.title} — Koma</title></svelte:head>

{#if form?.message}
  <div class="err" style="margin:16px 0">{form.message}</div>
{/if}

<header class="chapter-head">
  <div>
    <a class="muted small back" href="/p/{data.project.id}/chapters"
      >← Chapters</a
    >
    <h2 style="margin-top:6px">{chapter.title}</h2>
    <div class="row muted small" style="margin-top:6px">
      <span>{chapter.source.split(/\s+/).length.toLocaleString()} words</span>
      <span>·</span>
      <span>{p.pages} pages planned</span>
      <span>·</span>
      <span>{p.approved} approved</span>
    </div>
  </div>
  <div class="row">
    <form method="POST" action="?/plan">
      <button class="btn ghost small" type="submit">
        {p.pages > 0 ? "Re-plan chapter" : "Plan chapter →"}
      </button>
    </form>
    {#if p.pages > 0}
      <form method="POST" action="?/chapter-approve">
        <button
          class="btn primary small"
          type="submit"
          disabled={!canApproveChapter}
        >
          {chapter.status === "approved"
            ? "Chapter approved"
            : "Approve chapter"}
        </button>
      </form>
    {/if}
  </div>
</header>

{#if chapter.pages.length === 0}
  <div class="card empty">
    <h3>No pages yet</h3>
    <p class="muted small" style="max-width:620px">
      Planning cuts this chapter into pages of about {DENSITY.wordsPerPage} source
      words, in order and without skipping a sentence. Each page gets a beat, a script
      for the letterer, and the catalog references the drawing must hold. One image
      call draws the whole page.
    </p>
    <form method="POST" action="?/plan">
      <button class="btn primary" type="submit">Plan this chapter →</button>
    </form>
  </div>
{:else}
  <div class="pages">
    {#each chapter.pages as page}
      <article class="card page-card">
        <header class="row spread page-head">
          <div class="row">
            <h3>Page {String(page.idx + 1).padStart(2, "0")}</h3>
            {#if page.status === "approved"}
              <span class="pill ok">approved</span>
            {:else if page.image}
              <span class="pill warn">drawn · review</span>
            {:else}
              <span class="pill">planned</span>
            {/if}
          </div>
          <div class="row">
            <form method="POST" action="?/draw">
              <input type="hidden" name="pageId" value={page.id} />
              <button class="btn small" type="submit"
                >{page.image ? "Redraw page" : "Draw page"}</button
              >
            </form>
            <form method="POST" action="?/approve">
              <input type="hidden" name="pageId" value={page.id} />
              <input
                type="hidden"
                name="approve"
                value={page.status === "approved" ? "0" : "1"}
              />
              <button
                class="btn small"
                class:primary={page.status !== "approved"}
                type="submit"
                disabled={page.status !== "approved" && !page.image}
              >
                {page.status === "approved" ? "Unapprove" : "Approve page"}
              </button>
            </form>
          </div>
        </header>

        <div class="page-body">
          <figure class="sheet" class:drawn={!!page.image}>
            {#if page.image}
              <img src={page.image.href} alt={page.beat} />
            {:else}
              <div class="blank">
                <span>Page {page.idx + 1}</span>
                <em>{page.beat}</em>
              </div>
            {/if}
          </figure>

          <div class="controls">
            <section>
              <div class="label">The page shows</div>
              <p class="beat">{page.beat}</p>
            </section>

            <section class="script">
              <div class="label">Lettering script</div>
              {#if page.script.caption}
                <div class="caption">{page.script.caption}</div>
              {/if}
              {#each page.script.dialogue as line}
                <div class="line"><span>{line.speaker}</span>{line.text}</div>
              {:else}
                <p class="muted small" style="margin:4px 0 0">
                  No spoken lines on this page.
                </p>
              {/each}
            </section>

            {#if refs(page.refs).length}
              <section>
                <div class="label">References</div>
                <div class="row">
                  {#each refs(page.refs) as r}
                    <span class="chip">{r.name}</span>
                  {/each}
                </div>
              </section>
            {/if}

            <form method="POST" action="?/prompt">
              <input type="hidden" name="pageId" value={page.id} />
              <label class="field">
                <span>Page prompt</span>
                <textarea name="prompt" rows="8">{page.prompt}</textarea>
              </label>
              <button class="btn small" type="submit">Save prompt</button>
            </form>

            <form method="POST" action="?/revise" class="revise">
              <input type="hidden" name="pageId" value={page.id} />
              <label class="field">
                <span>Feedback on this page</span>
                <textarea
                  name="note"
                  rows="2"
                  placeholder="Hold the face from the reference sheet; the storm should feel louder."
                ></textarea>
              </label>
              <button class="btn small ghost" type="submit"
                >Apply note to prompt</button
              >
            </form>

            {#if page.image}
              <div class="mono muted" style="font-size:0.66rem">
                {page.image.provider}
              </div>
            {/if}
          </div>
        </div>
      </article>
    {/each}
  </div>

  <div class="card footer">
    <div>
      <h3>Finish the chapter</h3>
      <p class="muted small" style="margin:4px 0 0">
        {p.approved} of {p.pages} pages approved. Approving the chapter locks it and
        moves the studio on.
      </p>
    </div>
    <form method="POST" action="?/chapter-approve">
      <button class="btn primary" type="submit" disabled={!canApproveChapter}>
        {chapter.status === "approved" ? "Approved ✓" : "Approve chapter"}
      </button>
    </form>
  </div>
{/if}

<style>
  .chapter-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 16px;
    flex-wrap: wrap;
    margin: 24px 0 18px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--line);
  }
  .back {
    letter-spacing: 0.04em;
  }
  .empty {
    padding: 26px;
  }
  .pages {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .page-card {
    padding: 16px;
  }
  .page-head {
    margin-bottom: 14px;
  }
  .page-body {
    display: grid;
    grid-template-columns: minmax(260px, 400px) minmax(0, 1fr);
    gap: 24px;
    align-items: start;
  }
  @media (max-width: 860px) {
    .page-body {
      grid-template-columns: 1fr;
    }
  }
  .sheet {
    margin: 0;
    aspect-ratio: 2 / 3;
    background: #08080a;
    border: 1px solid var(--line-strong);
    border-radius: 6px;
    overflow: hidden;
  }
  .sheet img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }
  .blank {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: var(--muted);
    font-size: 0.8rem;
    text-align: center;
    padding: 24px;
    border: 1px dashed var(--line-strong);
  }
  .blank em {
    font-style: normal;
    font-family: var(--serif);
    font-size: 0.9rem;
    line-height: 1.5;
    opacity: 0.8;
  }
  .controls {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .label {
    font-size: 0.7rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 6px;
  }
  .beat {
    font-family: var(--serif);
    font-size: 1rem;
    line-height: 1.6;
    margin: 0;
    color: #ddd9cf;
  }
  .caption {
    border-left: 2px solid var(--warn);
    padding: 4px 0 4px 10px;
    font-family: var(--serif);
    font-size: 0.92rem;
    color: #d8d4ca;
    margin-bottom: 8px;
  }
  .line {
    font-size: 0.9rem;
    margin-bottom: 6px;
  }
  .line span {
    color: var(--accent);
    font-size: 0.66rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-right: 8px;
  }
  .chip {
    font-size: 0.7rem;
    padding: 2px 8px;
    border-radius: 999px;
    border: 1px solid var(--line-strong);
    color: var(--muted);
  }
  .controls textarea {
    font-size: 0.8rem;
    line-height: 1.5;
  }
  .revise {
    border-left: 2px solid var(--line-strong);
    padding-left: 12px;
  }
  .footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
    margin-top: 20px;
  }
</style>
