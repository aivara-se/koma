import { fail, redirect } from "@sveltejs/kit";
import { STORY } from "$lib/config";
import { DEMO_STORY, DEMO_TITLE } from "$lib/demo";
import { createProject, listProjects } from "$lib/server/repo";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = () => ({ projects: listProjects() });

export const actions: Actions = {
  create: async ({ request }) => {
    const form = await request.formData();
    const title = String(form.get("title") ?? "").trim();
    const story = String(form.get("story") ?? "").trim();
    if (story.length < STORY.minChars) {
      return fail(400, {
        message: `The story needs at least ${STORY.minChars} characters.`,
      });
    }
    if (story.length > STORY.maxChars) {
      return fail(400, {
        message: `The story is over ${STORY.maxChars.toLocaleString()} characters.`,
      });
    }
    redirect(303, `/p/${createProject(title, story)}`);
  },
  demo: async () => {
    redirect(303, `/p/${createProject(DEMO_TITLE, DEMO_STORY)}`);
  },
};
