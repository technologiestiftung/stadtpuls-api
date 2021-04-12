import { buildReply, buildRequest } from "../../__test-utils";
import { getHandler, postHandler, deleteHandler } from "./auth";
describe("Authentification request handlers", () => {
  test("should call the getHandler", async () => {
    const req = buildRequest();
    const reply = buildReply();

    await getHandler(req, reply);
    expect(reply.send).toHaveBeenCalledTimes(1);
    expect(reply.status).toHaveBeenCalledTimes(1);
    expect(reply.status).toHaveBeenCalledWith(200);
  });

  test("should call the postHandler", async () => {
    const req = buildRequest();
    const reply = buildReply();

    await postHandler(req, reply);
    expect(reply.send).toHaveBeenCalledTimes(1);
    expect(reply.status).toHaveBeenCalledTimes(1);
    expect(reply.status).toHaveBeenCalledWith(201);
  });

  test("should call the deleteHandler", async () => {
    const req = buildRequest();
    const reply = buildReply();

    await deleteHandler(req, reply);
    expect(reply.send).toHaveBeenCalledTimes(1);
    expect(reply.status).toHaveBeenCalledTimes(1);
    expect(reply.status).toHaveBeenCalledWith(204);
  });
});
