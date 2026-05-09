# import json
# import google.generativeai as genai

# genai.configure(api_key="AIzaSyCyOkZ5OsyBYR4olUt6rjU12O0qIK6GJG8")

# model = genai.GenerativeModel("gemini-2.5-flash")


# def extract_json(text):
#     start = text.find("{")
#     end = text.rfind("}") + 1

#     if start == -1 or end == -1:
#         return None

#     return text[start:end]


# def ai_pick_top_courses(user, candidate_courses):

#     if not candidate_courses:
#         return []

#     prompt = f"""
# Bạn là AI tư vấn lộ trình học cho nền tảng E-learning.

# Thông tin học viên:
# - Trình độ: {user.level}
# - Mục tiêu học tập / nghề nghiệp: {user.learning_goal}

# Danh sách khóa học ứng viên:
# {json.dumps(candidate_courses, ensure_ascii=False, indent=2)}

# Nhiệm vụ:
# - Chọn tối đa 5 khóa học phù hợp nhất.
# - Chỉ chọn course_id có trong danh sách.
# - Viết reason bằng tiếng Việt, tự nhiên, ngắn gọn.
# - Mỗi reason dài khoảng 3-5 câu.
# - Reason phải nói rõ lợi ích học được, ví dụ: kỹ năng đạt được, ứng dụng thực tế, hoặc hỗ trợ mục tiêu nghề nghiệp.
# - Không viết chung chung kiểu “phù hợp với trình độ”.
# - Không viết quá dài.
# - Không dùng markdown.

# Ví dụ reason tốt:
# - "Giúp bạn xây dựng API backend thực tế, phù hợp để bắt đầu theo hướng Backend Developer."
# - "Khóa này giúp bạn nắm SQL để xử lý dữ liệu và chuẩn bị nền tảng cho Data Analyst."
# - "Bạn sẽ biết cách tạo app mobile cơ bản bằng Flutter, phù hợp nếu muốn theo hướng Mobile Developer."
# - "Khóa này giúp bạn hiểu Python nền tảng trước khi học sâu hơn về AI."

# Chỉ trả về JSON hợp lệ:
# {{
#   "recommendations": [
#     {{
#       "course_id": 1,
#       "reason": "..."
#     }}
#   ]
# }}
# """
#     try:

#         response = model.generate_content(prompt)

#         content = response.text

#         json_text = extract_json(content)

#         if not json_text:
#             return []

#         data = json.loads(json_text)

#         recommendations = data.get("recommendations", [])

#         valid_ids = {
#             c["id"] for c in candidate_courses
#         }

#         clean_result = []

#         for rec in recommendations:

#             if rec["course_id"] in valid_ids:

#                 clean_result.append({
#                     "course_id": rec["course_id"],
#                     "reason": rec.get(
#                         "reason",
#                         "Khóa học phù hợp với bạn."
#                     )
#                 })

#         return clean_result[:5]

#     except Exception as e:
#         print("Gemini AI error:", e)
#         return []

import json
import traceback
import google.generativeai as genai

genai.configure(api_key="GEMINI_API_KEY")

model = genai.GenerativeModel("gemini-2.5-flash")


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
- Viết reason bằng tiếng Việt, tự nhiên, dễ hiểu,thuyết phục.
- Mỗi reason dài khoảng 2-3 câu.
- Reason phải nói rõ lợi ích học được: kỹ năng đạt được, ứng dụng thực tế, hoặc hỗ trợ mục tiêu nghề nghiệp.
- Không viết chung chung kiểu “phù hợp với trình độ”.
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
        response = model.generate_content(prompt)

        content = response.text

        print("========== RAW GEMINI RESPONSE ==========")
        print(content)
        print("=========================================")

        json_text = extract_json(content)

        if not json_text:
            print("Không tách được JSON từ Gemini response")
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

        return clean_result[:5]

    except Exception as e:
        print("Gemini AI error:", e)
        traceback.print_exc()
        return []