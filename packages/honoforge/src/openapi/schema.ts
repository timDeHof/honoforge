import type { ZodType } from "zod";

import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// Extend Zod with OpenAPI support at module load time
extendZodWithOpenApi(z);

// Re-export for consumers who need to add .openapi() metadata to their schemas
export { extendZodWithOpenApi as extendZodWithOpenAPI };

export interface ZodToOpenAPIOptions {
  name?: string;
  description?: string;
}

/** Minimal interface for Zod's internal _def structure. */
interface ZodDefLike {
  typeName: string;
  type?: ZodType;
  innerType?: ZodType;
  schema?: ZodType;
  shape?: () => Record<string, ZodType>;
  values?: string[] | Record<string, string>;
  value?: unknown;
  options?: ZodType[];
  items?: ZodType[];
  valueType?: ZodType;
}

/**
 * Convert a Zod schema to an OpenAPI 3.x schema object.
 *
 * @param schema - The Zod schema to convert
 * @param options - Optional name and description for the schema
 * @returns OpenAPI 3.x schema object
 */
export function zodToOpenAPI(
  schema: ZodType,
  options?: ZodToOpenAPIOptions,
): Record<string, unknown> {
  return convertZodSchema(schema, options?.description);
}

/**
 * Internal converter that transforms a Zod schema into an OpenAPI schema object.
 */
function convertZodSchema(
  schema: ZodType,
  description?: string,
): Record<string, unknown> {
  const zodDef = (schema as unknown as { _def: ZodDefLike })._def;

  if (!zodDef) {
    return description ? { description } : {};
  }

  const typeName = zodDef.typeName;

  let result: Record<string, unknown>;

  switch (typeName) {
    case "ZodString":
      result = { type: "string" };
      break;

    case "ZodNumber":
      result = { type: "number" };
      break;

    case "ZodBoolean":
      result = { type: "boolean" };
      break;

    case "ZodBigInt":
      result = { type: "integer" };
      break;

    case "ZodArray":
      result = {
        type: "array",
        items: convertZodSchema(zodDef.type!),
      };
      break;

    case "ZodObject": {
      const shape = zodDef.shape!();
      const properties: Record<string, unknown> = {};
      const required: string[] = [];

      for (const [key, value] of Object.entries(shape)) {
        const valueDef = (value as unknown as { _def: ZodDefLike })._def;
        properties[key] = convertZodSchema(value);
        if (valueDef.typeName !== "ZodOptional") {
          required.push(key);
        }
      }

      result = { type: "object", properties };
      if (required.length > 0) {
        result.required = required;
      }
      break;
    }

    case "ZodOptional":
      result = convertZodSchema(zodDef.innerType!);
      break;

    case "ZodNullable":
      result = { ...convertZodSchema(zodDef.innerType!), nullable: true };
      break;

    case "ZodEnum":
      result = { type: "string", enum: zodDef.values };
      break;

    case "ZodNativeEnum":
      result = { type: "string", enum: Object.values(zodDef.values!) };
      break;

    case "ZodLiteral":
      result = { type: typeof zodDef.value, enum: [zodDef.value] };
      break;

    case "ZodUnion":
    case "ZodDiscriminatedUnion":
      result = {
        oneOf: zodDef.options!.map(opt => convertZodSchema(opt)),
      };
      break;

    case "ZodTuple":
      result = {
        type: "array",
        items: zodDef.items!.map(item => convertZodSchema(item)),
      };
      break;

    case "ZodRecord":
      result = {
        type: "object",
        additionalProperties: convertZodSchema(zodDef.valueType!),
      };
      break;

    case "ZodMap":
      result = { type: "object", additionalProperties: true };
      break;

    case "ZodSet":
      result = {
        type: "array",
        items: convertZodSchema(zodDef.valueType!),
        uniqueItems: true,
      };
      break;

    case "ZodDate":
      result = { type: "string", format: "date-time" };
      break;

    case "ZodNull":
      result = { type: "null" };
      break;

    case "ZodUnknown":
    case "ZodAny":
      result = {};
      break;

    case "ZodNever":
      result = { not: {} };
      break;

    case "ZodDefault":
      result = convertZodSchema(zodDef.innerType!);
      break;

    case "ZodEffects":
      // For .transform(), .refine(), .pipe() — convert the inner type
      result = convertZodSchema(zodDef.schema ?? zodDef.innerType!);
      break;

    default:
      result = {};
  }

  if (description) {
    result.description = description;
  }

  return result;
}
