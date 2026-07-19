import { Plugin } from '@nestjs/apollo';
import {
  ApolloServerPlugin,
  GraphQLRequestContext,
  GraphQLRequestListener,
} from '@apollo/server';

const REDACTED = '[REDACTED]';
// SEC-001: same fields redacted at the pino level (logging.module.ts) — kept
// in sync here since GraphQL variables are logged as a structured object,
// not a string pino's own `redact.paths` can pattern-match against.
const SENSITIVE_KEYS = new Set(['email', 'name', 'pin', 'password']);

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => [
        key,
        SENSITIVE_KEYS.has(key) ? REDACTED : redact(val),
      ]),
    );
  }
  return value;
}

@Plugin()
export class LoggingRedactionPlugin implements ApolloServerPlugin {
  async requestDidStart(
    requestContext: GraphQLRequestContext<any>,
  ): Promise<GraphQLRequestListener<any>> {
    const req = requestContext.contextValue?.req;
    const log = req?.log;
    const start = Date.now();
    let operationName: string | null | undefined;

    return {
      async didResolveOperation(ctx) {
        operationName = ctx.operationName;
        log?.info(
          {
            operationName,
            variables: redact(ctx.request.variables),
          },
          'graphql.operation.start',
        );
      },

      async willSendResponse(ctx) {
        const durationMs = Date.now() - start;
        const errors = ctx.errors;

        if (errors?.length) {
          log?.error(
            {
              operationName,
              durationMs,
              errors: errors.map((error) => error.message),
            },
            'graphql.operation.error',
          );
          return;
        }

        log?.info({ operationName, durationMs }, 'graphql.operation.end');
      },
    };
  }
}
