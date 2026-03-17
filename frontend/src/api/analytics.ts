import { api } from "./api";

export async function getProjectAnalytics() {
  return api.get("/analytics/projects/");
}