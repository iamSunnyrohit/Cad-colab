const API_BASE = "http://localhost:4000/api";

export async function listDocuments() {
  const res = await fetch(`${API_BASE}/documents`);
  return res.json();
}

export async function createDocument(name: string) {
  const res = await fetch(`${API_BASE}/documents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  });
  return res.json();
}

export async function loadObjects(docId: string) {
  const res = await fetch(`${API_BASE}/documents/${docId}/objects`);
  return res.json();
}

export async function createObject(docId: string, type: string, props: unknown) {
  const res = await fetch(`${API_BASE}/documents/${docId}/objects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, props })
  });
  return res.json();
}

export async function updateObject(docId: string, objectId: string, props: unknown) {
  const res = await fetch(`${API_BASE}/documents/${docId}/objects/${objectId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ props })
  });
  return res.json();
}

export async function fetchMissedOps(docId: string, sinceSeq: number) {
  const res = await fetch(`${API_BASE}/documents/${docId}/ops?sinceSeq=${sinceSeq}`);
  return res.json();
}
