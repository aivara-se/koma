<script lang="ts">
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const p = $derived(data.progress);
  const pct = $derived(
    p.total ? Math.round(((p.approved + p.excluded) / p.total) * 100) : 0,
  );
</script>

<svelte:head><title>Catalog — Koma</title></svelte:head>

<div class="head">
  <div>
    <h2>Step 2 — the catalog</h2>
    <p class="muted small" style="margin:6px 0 0">
      Every face and every place, in writing and in art. A variant is a change
      the story actually shows — approve it, correct it, or mark it out of the
      comic. Nothing is drawn until this is locked.
    </p>
  </div>
  <div class="lockbox card">
    <div class="row spread">
      <span class="small muted"
        >{p.approved + p.excluded} of {p.total} decided</span
      >
      <span class="small">{pct}%</span>
    </div>
    <div class="bar"><div style="width:{pct}%"></div></div>
    <form method="POST" action="?/approve">
      <button
        class="btn primary"
        disabled={!p.complete}
        style="width:100%; margin-top:12px"
      >
        Lock catalog & plan pages →
      </button>
    </form>
    {#if !p.complete}
      <p class="muted small" style="margin:8px 0 0">
        Approve or exclude every entry. A variant follows its parent.
      </p>
    {/if}
  </div>
</div>

{#if form?.message}
  <div class="err" style="margin:14px 0">{form.message}</div>
{/if}

{#if !data.model}
  <div class="note" style="margin:18px 0">
    No image key is set, so each plate below is a deterministic placeholder. The
    layout, the variant and the reference wiring are real; set <span
      class="mono">KOMA_API_KEY</span
    > and press “Draw” again for art.
  </div>
{/if}

{#each [{ title: "Characters", items: data.characters, kind: "character" }, { title: "Locations", items: data.locations, kind: "location" }] as group}
  <div class="section-head">
    <h2>{group.title}</h2>
    <span class="muted small">{group.items.length} in the story</span>
  </div>

  {#if group.items.length === 0}
    <div class="card">
      <p class="muted">
        None found. Re-read the story, or write the entry yourself is not
        possible in v1.
      </p>
    </div>
  {:else}
    <div class="stack">
      {#each group.items as item}
        <article class="card item" class:excluded={item.excluded}>
          <div class="item-top">
            <div class="art">
              {#if item.image}
                <img class="plate" src={item.image.href} alt={item.name} />
              {:else}
                <div class="swatch">
                  No plate yet.<br />Draw one to fix the look.
                </div>
              {/if}
              <form method="POST" action="?/draw">
                <input type="hidden" name="itemId" value={item.id} />
                <button
                  class="btn small"
                  type="submit"
                  style="width:100%; margin-top:8px"
                >
                  {item.image ? "Redraw plate" : "Draw plate"}
                </button>
              </form>
              {#if item.image}
                <div
                  class="mono muted"
                  style="margin-top:6px; font-size:0.66rem"
                >
                  {item.image.provider}
                </div>
              {/if}
            </div>

            <form method="POST" action="?/save" class="fields">
              <input type="hidden" name="itemId" value={item.id} />
              <label class="field">
                <span>Name</span>
                <input type="text" name="name" value={item.name} />
              </label>
              <label class="field">
                <span>Description</span>
                <textarea name="description" rows="3"
                  >{item.description}</textarea
                >
              </label>
              <label class="field">
                <span>Visual brief</span>
                <textarea name="visual" rows="2">{item.visual}</textarea>
              </label>
              <div class="row spread">
                <div class="row">
                  <label class="check">
                    <input
                      type="checkbox"
                      name="approved"
                      checked={!!item.approved}
                    /> Approved
                  </label>
                  <label class="check">
                    <input
                      type="checkbox"
                      name="excluded"
                      checked={!!item.excluded}
                    /> Not in the comic
                  </label>
                </div>
                <button class="btn small" type="submit">Save</button>
              </div>
            </form>
          </div>

          {#if item.variants.length}
            <div class="divider"></div>
            <div class="variants">
              {#each item.variants as v}
                <form
                  method="POST"
                  action="?/save"
                  class="variant"
                  class:excluded={v.excluded}
                >
                  <input type="hidden" name="itemId" value={v.id} />
                  <div class="variant-art">
                    {#if v.image}
                      <img class="thumb" src={v.image.href} alt={v.name} />
                    {:else}
                      <div class="swatch">No plate</div>
                    {/if}
                  </div>
                  <div class="variant-body">
                    <label class="field">
                      <span>Variant</span>
                      <input type="text" name="name" value={v.name} />
                    </label>
                    <label class="field">
                      <span>What changed</span>
                      <textarea name="description" rows="3"
                        >{v.description}</textarea
                      >
                    </label>
                    <input type="hidden" name="visual" value={v.visual} />
                    <div class="row spread">
                      <label class="check">
                        <input
                          type="checkbox"
                          name="approved"
                          checked={!!v.approved}
                        /> Approved
                      </label>
                      <div class="row">
                        <button
                          class="btn small ghost"
                          type="submit"
                          formaction="?/draw"
                        >
                          {v.image ? "Redraw" : "Draw"}
                        </button>
                        <button class="btn small" type="submit">Save</button>
                      </div>
                    </div>
                  </div>
                </form>
              {/each}
            </div>
          {/if}
        </article>
      {/each}
    </div>
  {/if}
{/each}

<style>
  .head {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 300px;
    gap: 24px;
    align-items: start;
    margin-top: 26px;
  }
  @media (max-width: 820px) {
    .head {
      grid-template-columns: 1fr;
    }
  }
  .lockbox {
    padding: 16px;
  }
  .bar {
    height: 5px;
    background: var(--line);
    border-radius: 999px;
    overflow: hidden;
    margin-top: 8px;
  }
  .bar div {
    height: 100%;
    background: var(--ok);
  }
  .item {
    padding: 16px;
  }
  .item.excluded {
    opacity: 0.45;
  }
  .item-top {
    display: grid;
    grid-template-columns: 240px minmax(0, 1fr);
    gap: 18px;
  }
  @media (max-width: 720px) {
    .item-top {
      grid-template-columns: 1fr;
    }
  }
  .plate {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    border-radius: 10px;
    border: 1px solid var(--line);
    display: block;
    background: var(--surface-2);
  }
  .variants {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 12px;
  }
  .variant {
    display: grid;
    grid-template-columns: 84px minmax(0, 1fr);
    gap: 12px;
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 10px;
    background: var(--surface-2);
  }
  @media (max-width: 560px) {
    .variant {
      grid-template-columns: 1fr;
    }
    .variant-art {
      max-width: 110px;
    }
  }
  .variant.excluded {
    opacity: 0.4;
  }
  .variant-draw {
    margin-top: -6px;
  }
  .fields :global(textarea) {
    font-size: 0.88rem;
  }
</style>
