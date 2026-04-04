import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

const projectRoot = resolve(__dirname);
const appRoot = resolve(projectRoot, "app");

export default defineConfig({
	resolve: {
		alias: [
			{
				find: /^~\//,
				replacement: `${appRoot}/`,
			},
			{
				find: /^~~\//,
				replacement: `${projectRoot}/`,
			},
		],
	},
	test: {
		environment: "node",
		include: ["**/*.test.ts"],
	},
});
