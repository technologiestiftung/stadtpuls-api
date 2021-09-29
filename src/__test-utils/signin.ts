import fetch from "node-fetch";

export async function signin({
  email,
  url,
  anonKey,
}: {
  email: string;
  url: URL;
  anonKey: string;
}): Promise<void> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    apikey: anonKey,
  };
  const body = JSON.stringify({ email });
  const response = await fetch(url.href, {
    method: "POST",
    headers,
    body,
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  if (response.status !== 200) {
    throw new Error(await response.json());
  }
}
