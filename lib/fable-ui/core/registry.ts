import type {
  AgentResourceManifest,
  DataActionInput,
  DataActionResult,
  DataQuery,
  DataQueryResult,
  DataRow,
  DataSourceContext,
  DataSourceDriver,
  ResourceConfig,
  ResourceRuntime,
} from "./types"

function warnOnce(message: string) {
  if (process.env.NODE_ENV === "development") {
    console.warn(message)
  }
}

export function defineResource<TSource, Row extends DataRow = DataRow>(
  resource: ResourceConfig<TSource, Row>,
) {
  return resource
}

export function defineResourceRuntime<Row extends DataRow = DataRow>(runtime: ResourceRuntime<Row>) {
  return runtime
}

export class DataSourceRegistry {
  private drivers = new Map<string, DataSourceDriver<any, any>>()
  private resources = new Map<string, ResourceConfig<any, any>>()
  private runtimes = new Map<string, ResourceRuntime<any>>()

  registerDriver(id: string, driver: DataSourceDriver<any, any>) {
    const existing = this.drivers.get(id)

    if (existing) {
      if (existing !== driver) {
        warnOnce(`[fable-ui] Driver "${id}" is already registered. Keeping the latest registration.`)
      }
    }

    this.drivers.set(id, driver)
    return this
  }

  registerResource<TSource, Row extends DataRow = DataRow>(resource: ResourceConfig<TSource, Row>) {
    const existing = this.resources.get(resource.id)

    if (existing) {
      if (JSON.stringify(existing) !== JSON.stringify(resource)) {
        warnOnce(`[fable-ui] Resource "${resource.id}" is already registered. Keeping the latest registration.`)
      }
    }

    this.resources.set(resource.id, resource)
    return this
  }

  registerResourceRuntime<Row extends DataRow = DataRow>(resourceId: string, runtime: ResourceRuntime<Row>) {
    const existing = this.runtimes.get(resourceId)

    if (existing && existing !== runtime) {
      warnOnce(`[fable-ui] Runtime for resource "${resourceId}" is already registered. Keeping the latest registration.`)
    }

    this.runtimes.set(resourceId, runtime)
    return this
  }

  getResource(resourceId: string) {
    return this.resources.get(resourceId)
  }

  listResources() {
    return Array.from(this.resources.values())
  }

  resolve(resourceId: string) {
    const resource = this.resources.get(resourceId)

    if (!resource) {
      throw new Error(`Fable resource "${resourceId}" is not registered.`)
    }

    const driver = this.drivers.get(resource.driver)

    if (!driver) {
      throw new Error(`Fable driver "${resource.driver}" for resource "${resourceId}" is not registered.`)
    }

    return {
      resource,
      driver,
      runtime: this.runtimes.get(resourceId),
    }
  }

  async list<Row extends DataRow = DataRow>(
    resourceId: string,
    query: DataQuery = {},
    ctx: DataSourceContext = {},
  ): Promise<DataQueryResult<Row>> {
    const { resource, driver, runtime } = this.resolve(resourceId)
    const result = runtime?.list
      ? await runtime.list(resource, query, ctx)
      : await driver.list(resource, query, ctx, runtime)

    return {
      ...result,
      rows: resource.transformRows ? resource.transformRows(result.rows) : result.rows,
    }
  }

  async get<Row extends DataRow = DataRow>(
    resourceId: string,
    rowId: string,
    ctx: DataSourceContext = {},
  ): Promise<Row | null> {
    const { resource, driver, runtime } = this.resolve(resourceId)

    if (runtime?.get) {
      return runtime.get(resource, rowId, ctx) as Promise<Row | null> | Row | null
    }

    return driver.get ? driver.get(resource, rowId, ctx, runtime) : null
  }

  async executeAction(
    input: DataActionInput,
    ctx: DataSourceContext = {},
  ): Promise<DataActionResult> {
    const { resource, driver, runtime } = this.resolve(input.resourceId)

    if (runtime?.executeAction) {
      return runtime.executeAction(input, resource, ctx)
    }

    if (!driver.executeAction) {
      throw new Error(`Fable resource "${input.resourceId}" does not support actions.`)
    }

    return driver.executeAction(input, resource, ctx, runtime)
  }

  getAgentResourceManifest(): AgentResourceManifest {
    return {
      resources: this.listResources().map((resource) => ({
        id: resource.id,
        label: resource.label,
        entityLabel: resource.entityLabel,
        description: resource.agent?.description,
        aliases: resource.agent?.aliases,
        useWhen: resource.agent?.useWhen,
        avoidWhen: resource.agent?.avoidWhen,
        columns: resource.columns.map(({ key, label, type, description }) => ({
          key,
          label,
          type,
          description,
        })),
        filters: resource.filters?.map(({ key, label, type, options }) => ({
          key,
          label,
          type,
          options,
        })),
        sort: resource.sort,
        actions: resource.actions?.map(({ id, label, description, variant, requiresConfirmation, fields }) => ({
          id,
          label,
          description,
          variant,
          requiresConfirmation,
          fields,
        })),
      })),
    }
  }
}

export const fableRegistry = new DataSourceRegistry()
