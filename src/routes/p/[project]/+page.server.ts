import { fail, redirect } from "@sveltejs/kit";
import { analyseStory } from "$lib/pipeline/analyze";
import { hasModel } from "$lib/server/llm";
import { getProject, saveAnalysis } from "$lib/server/repo";
import { startAnalysis } from "$lib/server/jobs";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ params }) => {
  const project = getProject(params.project)!;
  return { project, model: hasModel };
};

export const actions: Actions = {
  analyse: async ({ params }) => {
    const project = getProject(params.project);
    if (!project) return fail(404, { message: "No such story" });

    // A novel read takes minutes, so the model pass runs beside the request
    // and reports from the project row; the offline pass is fast and stays here.
    if (hasModel) {
      startAnalysis(params.project, project.story);
      redirect(303, `/p/${params.project}`);
    }

    const analysis = analyseStory(project.story);
    const provider = "offline extractor";

    if (analysis.characters.length === 0 && analysis.locations.length === 0) {
      return fail(422, {
        message:
          "No characters or places were found. Paste a longer story with named people and places.",
      });
    }

    saveAnalysis(params.project, analysis, provider);
    redirect(303, `/p/${params.project}/catalog`);
  },
};
