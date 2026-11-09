<script lang="ts">
  import { LOCKED } from "$lib/config";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head><title>Koma — story to manga, kept consistent</title></svelte:head>

<div class="shell">
  <header class="topbar">
    <a class="wordmark" href="/"
      ><span class="dot"></span> Koma <small>story to manga</small></a
    >
    <span class="pill">v1.0 · locked look</span>
  </header>

  <section class="hero">
    <h1>A story becomes a manga<br />that stays the same.</h1>
    <p class="lede">
      Paste the whole story once. Koma builds a catalog of every character and
      place — with the haircut in chapter four and the house after the fire —
      and every later page is drawn against that catalog, not against its own
      memory.
    </p>
    <div class="row small muted">
      {#each LOCKED as l}
        <span class="pill">{l.label}: {l.value}</span>
      {/each}
    </div>
  </section>

  <div class="grid cols-2 start">
    <section class="card">
      <h2>New story</h2>
      <p class="muted small">
        The whole text, chapter headings included. Nothing is sent anywhere
        while no model key is set: Koma reads it locally and draws placeholder
        plates.
      </p>
      {#if form?.message}
        <div class="err">{form.message}</div>
      {/if}
      <form method="POST" action="?/create">
        <label class="field">
          <span>Title</span>
          <input
            type="text"
            name="title"
            placeholder="The Salt Line"
            maxlength="120"
          />
        </label>
        <label class="field">
          <span>Story</span>
          <textarea name="story" rows="12" placeholder="Chapter One…" required
          ></textarea>
        </label>
        <div class="row spread">
          <span class="muted small">Minimum 400 characters.</span>
          <button class="btn primary" type="submit">Read the story →</button>
        </div>
      </form>
      <div class="divider"></div>
      <form method="POST" action="?/demo">
        <button class="btn ghost" type="submit"
          >Load the demo story instead</button
        >
        <p class="muted small" style="margin:8px 0 0">
          “The Salt Line”, four chapters, five characters.
        </p>
      </form>
    </section>

    <section>
      <div class="section-head" style="margin-top:0">
        <h2>Your stories</h2>
        <span class="muted small">{data.projects.length} in the studio</span>
      </div>
      {#if data.projects.length === 0}
        <div class="card empty">
          <p class="muted">
            No story yet. Paste one, or load the demo to see all four steps.
          </p>
        </div>
      {:else}
        <div class="stack">
          {#each data.projects as p}
            <a class="card project" href="/p/{p.id}">
              <div class="row spread">
                <h3>{p.title}</h3>
                {#if p.catalog_approved_at}
                  <span class="pill ok">catalog locked</span>
                {:else if p.analysed_at}
                  <span class="pill warn">catalog open</span>
                {:else}
                  <span class="pill">not read</span>
                {/if}
              </div>
              <div class="row muted small" style="margin-top:6px">
                <span>{p.characters} characters</span>
                <span>·</span>
                <span>{p.locations} places</span>
                <span>·</span>
                <span>{p.chapters} chapters</span>
                <span>·</span>
                <span>{p.approved_pages} of {p.pages} pages approved</span>
              </div>
            </a>
          {/each}
        </div>
      {/if}
    </section>
  </div>
</div>

<style>
  .hero {
    padding: 30px 0 34px;
    max-width: 780px;
  }
  .hero h1 {
    font-size: clamp(2rem, 5vw, 3.2rem);
    line-height: 1.08;
    letter-spacing: -0.02em;
    margin-bottom: 18px;
  }
  .lede {
    color: #c4c1b8;
    font-size: 1.02rem;
    max-width: 640px;
    margin-bottom: 18px;
  }
  .start {
    align-items: start;
  }
  .project {
    display: block;
    transition: border-color 0.15s;
  }
  .project:hover {
    border-color: var(--line-strong);
  }
  .empty {
    padding: 30px;
  }
  form .row {
    margin-top: 6px;
  }
</style>
