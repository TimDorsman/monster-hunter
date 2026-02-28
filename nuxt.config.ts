// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
	ssr: false,
	compatibilityDate: "2025-07-15",
	devtools: { enabled: true },
	modules: ["@nuxt/ui", "@nuxt/image"],
	components: [
		{
			path: "~/components",
			pathPrefix: false,
		},
	],
	css: ["~/assets/css/main.css"],
	vite: {
		plugins: [tailwindcss()],
	},
});
