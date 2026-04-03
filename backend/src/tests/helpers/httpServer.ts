import { Application } from "express";
import { AddressInfo } from "node:net";

export interface TestHttpServer {
  baseUrl: string;
  close: () => Promise<void>;
}

export const startTestHttpServer = async (
  app: Application,
): Promise<TestHttpServer> => {
  const server = app.listen(0, "127.0.0.1");

  await new Promise<void>((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const close = async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  };

  return { baseUrl, close };
};
