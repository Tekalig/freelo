import { writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

const OPENAPI_URL = 'http://localhost:3000/api/docs-json';
const OUTPUT_FILE = './insomnia-collection.json';

type OpenApiParameter = {
  name: string;
  in: string;
  description?: string;
  example?: unknown;
  required?: boolean;
};

type OpenApiOperation = {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: OpenApiParameter[];
  requestBody?: {
    content?: {
      'application/json'?: unknown;
    };
  };
};

type OpenApiSpec = {
  openapi: string;
  info?: {
    title?: string;
    description?: string;
    version?: string;
  };
  servers?: Array<{
    url: string;
  }>;
  paths?: Record<string, Record<string, OpenApiOperation | unknown>>;
};

type InsomniaResource = Record<string, unknown>;

function generateId(prefix: string): string {
  return `${prefix}_${randomBytes(4).toString('hex')}`;
}

function getBaseUrl(spec: OpenApiSpec): string {
  if (spec.servers?.length) {
    return spec.servers[0].url;
  }

  return 'http://localhost:3000';
}

async function main(): Promise<void> {
  console.log(`Fetching OpenAPI spec from ${OPENAPI_URL}...`);

  const response = await fetch(OPENAPI_URL);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch OpenAPI spec: ${response.status} ${response.statusText}`,
    );
  }

  const spec = (await response.json()) as OpenApiSpec;

  const workspaceId = 'WORKSPACE_ID';
  const now = Date.now();
  const baseUrl = getBaseUrl(spec);

  const resources: InsomniaResource[] = [];

  // --------------------------------------------------
  // Workspace
  // --------------------------------------------------

  resources.push({
    _id: workspaceId,
    parentId: null,
    modified: now,
    created: now,
    name: spec.info?.title ?? 'API Collection',
    description: spec.info?.description ?? '',
    scope: 'collection',
    _type: 'workspace',
  });

  // --------------------------------------------------
  // Tag -> Folder mapping
  // --------------------------------------------------

  const folders = new Map<string, string>();

  function getOrCreateFolder(tag: string): string {
    const existingFolder = folders.get(tag);

    if (existingFolder) {
      return existingFolder;
    }

    const folderId = generateId(
      `folder_${tag.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
    );

    resources.push({
      _id: folderId,
      parentId: workspaceId,
      modified: now,
      created: now,
      name: tag,
      description: '',
      environment: {},
      environmentPropertyOrder: null,
      metaSortKey: folders.size,
      _type: 'request_group',
    });

    folders.set(tag, folderId);

    return folderId;
  }

  // --------------------------------------------------
  // HTTP methods
  // --------------------------------------------------

  const httpMethods = [
    'get',
    'post',
    'put',
    'patch',
    'delete',
    'options',
    'head',
    'trace',
  ];

  let requestCount = 0;

  // --------------------------------------------------
  // Process OpenAPI paths
  // --------------------------------------------------

  for (const [path, pathItem] of Object.entries(spec.paths ?? {})) {
    for (const [method, rawOperation] of Object.entries(pathItem)) {
      if (!httpMethods.includes(method.toLowerCase())) {
        continue;
      }

      const operation = rawOperation as OpenApiOperation;

      const tags =
        operation.tags && operation.tags.length > 0
          ? operation.tags
          : ['Other'];

      // ------------------------------------------------
      // Create request inside each tag folder
      // ------------------------------------------------

      for (const tag of tags) {
        const folderId = getOrCreateFolder(tag);

        const requestId = generateId(`request_${requestCount}`);

        const requestName =
          operation.summary ||
          operation.operationId ||
          `${method.toUpperCase()} ${path}`;

        const request: InsomniaResource = {
          _id: requestId,
          parentId: folderId,

          modified: now,
          created: now,

          url: `${baseUrl}${path}`,

          name: requestName,

          description: operation.description || operation.summary || '',

          method: method.toUpperCase(),

          body: {
            mimeType: 'application/json',
            text: '',
          },

          parameters: [],

          headers: [
            {
              name: 'Accept',
              value: 'application/json',
            },
          ],

          authentication: {},

          metaSortKey: requestCount,

          isPrivate: false,

          settingStoreCookies: true,
          settingSendCookies: true,
          settingDisableRenderRequestBody: false,
          settingEncodeUrl: true,
          settingRebuildPath: true,
          settingFollowRedirects: 'global',

          _type: 'request',
        };

        // ----------------------------------------------
        // Query parameters
        // ----------------------------------------------

        if (Array.isArray(operation.parameters)) {
          const queryParameters = operation.parameters.filter(
            (parameter) => parameter.in === 'query',
          );

          request.parameters = queryParameters.map((parameter) => ({
            id: generateId('query'),
            name: parameter.name,
            value:
              parameter.example !== undefined ? String(parameter.example) : '',
            description: parameter.description ?? '',
            disabled: false,
          }));
        }

        // ----------------------------------------------
        // Request body
        // ----------------------------------------------

        if (operation.requestBody?.content?.['application/json']) {
          request.body = {
            mimeType: 'application/json',
            text: '{}',
          };
        }

        resources.push(request);

        requestCount++;
      }
    }
  }

  // --------------------------------------------------
  // Create Insomnia export
  // --------------------------------------------------

  const insomniaExport = {
    _type: 'export',
    __export_format: 4,
    __export_date: new Date().toISOString(),
    __export_source: 'nestjs-openapi-to-insomnia',
    resources,
  };

  writeFileSync(OUTPUT_FILE, JSON.stringify(insomniaExport, null, 2), 'utf-8');

  console.log('');
  console.log('========================================');
  console.log('✅ Insomnia collection generated!');
  console.log('========================================');
  console.log(`📁 File: ${OUTPUT_FILE}`);
  console.log(`📂 Folders: ${folders.size}`);
  console.log(`📨 Requests: ${requestCount}`);
  console.log('');
  console.log('Folders:');

  for (const tag of folders.keys()) {
    console.log(`  📁 ${tag}`);
  }
}

main().catch((error: unknown) => {
  console.error('');
  console.error('❌ Failed to generate collection');

  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }

  process.exit(1);
});
