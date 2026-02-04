import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "../server/routes";
import { createServer } from "http";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const httpServer = createServer(app);

let routesPromise: Promise<any> | null = null;

const init = async () => {
  if (!routesPromise) {
    routesPromise = registerRoutes(httpServer, app);
  }
  await routesPromise;
};

export default async function handler(req: Request, res: Response) {
  await init();
  return app(req, res);
}
