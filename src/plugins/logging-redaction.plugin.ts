import { Plugin } from '@nestjs/apollo';
import { ApolloServerPlugin, GraphQLRequestListener } from '@apollo/server';

const SENSITIVE_KEYS = new Set(['password', 'email', 'whatsapp_number']);

function redactInput(input: Record<string, unknown>) {
  for (const key of Object.keys(input)) {
    if (SENSITIVE_KEYS.has(key)) {
      input[key] = '[REDACTED]';
    }
  }
}

@Plugin()
export class LoggingRedactionPlugin implements ApolloServerPlugin {
  async requestDidStart(): Promise<GraphQLRequestListener<any>> {
    return {
      async didResolveOperation(ctx) {
        const vars = ctx.request.variables;
        if (!vars) return;

        for (const key of Object.keys(vars)) {
          if (SENSITIVE_KEYS.has(key)) vars[key] = '[REDACTED]';
        }

        const input = vars['input'];
        if (input && typeof input === 'object' && !Array.isArray(input)) {
          redactInput(input as Record<string, unknown>);
        }
      },
    };
  }
}
