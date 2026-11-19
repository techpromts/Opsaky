import "server-only";
import { headers } from "next/headers";
import { originFromHeaders } from "../urls";

export async function getRequestOrigin(): Promise<string> {
  return originFromHeaders(await headers());
}
