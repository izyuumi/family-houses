/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as cars from "../cars.js";
import type * as groceryItems from "../groceryItems.js";
import type * as http from "../http.js";
import type * as integrationSettings from "../integrationSettings.js";
import type * as invitations from "../invitations.js";
import type * as locks from "../locks.js";
import type * as permissions from "../permissions.js";
import type * as profiles from "../profiles.js";
import type * as properties from "../properties.js";
import type * as propertyItems from "../propertyItems.js";
import type * as propertyMembers from "../propertyMembers.js";
import type * as propertyNotes from "../propertyNotes.js";
import type * as switchbot from "../switchbot.js";
import type * as utils from "../utils.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  cars: typeof cars;
  groceryItems: typeof groceryItems;
  http: typeof http;
  integrationSettings: typeof integrationSettings;
  invitations: typeof invitations;
  locks: typeof locks;
  permissions: typeof permissions;
  profiles: typeof profiles;
  properties: typeof properties;
  propertyItems: typeof propertyItems;
  propertyMembers: typeof propertyMembers;
  propertyNotes: typeof propertyNotes;
  switchbot: typeof switchbot;
  utils: typeof utils;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
