import { EntityManager } from "@mikro-orm/postgresql";
import { Request, Response } from 'express'
import session from "express-session";
export interface MyContext {
  em: EntityManager;
  req: Request & { session: session.Session & Partial<session.SessionData> },
  res: Response
}