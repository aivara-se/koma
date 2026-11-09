<script lang="ts">
  import MangaPage from "$lib/components/MangaPage.svelte";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const chapter = $derived(data.chapter);
  const p = $derived(data.progress);
  const drawn = $derived(
    chapter.pages.every((pg) => pg.panels.every((pn) => pn.image)),
  );
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
    <p class="muted small" style="max-width:560px">
      Planning keeps {Math.round(0.45 * 100)}% of this chapter's beats — the
      moments a reader needs to follow the story — and lays them out {5} panels to
      a page. Each panel gets a shot, the action, any spoken line, and the catalog
      references it must carry.
    </p>
    <form method="POST" action="?/plan">
      <button class="btn primary" type="submit">Plan this chapter →</button>
    </form>
  </div>
{:else}
  <div class="pages">
    {#each chapter.pages as page}
      {@const allDrawn = page.panels.every((pn) => pn.image)}
      <article class="card page-card">
        <header class="row spread page-head">
          <div class="row">
            <h3>Page {String(page.idx + 1).padStart(2, "0")}</h3>
            {#if page.status === "approved"}
              <span class="pill ok">approved</span>
            {:else if allDrawn}
              <span class="pill warn">drawn · review</span>
            {:else}
              <span class="pill">planned</span>
            {/if}
          </div>
          <div class="row">
            <form method="POST" action="?/draw">
              <input type="hidden" name="pageId" value={page.id} />
              <button class="btn small" type="submit">
                {allDrawn ? "Redraw all panels" : "Draw missing panels"}
              </button>
              {#if allDrawn}<input type="hidden" name="force" value="on" />{/if}
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
                disabled={page.status !== "approved" && !allDrawn}
              >
                {page.status === "approved" ? "Unapprove" : "Approve page"}
              </button>
            </form>
          </div>
        </header>

        <div class="page-body">
          <div class="preview">
            <MangaPage {page} byId={data.byId} />
          </div>

          <div class="controls">
            <form method="POST" action="?/prompt">
              <input type="hidden" name="pageId" value={page.id} />
              <label class="field">
                <span>Page prompt</span>
                <textarea name="prompt" rows="9">{page.prompt}</textarea>
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
                  placeholder="Sharper on Mira's face in the last panel; the storm should feel louder."
                ></textarea>
              </label>
              <button class="btn small ghost" type="submit"
                >Apply note to prompt</button
              >
            </form>

            <div class="panels">
              {#each page.panels as panel}
                <div class="panel-row">
                  <div class="panel-meta">
                    <div class="row spread">
                      <strong class="small"
                        >{panel.idx + 1}. {panel.shot}</strong
                      >
                      <form method="POST" action="?/panel">
                        <input type="hidden" name="pageId" value={page.id} />
                        <input type="hidden" name="panelId" value={panel.id} />
                        <button class="btn small ghost" type="submit"
                          >{panel.image ? "Redraw" : "Draw"}</button
                        >
                      </form>
                    </div>
                    <p class="small muted" style="margin:2px 0 4px">
                      {panel.action}
                    </p>
                    <div class="row">
                      {#each refs(panel.refs) as r}
                        <a
                          class="chip"
                          href="/p/{data.project.id}/catalog"
                          title={r.description}>{r.name}</a
                        >
                      {/each}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
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
  {#if !drawn}
    <p class="muted small" style="margin-top:10px">
      Some panels have no art yet.
    </p>
  {/if}
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
    gap: 18px;
  }
  .page-card {
    padding: 16px;
  }
  .page-head {
    margin-bottom: 12px;
  }
  .page-body {
    display: grid;
    grid-template-columns: minmax(280px, 420px) minmax(0, 1fr);
    gap: 20px;
    align-items: start;
  }
  @media (max-width: 860px) {
    .page-body {
      grid-template-columns: 1fr;
    }
  }
  .controls {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .controls textarea {
    font-size: 0.8rem;
    line-height: 1.5;
  }
  .revise {
    border-left: 2px solid var(--line-strong);
    padding-left: 12px;
  }
  .panels {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .panel-row {
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 9px 11px;
    background: var(--surface-2);
  }
  .panel-meta p {
    line-height: 1.4;
  }
  .chip {
    font-size: 0.68rem;
    padding: 2px 7px;
    border-radius: 999px;
    border: 1px solid var(--line-strong);
    color: var(--muted);
  }
  .chip:hover {
    color: var(--text);
  }
  .footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
    margin-top: 18px;
  }
</style>
