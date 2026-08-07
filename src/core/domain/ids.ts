declare const entityIdBrand: unique symbol;

export type EntityId<TKind extends string> = string & {
  readonly [entityIdBrand]: TKind;
};

const SAFE_KIND = /^[a-z][a-z0-9-]*$/;

export function asEntityId<TKind extends string>(kind: TKind, value: string): EntityId<TKind> {
  if (!SAFE_KIND.test(kind)) {
    throw new TypeError(`Invalid entity kind: ${kind}`);
  }

  if (!value.startsWith(`${kind}_`) || value.length <= kind.length + 1) {
    throw new TypeError(`Invalid ${kind} id: ${value}`);
  }

  return value as EntityId<TKind>;
}

export function createEntityId<TKind extends string>(
  kind: TKind,
  randomUuid: () => string = () => globalThis.crypto.randomUUID(),
): EntityId<TKind> {
  return asEntityId(kind, `${kind}_${randomUuid()}`);
}
