// @ts-nocheck
import * as __fd_glob_28 from "../content/docs/data-sources/rest.mdx?collection=docs"
import * as __fd_glob_27 from "../content/docs/data-sources/resources.mdx?collection=docs"
import * as __fd_glob_26 from "../content/docs/data-sources/overview.mdx?collection=docs"
import * as __fd_glob_25 from "../content/docs/data-sources/multiple-data-sources.mdx?collection=docs"
import * as __fd_glob_24 from "../content/docs/data-sources/firebase.mdx?collection=docs"
import * as __fd_glob_23 from "../content/docs/data-sources/actions-and-invalidation.mdx?collection=docs"
import * as __fd_glob_22 from "../content/docs/components/text-editor-card.mdx?collection=docs"
import * as __fd_glob_21 from "../content/docs/components/suggested-actions.mdx?collection=docs"
import * as __fd_glob_20 from "../content/docs/components/metric-card.mdx?collection=docs"
import * as __fd_glob_19 from "../content/docs/components/index.mdx?collection=docs"
import * as __fd_glob_18 from "../content/docs/components/form-card.mdx?collection=docs"
import * as __fd_glob_17 from "../content/docs/components/email-composer-card.mdx?collection=docs"
import * as __fd_glob_16 from "../content/docs/components/data-browser.mdx?collection=docs"
import * as __fd_glob_15 from "../content/docs/components/confirmation-card.mdx?collection=docs"
import * as __fd_glob_14 from "../content/docs/components/code-block-card.mdx?collection=docs"
import * as __fd_glob_13 from "../content/docs/components/charts.mdx?collection=docs"
import * as __fd_glob_12 from "../content/docs/architecture/system-flow.mdx?collection=docs"
import * as __fd_glob_11 from "../content/docs/architecture/security.mdx?collection=docs"
import * as __fd_glob_10 from "../content/docs/architecture/agent-routing.mdx?collection=docs"
import * as __fd_glob_9 from "../content/docs/tool-definitions.mdx?collection=docs"
import * as __fd_glob_8 from "../content/docs/registry.mdx?collection=docs"
import * as __fd_glob_7 from "../content/docs/manifests.mdx?collection=docs"
import * as __fd_glob_6 from "../content/docs/introduction.mdx?collection=docs"
import * as __fd_glob_5 from "../content/docs/installation.mdx?collection=docs"
import * as __fd_glob_4 from "../content/docs/ai-sdk-integration.mdx?collection=docs"
import { default as __fd_glob_3 } from "../content/docs/data-sources/meta.json?collection=docs"
import { default as __fd_glob_2 } from "../content/docs/components/meta.json?collection=docs"
import { default as __fd_glob_1 } from "../content/docs/architecture/meta.json?collection=docs"
import { default as __fd_glob_0 } from "../content/docs/meta.json?collection=docs"
import { server } from 'fumadocs-mdx/runtime/server';
import type * as Config from '../source.config';

const create = server<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>({"doc":{"passthroughs":["extractedReferences"]}});

export const docs = await create.docs("docs", "content/docs", {"meta.json": __fd_glob_0, "architecture/meta.json": __fd_glob_1, "components/meta.json": __fd_glob_2, "data-sources/meta.json": __fd_glob_3, }, {"ai-sdk-integration.mdx": __fd_glob_4, "installation.mdx": __fd_glob_5, "introduction.mdx": __fd_glob_6, "manifests.mdx": __fd_glob_7, "registry.mdx": __fd_glob_8, "tool-definitions.mdx": __fd_glob_9, "architecture/agent-routing.mdx": __fd_glob_10, "architecture/security.mdx": __fd_glob_11, "architecture/system-flow.mdx": __fd_glob_12, "components/charts.mdx": __fd_glob_13, "components/code-block-card.mdx": __fd_glob_14, "components/confirmation-card.mdx": __fd_glob_15, "components/data-browser.mdx": __fd_glob_16, "components/email-composer-card.mdx": __fd_glob_17, "components/form-card.mdx": __fd_glob_18, "components/index.mdx": __fd_glob_19, "components/metric-card.mdx": __fd_glob_20, "components/suggested-actions.mdx": __fd_glob_21, "components/text-editor-card.mdx": __fd_glob_22, "data-sources/actions-and-invalidation.mdx": __fd_glob_23, "data-sources/firebase.mdx": __fd_glob_24, "data-sources/multiple-data-sources.mdx": __fd_glob_25, "data-sources/overview.mdx": __fd_glob_26, "data-sources/resources.mdx": __fd_glob_27, "data-sources/rest.mdx": __fd_glob_28, });