// @ts-nocheck
import * as __fd_glob_11 from "../content/docs/theming.mdx?collection=docs"
import * as __fd_glob_10 from "../content/docs/streaming.mdx?collection=docs"
import * as __fd_glob_9 from "../content/docs/security.mdx?collection=docs"
import * as __fd_glob_8 from "../content/docs/introduction.mdx?collection=docs"
import * as __fd_glob_7 from "../content/docs/installation.mdx?collection=docs"
import * as __fd_glob_6 from "../content/docs/evaluation.mdx?collection=docs"
import * as __fd_glob_5 from "../content/docs/custom-blocks.mdx?collection=docs"
import * as __fd_glob_4 from "../content/docs/blocks.mdx?collection=docs"
import * as __fd_glob_3 from "../content/docs/architecture.mdx?collection=docs"
import * as __fd_glob_2 from "../content/docs/agent-setup.mdx?collection=docs"
import * as __fd_glob_1 from "../content/docs/actions.mdx?collection=docs"
import { default as __fd_glob_0 } from "../content/docs/meta.json?collection=docs"
import { server } from 'fumadocs-mdx/runtime/server';
import type * as Config from '../source.config';

const create = server<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>({"doc":{"passthroughs":["extractedReferences"]}});

export const docs = await create.docs("docs", "content/docs", {"meta.json": __fd_glob_0, }, {"actions.mdx": __fd_glob_1, "agent-setup.mdx": __fd_glob_2, "architecture.mdx": __fd_glob_3, "blocks.mdx": __fd_glob_4, "custom-blocks.mdx": __fd_glob_5, "evaluation.mdx": __fd_glob_6, "installation.mdx": __fd_glob_7, "introduction.mdx": __fd_glob_8, "security.mdx": __fd_glob_9, "streaming.mdx": __fd_glob_10, "theming.mdx": __fd_glob_11, });