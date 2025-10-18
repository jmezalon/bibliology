/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import {
  StudentNoteResponseDto,
  CreateNoteDto,
  UpdateNoteDto,
} from './dto';

@Injectable()
export class NotesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all notes for a lesson (for current student)
   */
  async getLessonNotes(
    lessonId: string,
    studentId: string,
  ): Promise<StudentNoteResponseDto[]> {
    const notes = await this.prisma.studentNote.findMany({
      where: {
        lesson_id: lessonId,
        student_id: studentId,
      },
      orderBy: {
        slide_index: 'asc',
      },
    });

    return notes.map((note) => this.mapToResponseDto(note));
  }

  /**
   * Create a new note
   */
  async createNote(
    studentId: string,
    createDto: CreateNoteDto,
  ): Promise<StudentNoteResponseDto> {
    // Verify lesson exists
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: createDto.lesson_id },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    const note = await this.prisma.studentNote.create({
      data: {
        student_id: studentId,
        lesson_id: createDto.lesson_id,
        slide_index: createDto.slide_index,
        note_text: createDto.note_text,
      },
    });

    return this.mapToResponseDto(note);
  }

  /**
   * Update a note
   */
  async updateNote(
    noteId: string,
    studentId: string,
    updateDto: UpdateNoteDto,
  ): Promise<StudentNoteResponseDto> {
    const note = await this.prisma.studentNote.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    if (note.student_id !== studentId) {
      throw new ForbiddenException('You do not have permission to edit this note');
    }

    const updatedNote = await this.prisma.studentNote.update({
      where: { id: noteId },
      data: {
        note_text: updateDto.note_text,
      },
    });

    return this.mapToResponseDto(updatedNote);
  }

  /**
   * Delete a note
   */
  async deleteNote(noteId: string, studentId: string): Promise<void> {
    const note = await this.prisma.studentNote.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    if (note.student_id !== studentId) {
      throw new ForbiddenException(
        'You do not have permission to delete this note',
      );
    }

    await this.prisma.studentNote.delete({
      where: { id: noteId },
    });
  }

  /**
   * Get a single note by ID
   */
  async getNoteById(
    noteId: string,
    studentId: string,
  ): Promise<StudentNoteResponseDto> {
    const note = await this.prisma.studentNote.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    if (note.student_id !== studentId) {
      throw new ForbiddenException('You do not have permission to view this note');
    }

    return this.mapToResponseDto(note);
  }

  /**
   * Map note to response DTO
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToResponseDto(note: any): StudentNoteResponseDto {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    return {
      id: note.id,
      student_id: note.student_id,
      lesson_id: note.lesson_id,
      slide_index: note.slide_index,
      note_text: note.note_text,
      created_at: note.created_at,
      updated_at: note.updated_at,
    };
  }
}
