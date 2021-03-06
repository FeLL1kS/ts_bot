import moment from "moment";
import db from "../../db";
import { days, week_string } from "../const";
import { API_LESSON, Lesson } from "../interfaces";

export const getAllLesonsByCondition = async (condition: string) => {
  return await db.query(`SELECT * FROM lessons WHERE ${condition} ORDER BY time ASC`);
}

export const getShedule = async (groupId: number, offset: number = 0) => {
  let shedule = ''

  const momentDateTime = moment().utcOffset(3)
  const week = momentDateTime.week() % 2 ? 1 : 2;
  const weekday = momentDateTime.day() + (offset % 7);

  if (weekday === 0) {
    return 'Выходной, можно отдохнуть';
  }
  
  shedule = `${week_string[week]} неделя, ${days[weekday]}\n\n`;

  const lessonsFromDb: Lesson[] = (await getAllLesonsByCondition(`group_id = ${groupId} AND week = ${week} AND weekday = ${weekday}`)).rows;
  lessonsFromDb.forEach((lesson => {
    shedule += `${lesson.subject} | ${lesson.audiences}\n${lesson.time} | ${lesson.type}\n${lesson.teachers}\n\n`;
  }));

  return shedule;
}

  
export const addLessonToDb = async (lesson: API_LESSON, groupId: string) => {
  try {
    let time = lesson.time.start + ' - ' + lesson.time.end;
    let date = lesson.date.start + ' - ' + lesson.date.end;
    let audiences = lesson.audiences.map(audience => audience.name ).join(', ');
    let teachers = lesson.teachers.map(teacher => teacher.name).join(', ');
    
    await db.query(`INSERT INTO lessons(subject, type, time, date, weekday, week, audiences, teachers, group_id) VALUES('${lesson.subject}', '${lesson.type}', '${time}', '${date}', ${lesson.date.weekday}, ${lesson.date.week}, '${audiences}', '${teachers}', '${groupId}')`);

    let lessonId = (await db.query(`SELECT * FROM lessons WHERE subject = '${lesson.subject}' AND type = '${lesson.type}' AND time = '${time}' AND date = '${date}' AND weekday = ${lesson.date.weekday} AND week = ${lesson.date.week} AND audiences = '${audiences}' AND teachers = '${teachers}'`)).rows[0]['id'];

    return lessonId;
  } catch {
    console.log('Не удалось добавить lesson в таблицу lessons')
  }
}