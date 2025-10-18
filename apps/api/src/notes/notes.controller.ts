import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequestWithUser } from '../common/types/request-with-user.interface';

import { StudentNoteResponseDto, CreateNoteDto, UpdateNoteDto } from './dto';
import { NotesService } from './notes.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  /**
   * GET /api/lessons/:lessonId/notes
   * Get all notes for a lesson
   */
  @Get('lessons/:lessonId/notes')
  @Roles(UserRole.STUDENT)
  async getLessonNotes(
    @Param('lessonId') lessonId: string,
    @Request() req: RequestWithUser,
  ): Promise<StudentNoteResponseDto[]> {
    return this.notesService.getLessonNotes(lessonId, req.user.id);
  }

  /**
   * POST /api/notes
   * Create a new note
   */
  @Post('notes')
  @Roles(UserRole.STUDENT)
  async createNote(
    @Body() createDto: CreateNoteDto,
    @Request() req: RequestWithUser,
  ): Promise<StudentNoteResponseDto> {
    return this.notesService.createNote(req.user.id, createDto);
  }

  /**
   * GET /api/notes/:id
   * Get a note by ID
   */
  @Get('notes/:id')
  @Roles(UserRole.STUDENT)
  async getNoteById(
    @Param('id') noteId: string,
    @Request() req: RequestWithUser,
  ): Promise<StudentNoteResponseDto> {
    return this.notesService.getNoteById(noteId, req.user.id);
  }

  /**
   * PUT /api/notes/:id
   * Update a note
   */
  @Put('notes/:id')
  @Roles(UserRole.STUDENT)
  async updateNote(
    @Param('id') noteId: string,
    @Body() updateDto: UpdateNoteDto,
    @Request() req: RequestWithUser,
  ): Promise<StudentNoteResponseDto> {
    return this.notesService.updateNote(noteId, req.user.id, updateDto);
  }

  /**
   * DELETE /api/notes/:id
   * Delete a note
   */
  @Delete('notes/:id')
  @Roles(UserRole.STUDENT)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNote(@Param('id') noteId: string, @Request() req: RequestWithUser): Promise<void> {
    return this.notesService.deleteNote(noteId, req.user.id);
  }
}
