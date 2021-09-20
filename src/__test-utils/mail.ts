// Copyright (c) 2021 Technologiestiftung Berlin & Fabian Morón Zirfas
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import fetch, { Headers } from "node-fetch";
interface Message {
  mailbox: string;
  id: string;
  from: string;
  to: string[];
  subject: string;
  date: string;
  "posix-millis": number;
  size: number;
  seen: boolean;
}

export async function purgeInbox(inbox: string): Promise<void> {
  const response = await fetch(
    `http://localhost:9000/api/v1/mailbox/${inbox}`,
    {
      method: "DELETE",
    }
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text);
  }
  const text = (await response.text()) as string;
  if (response.status !== 200) {
    throw new Error(text);
  }
}
export async function checkInbox(inbox: string): Promise<Message[]> {
  const response = await fetch(`http://localhost:9000/api/v1/mailbox/${inbox}`);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text);
  }
  const json = (await response.json()) as Message[];
  await purgeInbox(inbox);
  return json;
}
