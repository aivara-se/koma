import { error } from "@sveltejs/kit";
import {
  getBook,
  getChapters,
  getProject,
  pageProgress,
} from "$lib/server/repo";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ params }) => {
  const project = getProject(params.project);
  if (!project) error(404, "No such story");
  return {
    project,
    pages: getBook(params.project),
    chapters: getChapters(params.project).filter((c) => c.approved > 0),
    progress: pageProgress(params.project),
  };
};
