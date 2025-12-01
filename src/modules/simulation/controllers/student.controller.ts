import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Sse,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StudentGateway } from '../gateways/student.gateway';
import { StudentService } from '../services';

// DTOs
export class StartTestDto {
  testId: string;
  studentId: string;
}

export class PauseTestDto {
  testId: string;
  studentId: string;
}

export class ResumeTestDto {
  testId: string;
  studentId: string;
}

@Controller('tests')
export class StudentController {
  private readonly logger = new Logger(StudentController.name);

  constructor(
    private studentService: StudentService,
    private sseGateway: StudentGateway,
  ) {}

  /**
   * SSE endpoint for time events
   * GET /tests/:testId/:studentId/stream
   *
   * Usage:
   * const eventSource = new EventSource(`/tests/${testId}/${studentId}/stream`);
   * eventSource.addEventListener('message', (event) => {
   *   const data = JSON.parse(event.data);
   *   // Handle time updates
   * });
   */
  @Get(':testId/:studentId/stream')
  @Sse()
  streamTestTime(
    @Param('testId') testId: string,
    @Param('studentId') studentId: string,
  ): Observable<MessageEvent> {
    this.logger.log(
      `SSE stream started for test ${testId}, student ${studentId}`,
    );

    // Register the SSE connection and get the subject
    const subject = this.sseGateway.registerConnection(testId, studentId);

    // Handle reconnection: when a student reconnects via SSE, we need to check test status
    this.studentService
      .handleStudentReconnection(testId, studentId)
      .catch((error) => {
        this.logger.error(
          `Error handling reconnection for test ${testId}, student ${studentId}`,
          error,
        );
      });

    // Convert the subject's data to MessageEvent format for SSE
    return subject.pipe(
      map(
        (data) =>
          ({
            data,
          }) as MessageEvent,
      ),
    );
  }
}
