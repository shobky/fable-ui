// source.config.ts
import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import rehypePrettyCode from "rehype-pretty-code";

// lib/highlight-code.ts
import { LRUCache } from "lru-cache";
import { codeToHtml } from "shiki";
var highlightCache = new LRUCache({
  max: 500,
  ttl: 1e3 * 60 * 60
  // 1 hour.
});
var transformers = [
  {
    code(node) {
      if (node.tagName === "code") {
        const raw = this.source;
        node.properties["__raw__"] = raw;
        if (raw.startsWith("npm install")) {
          node.properties["__npm__"] = raw;
          node.properties["__yarn__"] = raw.replace("npm install", "yarn add");
          node.properties["__pnpm__"] = raw.replace("npm install", "pnpm add");
          node.properties["__bun__"] = raw.replace("npm install", "bun add");
        } else if (raw.startsWith("npx create-")) {
          node.properties["__npm__"] = raw;
          node.properties["__yarn__"] = raw.replace(
            "npx create-",
            "yarn create "
          );
          node.properties["__pnpm__"] = raw.replace(
            "npx create-",
            "pnpm create "
          );
          node.properties["__bun__"] = raw.replace("npx", "bunx --bun");
        } else if (raw.startsWith("npm create")) {
          node.properties["__npm__"] = raw;
          node.properties["__yarn__"] = raw.replace("npm create", "yarn create");
          node.properties["__pnpm__"] = raw.replace("npm create", "pnpm create");
          node.properties["__bun__"] = raw.replace("npm create", "bun create");
        } else if (raw.startsWith("npx")) {
          node.properties["__npm__"] = raw;
          node.properties["__yarn__"] = raw.replace("npx", "yarn dlx");
          node.properties["__pnpm__"] = raw.replace("npx", "pnpm dlx");
          node.properties["__bun__"] = raw.replace("npx", "bunx --bun");
        } else if (raw.startsWith("npm run")) {
          node.properties["__npm__"] = raw;
          node.properties["__yarn__"] = raw.replace("npm run", "yarn");
          node.properties["__pnpm__"] = raw.replace("npm run", "pnpm");
          node.properties["__bun__"] = raw.replace("npm run", "bun");
        }
      }
    }
  }
];

// source.config.ts
var source_config_default = defineConfig({
  mdxOptions: {
    rehypePlugins: (plugins) => {
      plugins.shift();
      plugins.push([
        rehypePrettyCode,
        {
          theme: {
            dark: "github-dark",
            light: "github-light-default"
          },
          transformers
        }
      ]);
      return plugins;
    }
  }
});
var docs = defineDocs({
  dir: "content/docs"
  // TODO: Fix this when we upgrade to zod v4.
  // docs: {
  //   schema: frontmatterSchema.extend({
  //     links: z.optional(
  //       z.object({
  //         doc: z.string().optional(),
  //         api: z.string().optional(),
  //       })
  //     ),
  //   }),
  // },
});
export {
  source_config_default as default,
  docs
};
