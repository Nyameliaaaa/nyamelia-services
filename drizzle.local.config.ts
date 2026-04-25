import { defineConfig } from "drizzle-kit";

export default defineConfig({
	schema: "./src/db/schema.ts",
	out: "./drizzle",
	dialect: "sqlite",
	dbCredentials: {
		url: ".wrangler/state/v3/d1/miniflare-D1DatabaseObject/673f06d831144d1ccf03e974428ca0c79f310b33ed32fc292a80205842f64302.sqlite",
	},
});
