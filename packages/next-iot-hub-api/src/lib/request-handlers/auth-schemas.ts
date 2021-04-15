import S from "fluent-json-schema";

export const postTokenBodySchema = S.object()
  .id("/auth")
  .title("for token generation POST")
  .prop("userId", S.string().required())
  .prop("projectId", S.number().minimum(1).required())
  .prop("description", S.string().minLength(3).required());

export const getTokenQuerySchema = S.object()
  .id("/auth?projectId=123")
  .title("verify email that has a token as query")
  .prop("projectId", S.number().required());
export const deleteTokenBodySchema = S.object()
  .id("/auth")
  .title("for token generation POST")
  .prop("tokenId", S.number().minimum(1).required());
