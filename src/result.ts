export type ResultError = { reason: string };
export type ActioResultError = ResultError & { affectedModule: "modbus" | "database" | "mapper" };

export type Result<S, E extends ResultError> = [E, null] | [null, S];
export type ActionResult<
  S,
  E extends { reason: string; affectedModule: string },
> = Result<S, E>;

export const OkResult = <S>(data: S): Result<S, never> => [null, data];
export const ErrResult = <E extends ResultError>(
  error: E,
): Result<never, E> => [error, null];

export const OkActionResult = <S>(data: S): Result<S, never> => [null, data];
export const ErrActionResult = <E extends ActioResultError>(
  error: E,
): Result<never, E> => [error, null];
