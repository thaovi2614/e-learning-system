import { useEffect, useState } from "react";
import { getCourseById } from "../../services/courseApi";

export default function LessonTab({ courseId }) {
    const [course, setCourse] = useState(null);

    useEffect(() => {
        getCourseById(courseId).then(res => {
            setCourse(res.data);
        });
    }, [courseId]);

    if (!course) return <p>Đang tải...</p>;

    return (
        <div>
            <h3>{course.name}</h3>

            {/* CHAPTER + LESSON */}
            {/* {course.chapters?.map(ch => (
                <div key={ch.id}>
                    <h4>{ch.name}</h4>

                    {ch.lessons.map(ls => (
                        <div key={ls.id}>
                            ▶ {ls.name}
                        </div>
                    ))}
                </div>
            ))} */}
        </div>
    );
}