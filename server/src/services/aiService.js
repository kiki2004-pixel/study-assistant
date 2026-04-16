const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const STYLE_PROMPTS = {
  simple:
    'Rewrite the following academic text in simple, plain English that a high school student can understand. Preserve all important facts and concepts but eliminate jargon. Use short paragraphs and clear headings.',
  detailed:
    'Create comprehensive, detailed study notes from the following text. Include all key concepts, definitions, formulas, and examples. Organize with clear headings and subheadings in Markdown.',
  bullet_points:
    'Convert the following academic text into a structured bullet-point summary. Group related points under topic headings. Include all critical information a student needs for an exam.',
  flashcards:
    'Convert the following academic text into flashcard-style Q&A pairs. Format each pair exactly as:\n\n**Q:** [question]\n**A:** [answer]\n\nCover all key terms, concepts, dates, and formulas.',
};

async function simplifyNote(extractedText, style) {
  const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.simple;

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 4096,
    messages: [
      {
        role: 'system',
        content:
          'You are an expert study assistant who helps students understand complex academic material. You produce clear, accurate, well-structured study notes. Always respond in valid Markdown.',
      },
      {
        role: 'user',
        content: `${stylePrompt}\n\n---\n\n${extractedText}`,
      },
    ],
  });

  return {
    text: response.choices[0].message.content,
    model: response.model,
    tokens: (response.usage?.prompt_tokens || 0) + (response.usage?.completion_tokens || 0),
  };
}

async function generateTimetable({ schoolTimetableText, subjects, startDate, endDate, studyHoursPerDay }) {
  const subjectList = subjects
    .sort((a, b) => b.priority - a.priority)
    .map((s) => {
      const examInfo = s.exam_date ? `, Exam: ${s.exam_date}` : '';
      return `- ${s.name} (Priority: ${s.priority}/5${examInfo})`;
    })
    .join('\n');

  let schoolContext = '';
  if (schoolTimetableText) {
    schoolContext = `The student's existing school schedule is:\n${schoolTimetableText}\nDo NOT schedule study sessions during these existing class times.\n\n`;
  }

  const userPrompt = `${schoolContext}Generate a study timetable from ${startDate} to ${endDate}.

Subjects and priorities:
${subjectList}

Constraints:
- Maximum ${studyHoursPerDay} study hours per day outside school hours
- Higher priority subjects and subjects with sooner exam dates get more slots
- Spread sessions across different days (no subject every single day unless critical)
- Each session should be 45–90 minutes
- Include short breaks between sessions
- Study sessions should be in morning (07:00–09:00), afternoon (14:00–17:00), or evening (18:00–21:00) slots

Return ONLY valid JSON with NO markdown fences, NO explanation. Use this exact schema:
{
  "timetable": [
    {
      "date": "YYYY-MM-DD",
      "day": "Monday",
      "slots": [
        {
          "time": "HH:MM-HH:MM",
          "subject": "Subject Name",
          "activity": "Brief description of what to study",
          "duration_minutes": 60
        }
      ]
    }
  ]
}`;

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 4096,
    messages: [
      {
        role: 'system',
        content:
          'You are an academic scheduling expert. You generate personalized study timetables. You MUST respond with valid JSON only — no markdown code fences, no explanation text.',
      },
      { role: 'user', content: userPrompt },
    ],
  });

  const rawText = response.choices[0].message.content.trim();
  const cleaned = rawText.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim();
  const parsed = JSON.parse(cleaned);

  return { schedule: parsed, model: response.model };
}

module.exports = { groq, simplifyNote, generateTimetable };
