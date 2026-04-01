import OpenAI from "openai";
import type { ChatMessage } from "./types";

const ZERO_G_RPC_URL = process.env.ZERO_G_RPC_URL || "https://evmrpc.0g.ai";
const ZERO_G_PRIVATE_KEY = process.env.ZERO_G_PRIVATE_KEY;
const ZERO_G_MODEL = process.env.ZERO_G_MODEL || "deepseek-chat";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

let cachedClient: { openai: OpenAI; model: string } | null = null;

/**
 * AI features are available if either:
 * - 0G Compute is configured (ZERO_G_PRIVATE_KEY), or
 * - OpenAI API fallback is configured (OPENAI_API_KEY) for development/testing
 */
export function isAiEnabled(): boolean {
  return !!ZERO_G_PRIVATE_KEY || !!OPENAI_API_KEY;
}

async function getClient(): Promise<{ openai: OpenAI; model: string }> {
  if (cachedClient) return cachedClient;

  // Fallback: use OpenAI API directly for development/testing
  if (!ZERO_G_PRIVATE_KEY && OPENAI_API_KEY) {
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    cachedClient = { openai, model: "gpt-4o-mini" };
    return cachedClient;
  }

  if (!ZERO_G_PRIVATE_KEY) {
    throw new Error("ZERO_G_PRIVATE_KEY is not configured");
  }

  const { ethers } = await import("ethers");
  const { createZGComputeNetworkBroker } = await import("@0glabs/0g-serving-broker");

  const provider = new ethers.JsonRpcProvider(ZERO_G_RPC_URL);
  const wallet = new ethers.Wallet(ZERO_G_PRIVATE_KEY, provider);
  const broker = await createZGComputeNetworkBroker(wallet);

  const services = await broker.inference.listService();
  const service = services.find(
    (s: { model: string }) => s.model.toLowerCase().includes(ZERO_G_MODEL.toLowerCase())
  );

  if (!service) {
    throw new Error(
      `No 0G Compute service found for model "${ZERO_G_MODEL}". ` +
      `Available: ${services.map((s: { model: string }) => s.model).join(", ")}`
    );
  }

  const { endpoint, model } = await broker.inference.getServiceMetadata(
    service.provider
  );
  await broker.inference.acknowledgeProviderSigner(service.provider);

  const openai = new OpenAI({
    baseURL: `${endpoint}/v1/proxy`,
    apiKey: "0g-compute",
  });

  cachedClient = { openai, model };
  return cachedClient;
}

export async function getCompletion(messages: ChatMessage[]): Promise<string> {
  const { openai, model } = await getClient();

  const response = await openai.chat.completions.create({
    model,
    messages,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from 0G Compute");
  }

  return content;
}

export async function getJsonCompletion<T>(messages: ChatMessage[]): Promise<T> {
  const { openai, model } = await getClient();

  const response = await openai.chat.completions.create({
    model,
    messages,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from 0G Compute");
  }

  return JSON.parse(content) as T;
}
