import "server-only";

import { OpenPanel } from "@openpanel/nextjs";

export const op = new OpenPanel({
  clientId: process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID as string,
  clientSecret: process.env.OPENPANEL_CLIENT_SECRET as string,
  apiUrl: process.env.NEXT_PUBLIC_OPENPANEL_API_URL,
});
