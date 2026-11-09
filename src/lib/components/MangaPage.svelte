<script lang="ts">
  import type { CatalogItem, Page } from "$lib/types";

  let {
    page,
    byId,
    compact = false,
  }: {
    page: Page;
    byId: Record<string, CatalogItem>;
    compact?: boolean;
  } = $props();

  const rows = $derived.by(() => {
    const map = new Map<number, Page["panels"]>();
    for (const panel of page.panels) {
      const list = map.get(panel.row) ?? [];
      list.push(panel);
      map.set(panel.row, list);
    }
    return [...map.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([, panels]) => panels);
  });

  const refs = (ids: string[]) =>
    ids.map((id) => byId[id]).filter((v): v is CatalogItem => Boolean(v));
</script>

<figure class="sheet" class:compact>
  {#each rows as row}
    <div class="strip" class:single={row.length === 1}>
      {#each row as panel}
        <div class="panel">
          {#if panel.image}
            <img
              src={panel.image.href}
              alt="{panel.shot}: {panel.action}"
              loading="lazy"
            />
          {:else}
            <div class="blank">
              <span>Panel {panel.idx + 1}</span>
              <em>{panel.shot}</em>
            </div>
          {/if}
          {#if !compact && refs(panel.refs).length}
            <div class="refs">
              {#each refs(panel.refs) as r}
                <span class="ref">{r.name}</span>
              {/each}
            </div>
          {/if}
          {#each panel.dialogue as line, i}
            <div class="balloon" class:right={i % 2 === 1}>
              <span class="who">{line.speaker}</span>
              {line.text}
            </div>
          {/each}
        </div>
      {/each}
    </div>
  {/each}
</figure>

<style>
  .sheet {
    margin: 0;
    background: #08080a;
    border: 1px solid var(--line-strong);
    border-radius: 8px;
    padding: 7px;
    display: flex;
    flex-direction: column;
    gap: 7px;
    aspect-ratio: 1080 / 1460;
  }
  .strip {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 7px;
    min-height: 0;
  }
  .strip.single {
    grid-template-columns: 1fr;
    flex: 1.25;
  }
  .panel {
    position: relative;
    overflow: hidden;
    background: #141416;
    border-radius: 2px;
    min-height: 0;
  }
  .panel img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .blank {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    border: 1px dashed #33333a;
    color: #6e6d68;
    font-size: 0.72rem;
    text-align: center;
    padding: 8px;
  }
  .blank em {
    font-style: normal;
    font-size: 0.64rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    opacity: 0.7;
  }
  .balloon {
    position: absolute;
    bottom: 14px;
    left: 14px;
    max-width: 62%;
    background: #fbf9f4;
    color: #141414;
    border: 2px solid #141414;
    border-radius: 14px;
    padding: 7px 11px 8px;
    font-size: 0.72rem;
    line-height: 1.35;
    font-family: var(--serif);
    box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.4);
  }
  .balloon.right {
    left: auto;
    right: 14px;
  }
  .balloon .who {
    display: block;
    font-family: var(--sans);
    font-size: 0.55rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #8a3b2c;
    margin-bottom: 2px;
  }
  .refs {
    position: absolute;
    top: 6px;
    left: 6px;
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    max-width: 80%;
  }
  .ref {
    background: rgba(10, 10, 12, 0.75);
    color: #cfcdc6;
    font-size: 0.58rem;
    padding: 2px 6px;
    border-radius: 4px;
    letter-spacing: 0.04em;
  }
  .compact .refs {
    display: none;
  }
</style>
