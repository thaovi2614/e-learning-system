import json
import traceback
import os

from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


def extract_json(text):
    if not text:
        return None

    text = text.replace("```json", "")
    text = text.replace("```", "")
    text = text.strip()

    start = text.find("{")
    end = text.rfind("}") + 1

    if start == -1 or end == 0:
        return None

    return text[start:end]


def ai_pick_top_courses(user, candidate_courses):
    if not candidate_courses:
        return []

    prompt = f"""
Bạn là AI tư vấn lộ trình học cho nền tảng E-learning.

Thông tin học viên:
- Trình độ: {user.level}
- Mục tiêu học tập / nghề nghiệp: {user.learning_goal}

Danh sách khóa học ứng viên:
{json.dumps(candidate_courses, ensure_ascii=False, indent=2)}

Nhiệm vụ:
- Chọn tối đa 3 khóa học phù hợp nhất.
- Chỉ chọn course_id có trong danh sách ứng viên.
- Không tự tạo course_id mới.
- Viết reason bằng tiếng Việt, tự nhiên, dễ hiểu, thuyết phục.
- Mỗi reason dài khoảng 2-3 câu.
- Reason phải nói rõ:
  + kỹ năng đạt được
  + ứng dụng thực tế
  + hoặc hỗ trợ mục tiêu nghề nghiệp 
  + tại sao khóa học này phù hợp với học viên dựa trên trình độ và mục tiêu của họ.
- Không viết chung chung kiểu "phù hợp với trình độ".
- Không dùng markdown.
- Không thêm chữ ngoài JSON.

Chỉ trả về JSON hợp lệ theo format:
{{
  "recommendations": [
    {{
      "course_id": 1,
      "reason": "Khóa học này giúp bạn..."
    }}
  ]
}}
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7
        )

        content = response.choices[0].message.content

        print("========== RAW GROQ RESPONSE ==========")
        print(content)
        print("=======================================")

        json_text = extract_json(content)

        if not json_text:
            print("Không tách được JSON từ Groq response")
            return []

        print("========== EXTRACTED JSON ==========")
        print(json_text)
        print("====================================")

        data = json.loads(json_text)

        recommendations = data.get("recommendations", [])

        valid_ids = {c["id"] for c in candidate_courses}

        clean_result = []

        for rec in recommendations:
            course_id = rec.get("course_id")

            if course_id in valid_ids:
                clean_result.append({
                    "course_id": course_id,
                    "reason": rec.get(
                        "reason",
                        "Khóa học này giúp bạn phát triển kỹ năng phù hợp với mục tiêu học tập."
                    )
                })

        return clean_result[:3]

    except Exception as e:
        print("Groq AI error:", e)
        traceback.print_exc()
        return []