import { fail, redirect } from "@sveltejs/kit";
import { analyseStory } from "$lib/pipeline/analyze";
import { hasModel, analyseWithModel } from "$lib/server/llm";
import { getProject, saveAnalysis } from "$lib/server/repo";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ params }) => {
  const project = getProject(params.project)!;
  return { project, model: hasModel };
};

export const actions: Actions = {
  analyse: async ({ params }) => {
    const project = getProject(params.project);
    if (!project) return fail(404, { message: "No such story" });

    let provider = "offline extractor";
    let analysis;
    if (hasModel) {
      try {
        const result = await analyseWithModel(project.story);
        analysis = result.analysis;
        provider = result.provider;
      } catch (error) {
        analysis = analyseStory(project.story);
        provider = `offline extractor (${error instanceof Error ? error.message : "model call failed"})`;
      }
    } else {
      analysis = analyseStory(project.story);
    }

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
