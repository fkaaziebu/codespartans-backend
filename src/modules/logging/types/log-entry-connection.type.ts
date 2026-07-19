import { ObjectType } from '@nestjs/graphql';
import { Paginated } from 'src/helpers/types/pagination.type';
import { LogEntry } from './log-entry.type';

@ObjectType('LogEntryConnection')
export class LogEntryConnection extends Paginated(LogEntry) {}
