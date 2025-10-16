import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.activityLog.deleteMany();
  await prisma.questionAnswer.deleteMany();
  await prisma.quizSubmission.deleteMany();
  await prisma.question.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.contentBlock.deleteMany();
  await prisma.slide.deleteMany();
  await prisma.studentNote.deleteMany();
  await prisma.lessonProgress.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();

  // ============================================================================
  // CREATE USERS
  // ============================================================================
  console.log('\n👤 Creating users...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@bibliology.com',
      password_hash: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      language_pref: 'en',
    },
  });
  console.log(`  ✅ Admin: ${admin.email}`);

  const teacher = await prisma.user.create({
    data: {
      email: 'teacher@bibliology.com',
      password_hash: hashedPassword,
      name: 'Prof. Jean Dupont',
      role: 'TEACHER',
      language_pref: 'fr',
    },
  });
  console.log(`  ✅ Teacher: ${teacher.email}`);

  const studentEn = await prisma.user.create({
    data: {
      email: 'student.en@example.com',
      password_hash: hashedPassword,
      name: 'John Smith',
      role: 'STUDENT',
      language_pref: 'en',
    },
  });
  console.log(`  ✅ Student (EN): ${studentEn.email}`);

  const studentFr = await prisma.user.create({
    data: {
      email: 'student.fr@example.com',
      password_hash: hashedPassword,
      name: 'Marie Martin',
      role: 'STUDENT',
      language_pref: 'fr',
    },
  });
  console.log(`  ✅ Student (FR): ${studentFr.email}`);

  // ============================================================================
  // CREATE COURSES
  // ============================================================================
  console.log('\n📚 Creating courses...');

  const pneumatologyCourse = await prisma.course.create({
    data: {
      slug: 'pneumatology-101',
      teacher_id: teacher.id,
      title_en: 'Introduction to Pneumatology',
      title_fr: 'Introduction à la Pneumatologie',
      description_en:
        'A comprehensive study of the Holy Spirit in Scripture, covering His nature, work, and role in the life of believers.',
      description_fr:
        'Une étude complète du Saint-Esprit dans les Écritures, couvrant Sa nature, Son œuvre et Son rôle dans la vie des croyants.',
      status: 'PUBLISHED',
      category: 'Theology',
      tags: ['Pneumatology', 'Holy Spirit', 'Trinity', 'Theology'],
      estimated_hours: 8,
      difficulty: 'Intermediate',
      published_at: new Date(),
    },
  });
  console.log(`  ✅ Course: ${pneumatologyCourse.title_en}`);

  // ============================================================================
  // CREATE LESSONS
  // ============================================================================
  console.log('\n📖 Creating lessons...');

  const lesson1 = await prisma.lesson.create({
    data: {
      slug: 'pneumatology-101-lesson-1',
      course_id: pneumatologyCourse.id,
      title_en: 'Who is the Holy Spirit?',
      title_fr: 'Qui est le Saint-Esprit?',
      description_en: 'An introduction to the person and nature of the Holy Spirit.',
      description_fr: 'Une introduction à la personne et à la nature du Saint-Esprit.',
      lesson_order: 1,
      status: 'PUBLISHED',
      estimated_minutes: 30,
      published_at: new Date(),
    },
  });
  console.log(`  ✅ Lesson 1: ${lesson1.title_en}`);

  const lesson2 = await prisma.lesson.create({
    data: {
      slug: 'pneumatology-101-lesson-2',
      course_id: pneumatologyCourse.id,
      title_en: 'The Work of the Holy Spirit',
      title_fr: "L'Œuvre du Saint-Esprit",
      description_en: 'Exploring the various works and ministries of the Holy Spirit.',
      description_fr: 'Explorer les différentes œuvres et ministères du Saint-Esprit.',
      lesson_order: 2,
      status: 'PUBLISHED',
      estimated_minutes: 45,
      published_at: new Date(),
    },
  });
  console.log(`  ✅ Lesson 2: ${lesson2.title_en}`);

  const lesson3 = await prisma.lesson.create({
    data: {
      slug: 'pneumatology-101-lesson-3',
      course_id: pneumatologyCourse.id,
      title_en: 'The Gifts of the Spirit',
      title_fr: "Les Dons de l'Esprit",
      description_en: 'Understanding spiritual gifts and their purpose in the Church.',
      description_fr: "Comprendre les dons spirituels et leur but dans l'Église.",
      lesson_order: 3,
      status: 'DRAFT',
      estimated_minutes: 60,
    },
  });
  console.log(`  ✅ Lesson 3: ${lesson3.title_en} (draft)`);

  // ============================================================================
  // CREATE SLIDES FOR LESSON 1
  // ============================================================================
  console.log('\n🖼️  Creating slides...');

  // Title Slide
  const slide1 = await prisma.slide.create({
    data: {
      lesson_id: lesson1.id,
      slide_order: 1,
      layout: 'TITLE',
      title_en: 'Who is the Holy Spirit?',
      title_fr: 'Qui est le Saint-Esprit?',
    },
  });

  // Content Slide 1
  const slide2 = await prisma.slide.create({
    data: {
      lesson_id: lesson1.id,
      slide_order: 2,
      layout: 'CONTENT',
      title_en: 'The Third Person of the Trinity',
      title_fr: 'La Troisième Personne de la Trinité',
      notes_en: 'Emphasize the personhood of the Holy Spirit - He is not just a force.',
      notes_fr: "Souligner la personnalité du Saint-Esprit - Il n'est pas simplement une force.",
    },
  });

  // Content Slide 2
  const slide3 = await prisma.slide.create({
    data: {
      lesson_id: lesson1.id,
      slide_order: 3,
      layout: 'TWO_COLUMN',
      title_en: 'Old Testament vs New Testament',
      title_fr: 'Ancien Testament vs Nouveau Testament',
      notes_en: "Compare the Spirit's work in both testaments.",
      notes_fr: "Comparer l'œuvre de l'Esprit dans les deux testaments.",
    },
  });

  console.log(`  ✅ Created ${3} slides for Lesson 1`);

  // ============================================================================
  // CREATE CONTENT BLOCKS
  // ============================================================================
  console.log('\n📝 Creating content blocks...');

  // Slide 2 - Content Blocks
  await prisma.contentBlock.create({
    data: {
      slide_id: slide2.id,
      block_order: 1,
      block_type: 'TEXT',
      content_en: {
        text: 'The Holy Spirit is the third person of the Trinity, co-equal and co-eternal with God the Father and God the Son.',
      },
      content_fr: {
        text: 'Le Saint-Esprit est la troisième personne de la Trinité, coégal et coéternel avec Dieu le Père et Dieu le Fils.',
      },
    },
  });

  await prisma.contentBlock.create({
    data: {
      slide_id: slide2.id,
      block_order: 2,
      block_type: 'VERSE',
      content_en: {
        reference: 'John 14:16-17',
        text: 'And I will ask the Father, and he will give you another advocate to help you and be with you forever—the Spirit of truth.',
        translation: 'NIV',
      },
      content_fr: {
        reference: 'Jean 14:16-17',
        text: "Et moi, je prierai le Père, et il vous donnera un autre consolateur, afin qu'il demeure éternellement avec vous, l'Esprit de vérité.",
        translation: 'LSG',
      },
    },
  });

  await prisma.contentBlock.create({
    data: {
      slide_id: slide2.id,
      block_order: 3,
      block_type: 'LIST',
      content_en: {
        items: [
          'The Holy Spirit is a Person, not merely a force',
          'He has intellect, emotions, and will',
          'He can be grieved, lied to, and blasphemed against',
        ],
      },
      content_fr: {
        items: [
          'Le Saint-Esprit est une Personne, pas simplement une force',
          "Il a l'intellect, des émotions et une volonté",
          'Il peut être attristé, menti et blasphémé',
        ],
      },
    },
  });

  // Slide 3 - Content Blocks (Two Column)
  await prisma.contentBlock.create({
    data: {
      slide_id: slide3.id,
      block_order: 1,
      block_type: 'TEXT',
      content_en: {
        column: 'left',
        heading: 'Old Testament',
        text: 'The Spirit came upon individuals temporarily for specific tasks.',
      },
      content_fr: {
        column: 'left',
        heading: 'Ancien Testament',
        text: "L'Esprit venait sur les individus temporairement pour des tâches spécifiques.",
      },
    },
  });

  await prisma.contentBlock.create({
    data: {
      slide_id: slide3.id,
      block_order: 2,
      block_type: 'TEXT',
      content_en: {
        column: 'right',
        heading: 'New Testament',
        text: 'The Spirit permanently indwells all believers from the moment of salvation.',
      },
      content_fr: {
        column: 'right',
        heading: 'Nouveau Testament',
        text: "L'Esprit habite en permanence tous les croyants dès le moment du salut.",
      },
    },
  });

  console.log(`  ✅ Created content blocks for slides`);

  // ============================================================================
  // CREATE QUIZ
  // ============================================================================
  console.log('\n❓ Creating quiz...');

  const quiz = await prisma.quiz.create({
    data: {
      lesson_id: lesson1.id,
      title_en: 'Lesson 1 Quiz: Understanding the Holy Spirit',
      title_fr: 'Quiz Leçon 1: Comprendre le Saint-Esprit',
      passing_score_percentage: 70,
      shuffle_questions: true,
      shuffle_options: true,
      allow_review: true,
      show_correct_answers: true,
      max_attempts: 3,
    },
  });

  await prisma.question.create({
    data: {
      quiz_id: quiz.id,
      question_order: 1,
      question_type: 'MULTIPLE_CHOICE',
      question_text_en: {
        text: 'The Holy Spirit is:',
      },
      question_text_fr: {
        text: 'Le Saint-Esprit est:',
      },
      options_en: [
        'A force or power from God',
        'The third person of the Trinity',
        'An angel sent by God',
        'The same as God the Father',
      ],
      options_fr: [
        'Une force ou puissance de Dieu',
        'La troisième personne de la Trinité',
        'Un ange envoyé par Dieu',
        'Le même que Dieu le Père',
      ],
      correct_answers: { indices: [1] }, // Index 1 = second option
      explanation_en: {
        text: 'The Holy Spirit is the third person of the Trinity, distinct from the Father and the Son, yet fully God.',
      },
      explanation_fr: {
        text: 'Le Saint-Esprit est la troisième personne de la Trinité, distinct du Père et du Fils, mais pleinement Dieu.',
      },
      points: 1,
    },
  });

  await prisma.question.create({
    data: {
      quiz_id: quiz.id,
      question_order: 2,
      question_type: 'TRUE_FALSE',
      question_text_en: {
        text: 'In the Old Testament, the Holy Spirit permanently indwelt believers.',
      },
      question_text_fr: {
        text: "Dans l'Ancien Testament, le Saint-Esprit habitait en permanence dans les croyants.",
      },
      correct_answers: { value: false },
      explanation_en: {
        text: 'In the Old Testament, the Spirit came upon individuals temporarily. Permanent indwelling began at Pentecost.',
      },
      explanation_fr: {
        text: "Dans l'Ancien Testament, l'Esprit venait sur les individus temporairement. L'habitation permanente a commencé à la Pentecôte.",
      },
      points: 1,
    },
  });

  await prisma.question.create({
    data: {
      quiz_id: quiz.id,
      question_order: 3,
      question_type: 'FILL_BLANK',
      question_text_en: {
        text: 'Jesus promised to send another ________ to be with believers forever.',
      },
      question_text_fr: {
        text: "Jésus a promis d'envoyer un autre ________ pour être avec les croyants pour toujours.",
      },
      correct_answers: {
        accepted: ['advocate', 'Advocate', 'helper', 'Helper', 'comforter', 'Comforter'],
      },
      explanation_en: {
        text: 'Jesus called the Holy Spirit "another Advocate" (or Helper/Comforter) in John 14:16.',
      },
      explanation_fr: {
        text: 'Jésus a appelé le Saint-Esprit "un autre Consolateur" dans Jean 14:16.',
      },
      points: 1,
    },
  });

  console.log(`  ✅ Created quiz with ${3} questions`);

  // ============================================================================
  // CREATE ENROLLMENTS
  // ============================================================================
  console.log('\n🎓 Creating enrollments...');

  const enrollmentEn = await prisma.enrollment.create({
    data: {
      student_id: studentEn.id,
      course_id: pneumatologyCourse.id,
      status: 'ACTIVE',
      total_lessons: 3,
      lessons_completed: 0,
      progress_percentage: 0,
    },
  });

  const enrollmentFr = await prisma.enrollment.create({
    data: {
      student_id: studentFr.id,
      course_id: pneumatologyCourse.id,
      status: 'ACTIVE',
      total_lessons: 3,
      lessons_completed: 1,
      progress_percentage: 33,
    },
  });

  console.log(`  ✅ Enrolled ${2} students in course`);

  // ============================================================================
  // CREATE LESSON PROGRESS
  // ============================================================================
  console.log('\n📊 Creating lesson progress...');

  // English student - just started
  await prisma.lessonProgress.create({
    data: {
      enrollment_id: enrollmentEn.id,
      lesson_id: lesson1.id,
      status: 'IN_PROGRESS',
      current_slide_index: 1,
      total_slides_viewed: 2,
      time_spent_seconds: 180,
    },
  });

  // French student - completed lesson 1
  await prisma.lessonProgress.create({
    data: {
      enrollment_id: enrollmentFr.id,
      lesson_id: lesson1.id,
      status: 'COMPLETED',
      current_slide_index: 3,
      total_slides_viewed: 3,
      time_spent_seconds: 1200,
      completed_at: new Date(Date.now() - 86400000), // Completed yesterday
    },
  });

  console.log(`  ✅ Created lesson progress records`);

  // ============================================================================
  // CREATE SAMPLE QUIZ SUBMISSION
  // ============================================================================
  console.log('\n✍️  Creating quiz submission...');

  const submission = await prisma.quizSubmission.create({
    data: {
      quiz_id: quiz.id,
      student_id: studentFr.id,
      score_percentage: 100,
      points_earned: 3,
      total_points: 3,
      passed: true,
      time_spent_seconds: 180,
      submitted_at: new Date(Date.now() - 86400000),
    },
  });

  // Question answers
  await prisma.questionAnswer.createMany({
    data: [
      {
        submission_id: submission.id,
        question_id: (await prisma.question.findFirst({
          where: { quiz_id: quiz.id, question_order: 1 },
        }))!.id,
        answer_given: { selectedIndex: 1 },
        is_correct: true,
        points_earned: 1,
      },
      {
        submission_id: submission.id,
        question_id: (await prisma.question.findFirst({
          where: { quiz_id: quiz.id, question_order: 2 },
        }))!.id,
        answer_given: { value: false },
        is_correct: true,
        points_earned: 1,
      },
      {
        submission_id: submission.id,
        question_id: (await prisma.question.findFirst({
          where: { quiz_id: quiz.id, question_order: 3 },
        }))!.id,
        answer_given: { text: 'Advocate' },
        is_correct: true,
        points_earned: 1,
      },
    ],
  });

  console.log(`  ✅ Created quiz submission with answers`);

  // ============================================================================
  // CREATE STUDENT NOTE
  // ============================================================================
  console.log('\n📝 Creating student note...');

  await prisma.studentNote.create({
    data: {
      student_id: studentEn.id,
      lesson_id: lesson1.id,
      slide_index: 2,
      note_text:
        'Important: The Holy Spirit is a person, not just a force. He has intellect, emotions, and will.',
    },
  });

  console.log(`  ✅ Created student note`);

  // ============================================================================
  // CREATE ACTIVITY LOGS
  // ============================================================================
  console.log('\n📝 Creating activity logs...');

  await prisma.activityLog.createMany({
    data: [
      {
        user_id: studentEn.id,
        action: 'LOGIN',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0...',
      },
      {
        user_id: studentEn.id,
        action: 'START_LESSON',
        entity_type: 'lesson',
        entity_id: lesson1.id,
      },
      {
        user_id: studentFr.id,
        action: 'COMPLETE_LESSON',
        entity_type: 'lesson',
        entity_id: lesson1.id,
      },
      {
        user_id: studentFr.id,
        action: 'SUBMIT_QUIZ',
        entity_type: 'quiz',
        entity_id: quiz.id,
        metadata: { score: 100, passed: true },
      },
      {
        user_id: teacher.id,
        action: 'CREATE_COURSE',
        entity_type: 'course',
        entity_id: pneumatologyCourse.id,
      },
    ],
  });

  console.log(`  ✅ Created activity logs`);

  console.log('\n✅ Database seeded successfully!\n');
  console.log('📋 Summary:');
  console.log('  • 4 users (1 admin, 1 teacher, 2 students)');
  console.log('  • 1 course with 3 lessons');
  console.log('  • 3 slides with content blocks');
  console.log('  • 1 quiz with 3 questions');
  console.log('  • 2 student enrollments with progress');
  console.log('  • 1 quiz submission');
  console.log('  • 1 student note');
  console.log('  • Activity logs\n');
  console.log('🔑 Login credentials (all users):');
  console.log('  Password: password123\n');
  console.log('  Admin:     admin@bibliology.com');
  console.log('  Teacher:   teacher@bibliology.com');
  console.log('  Student 1: student.en@example.com');
  console.log('  Student 2: student.fr@example.com\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
