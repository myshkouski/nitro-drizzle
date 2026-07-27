import type { Schema, Connector } from "nitro-drizzle/drivers";
import type { Variant } from "nitro-drizzle/shared";

declare module "nitro-drizzle/shared" {
  type ConnectorSpecifier = { name: string; driver: string; dialect: string };
  type ConnectorVariants = Variant<Connector<string, any, Schema, {}>, ConnectorSpecifier>;
}

export {};
