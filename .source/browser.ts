// @ts-nocheck
import { browser } from 'fumadocs-mdx/runtime/browser';
import type * as Config from '../source.config';

const create = browser<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>();
const browserCollections = {
  docs: create.doc("docs", {"actions.mdx": () => import("../content/docs/actions.mdx?collection=docs"), "agent-setup.mdx": () => import("../content/docs/agent-setup.mdx?collection=docs"), "architecture.mdx": () => import("../content/docs/architecture.mdx?collection=docs"), "blocks.mdx": () => import("../content/docs/blocks.mdx?collection=docs"), "custom-blocks.mdx": () => import("../content/docs/custom-blocks.mdx?collection=docs"), "evaluation.mdx": () => import("../content/docs/evaluation.mdx?collection=docs"), "installation.mdx": () => import("../content/docs/installation.mdx?collection=docs"), "introduction.mdx": () => import("../content/docs/introduction.mdx?collection=docs"), "security.mdx": () => import("../content/docs/security.mdx?collection=docs"), "streaming.mdx": () => import("../content/docs/streaming.mdx?collection=docs"), "theming.mdx": () => import("../content/docs/theming.mdx?collection=docs"), }),
};
export default browserCollections;