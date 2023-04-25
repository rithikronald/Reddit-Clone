import { MikroORM } from "@mikro-orm/core";
import { ApolloServer } from "apollo-server-express";
import RedisStore from "connect-redis";
import express from "express";
import session from "express-session";
import { RedisClientOptions, createClient } from "redis";
import "reflect-metadata";
import { buildSchema } from "type-graphql";
import microConfig from "./mikro-orm.config";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import { __prod__ } from "./constants";

const main = async () => {
  const orm = await MikroORM.init(microConfig);
  await orm.getMigrator().up();
  const app = express();

  let redisClient = createClient();
  redisClient.connect().catch(console.error);

  let redisStore = new RedisStore:<any>({
    client: redisClient,
    prefix: "myapp:",
  });

  // Initialize sesssion storage.
  app.use(
    session({
      store: redisStore,
      resave: false, // required: force lightweight session keep alive (touch)
      saveUninitialized: false, // recommended: only save session when data exists
      secret: "eqrqwrqerweqrqrqrqweq",
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, //10 years
        sameSite: "lax",
        httpOnly: true,
        secure: __prod__
      }
    }),
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }) => ({ em: orm.em, req, res }),
  });
  await apolloServer.start();

  apolloServer.applyMiddleware({ app });

  app.listen(4000, () => {
    console.log("listening to port: 4000");
  });
};

main();
