// A novel takes minutes to read, longer than a browser or a proxy will hold a
// request open. So the model read runs beside the request: the action answers
// at once, the project row carries the progress, and the page refreshes itself.

import { analyseParts } from "./llm";
import { chunkStory } from "./llm";
import { saveAnalysis, setAnalysisStatus } from "./repo";

export function startAnalysis(projectId: string, story: string): void {
  const parts = chunkStory(story);
  setAnalysisStatus(projectId, "running", `0/${parts.length}`);
  void (async () => {
    try {
      const { analysis, provider } = await analyseParts(
        parts,
        (done, total) => {
          setAnalysisStatus(projectId, "running", `${done}/${total}`);
        },
      );
      saveAnalysis(projectId, analysis, provider);
      setAnalysisStatus(projectId, "done", "");
    } catch (error) {
      setAnalysisStatus(
        projectId,
        "error",
        error instanceof Error ? error.message : "the model call failed",
      );
    }
  })();
}
