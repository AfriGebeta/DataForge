import type {
  CreateWorkerSchemaRequest,
  UpdateWorkerSchemaRequest,
  WorkerSchema,
  WorkerSchemasParams,
  WorkerSchemasResponse,
} from "./types";

export const API_ENDPOINT = "http://localhost:8080/api/schema/worker-schemas" as const;

const fakeSchemas: WorkerSchema[] = [
  {
    id: "ws-001",
    name: "poi-v1",
    version: 1,
    jsonSchema: {
      type: "object",
      required: ["name", "lat", "lng"],
      properties: {
        name: { type: "string" },
        lat: { type: "number" },
        lng: { type: "number" },
        category: { type: "string" },
      },
    },
    description: "Base schema for POI data ingestion",
    isActive: true,
    createdAt: "2023-09-01T12:00:00Z",
    updatedAt: "2023-09-01T12:00:00Z",
  },
  {
    id: "ws-002",
    name: "real-estate-v1",
    version: 1,
    jsonSchema: {
      type: "object",
      required: ["title", "price", "location"],
      properties: {
        title: { type: "string" },
        price: { type: "number" },
        location: { type: "string" },
      },
    },
    description: "Schema for real estate listing ingestion",
    isActive: true,
    createdAt: "2023-09-02T12:00:00Z",
    updatedAt: "2023-09-02T12:00:00Z",
  },
  {
    id: "ws-003",
    name: "poi-v2",
    version: 2,
    jsonSchema: {
      type: "object",
      required: ["name", "lat", "lng", "category"],
      properties: {
        name: { type: "string" },
        lat: { type: "number" },
        lng: { type: "number" },
        category: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
      },
    },
    description: null,
    isActive: false,
    createdAt: "2023-09-10T12:00:00Z",
    updatedAt: "2023-09-10T12:00:00Z",
  },
];

export async function fetchWorkerSchemas(params?: WorkerSchemasParams): Promise<WorkerSchemasResponse> {
  try {
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 20;
    const res = await fetch(`${API_ENDPOINT}?limit=${pageSize}&offset=${(page - 1) * pageSize}`);
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch {
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 20;
    const start = (page - 1) * pageSize;
    return {
      data: fakeSchemas.slice(start, start + pageSize),
      total: fakeSchemas.length,
      limit: pageSize,
      offset: start,
    };
  }
}

export async function createWorkerSchema(request: CreateWorkerSchemaRequest): Promise<WorkerSchema> {
  try {
    const res = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch {
    const existing = fakeSchemas.filter((s) => s.name === request.name);
    const newSchema: WorkerSchema = {
      id: `ws-${Date.now()}`,
      name: request.name,
      version: existing.length + 1,
      jsonSchema: request.jsonSchema,
      description: request.description || null,
      isActive: request.isActive,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    fakeSchemas.push(newSchema);
    return newSchema;
  }
}

export async function updateWorkerSchema(id: string, request: UpdateWorkerSchemaRequest): Promise<WorkerSchema> {
  try {
    const res = await fetch(`${API_ENDPOINT}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  } catch {
    const schema = fakeSchemas.find((s) => s.id === id);
    if (!schema) throw new Error("Schema not found");
    schema.jsonSchema = request.jsonSchema;
    schema.description = request.description || null;
    schema.isActive = request.isActive;
    schema.updatedAt = new Date().toISOString();
    return schema;
  }
}
