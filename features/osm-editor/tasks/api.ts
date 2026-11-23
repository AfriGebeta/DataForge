import { apiFetch } from "@/lib/api-fetch";
import { API_BASE_URL } from "@/lib/api-config";

const ENDPOINT = `${API_BASE_URL}/api/v1/edit-tasks`;

export type TaskStatus = "pending" | "done" | "skipped";

export interface EditTask {
  id: number;
  type: string;
  z: number;
  x: number;
  y: number;
  lat: number; // current position (a mapper may have dragged it)
  lon: number;
  sourceLat: number; // where the task started; never changes
  sourceLon: number;
  tags: Record<string, string>; // OSM tags applied when accepted
  osmNodeId: number | null; // set once the accepted node has been saved to OSM
  note: string;
  status: TaskStatus;
  assignedToId: string | null;
  assignedToName: string | null;
  completedAt: string | null;
  requiresImage: boolean;
  imageCount: number;
}

export interface TaskType {
  id: string;
  label: string;
  requiresImage: boolean;
  color: string;
  defaultTags: Record<string, string>;
  tasks: number;
}

export interface TaskImage {
  id: number;
  taskId: number;
  contentType: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface TaskSummaryRow {
  type: string;
  workerId: string | null;
  workerName: string | null;
  pending: number;
  done: number;
  skipped: number;
}

export interface NewTaskInput {
  z: number;
  x: number;
  y: number;
  lat?: number;
  lon?: number;
  note?: string;
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const b = await res.json();
      if (b?.error) msg = b.error;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

const post = (path: string, body: unknown, method = "POST") =>
  apiFetch(`${ENDPOINT}${path}`, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export async function listTasks(p: { types: string[]; status: string; assigned: string; limit: number; offset: number }) {
  const q = new URLSearchParams({ status: p.status, assigned: p.assigned, limit: String(p.limit), offset: String(p.offset) });
  if (p.types.length) q.set("types", p.types.join(","));
  return json<{ data: EditTask[]; total: number }>(await apiFetch(`${ENDPOINT}?${q}`));
}

export async function fetchTaskSummary() {
  return json<TaskSummaryRow[]>(await apiFetch(`${ENDPOINT}/summary`));
}

export async function createTasks(type: string, tasks: NewTaskInput[]) {
  return json<{ created: number; duplicates: number }>(await post("", { type, tasks }));
}

export async function splitAssignTasks(sel: { ids?: number[]; types?: string[] }, workerIds: string[], onlyUnassigned: boolean) {
  return json<{ total: number; perWorker: Record<string, number> }>(await post("/assign", { ...sel, workerIds, onlyUnassigned }));
}

export async function unassignTasks(sel: { ids?: number[]; types?: string[] }) {
  return json<{ unassigned: number }>(await post("/unassign", sel));
}

export interface TaskPatch {
  status?: TaskStatus;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
  osmNodeId?: number;
  resetPosition?: boolean;
}

export async function patchTask(id: number, patch: TaskPatch) {
  return json<EditTask>(await post(`/${id}`, patch, "PATCH"));
}

export const setTaskStatus = (id: number, status: TaskStatus) => patchTask(id, { status });

export async function deleteTask(id: number, deleteNode = false) {
  return json<{ deleted: boolean; osmNodeDeleted: boolean }>(await apiFetch(`${ENDPOINT}/${id}${deleteNode ? "?deleteNode=1" : ""}`, { method: "DELETE" }));
}

export interface Bounds {
  minLat: number;
  minLon: number;
  maxLat: number;
  maxLon: number;
}

/** Tasks inside a map view (what the editor layer shows). */
export async function listTasksInBounds(b: Bounds, p: { types: string[]; status: string; assigned: string; limit?: number }, signal?: AbortSignal) {
  const q = new URLSearchParams({ bbox: `${b.minLon},${b.minLat},${b.maxLon},${b.maxLat}`, status: p.status, assigned: p.assigned, limit: String(p.limit ?? 2000) });
  if (p.types.length) q.set("types", p.types.join(","));
  return json<{ data: EditTask[]; total: number }>(await apiFetch(`${ENDPOINT}?${q}`, { signal }));
}

/** A mapper found something not on the list: creates a task of `type` at lat/lon with this photo, assigned to them. */
export async function createTaskFromPhoto(type: string, lat: number, lon: number, file: File) {
  const q = new URLSearchParams({ type, lat: String(lat), lon: String(lon) });
  return json<{ task: EditTask; imageId: number }>(
    await apiFetch(`${ENDPOINT}/photo?${q}`, { method: "POST", headers: { "Content-Type": file.type || "application/octet-stream" }, body: file }),
  );
}

const TYPES_ENDPOINT = `${API_BASE_URL}/api/v1/edit-task-types`;

export async function listTaskTypes() {
  return json<TaskType[]>(await apiFetch(TYPES_ENDPOINT));
}

export interface TypeInput {
  label: string;
  requiresImage: boolean;
  color?: string;
  defaultTags?: Record<string, string>;
}

export async function createTaskType(label: string, requiresImage: boolean, extra: Pick<TypeInput, "color" | "defaultTags"> = {}) {
  return json<{ id: string }>(
    await apiFetch(TYPES_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ label, requiresImage, ...extra }) }),
  );
}

