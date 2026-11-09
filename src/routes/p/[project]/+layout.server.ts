import { error } from "@sveltejs/kit";
import {
  catalogProgress,
  firstUnfinishedChapter,
  getChapter,
  getChapters,
  getProject,
} from "$lib/server/repo";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = ({ params }) => {
  const project = getProject(params.project);
  if (!project) error(404, "No such story");
  const catalog = catalogProgress(params.project);
  const chapters = getChapters(params.project);
  const next = firstUnfinishedChapter(params.project);
  return {
    project,
    progress: catalog,
    chapters,
    nextChapterId:
      next?.id ??
      getChapter(chapters[chapters.length - 1]?.id ?? "")?.id ??
      null,
  };
};