export async function updateTaskType(id: string, label: string, requiresImage: boolean, extra: Pick<TypeInput, "color" | "defaultTags"> = {}) {
  return json<{ updated: boolean }>(
    await apiFetch(`${TYPES_ENDPOINT}/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ label, requiresImage, ...extra }) }),
  );
}

export async function deleteTaskType(id: string) {
  return json<{ deleted: boolean }>(await apiFetch(`${TYPES_ENDPOINT}/${encodeURIComponent(id)}`, { method: "DELETE" }));
}

export async function listTaskImages(taskId: number) {
  return json<TaskImage[]>(await apiFetch(`${ENDPOINT}/${taskId}/images`));
}

export async function uploadTaskImage(taskId: number, file: File) {
  return json<{ id: number }>(await apiFetch(`${ENDPOINT}/${taskId}/images`, { method: "POST", headers: { "Content-Type": file.type || "application/octet-stream" }, body: file }));
}

export async function deleteTaskImage(imageId: number) {
  return json<{ deleted: boolean }>(await apiFetch(`${ENDPOINT}/images/${imageId}`, { method: "DELETE" }));
}

// <img> can't send an Authorization header, so the token rides in the query string (the same trick the map editor uses elsewhere).
export function taskImageUrl(imageId: number): string {
  const m = typeof document === "undefined" ? null : document.cookie.match(/(?:^|; )gebeta_token=([^;]*)/);
  return `${ENDPOINT}/images/${imageId}?token=${encodeURIComponent(m ? decodeURIComponent(m[1]) : "")}`;
}

/**
 * Parses pasted lines. Accepted forms (separators: comma, space, `/`, `;`):
 *  - `z,x,y` or `z/x/y`, optionally followed by `,lat,lon`
 *  - `lat,lon` (e.g. roundabouts, traffic lights) - the server derives the tile
 */
export function parseTaskLines(text: string): { tasks: NewTaskInput[]; errors: string[] } {
  const tasks: NewTaskInput[] = [];
  const errors: string[] = [];
  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith("#")) return;
    const parts = line.split(/[\s,/;]+/).filter(Boolean);
    const nums = parts.slice(0, 5).map(Number);
    const finite = nums.every((n) => Number.isFinite(n));
    if (parts.length === 2 && finite) {
      const [lat, lon] = nums;
      if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
        errors.push(`Line ${i + 1}: lat must be -90..90 and lon -180..180 (format is "lat,lon") - got "${line}"`);
        return;
      }
      tasks.push({ z: 0, x: 0, y: 0, lat, lon });
      return;
    }
    const bad = nums.length < 3 || nums.length === 4 || !finite || nums.slice(0, 3).some((n) => !Number.isInteger(n));
    if (bad) {
      errors.push(`Line ${i + 1}: expected "z,x,y", "z,x,y,lat,lon" or "lat,lon" - got "${line}"`);
      return;
    }
    const t: NewTaskInput = { z: nums[0], x: nums[1], y: nums[2] };
    if (nums.length === 5) {
      t.lat = nums[3];
      t.lon = nums[4];
    }
    tasks.push(t);
  });
  return { tasks, errors };
}
