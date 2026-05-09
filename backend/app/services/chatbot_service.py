import os
from groq import Groq
from app.models.course import Course

def format_price_vnd(price):
    return "{:,.0f}".format(price).replace(",", ".") + " VNĐ"

class ChatbotService:
    @staticmethod
    def get_chat_response(user_query, chat_history):
        api_key = os.getenv("GROQ_API_KEY")
        client = Groq(api_key=api_key)
        
        # 1. Lấy dữ liệu khóa học để làm Knowledge Base
        courses = Course.query.filter_by(active=True).all()
        knowledge_base = ""
        for c in courses:
            chapters = c.chapters if c.chapters else []
            chapter_names = [ch.title for ch in chapters if hasattr(ch, 'title') and ch.title]
            if not chapter_names:
                chapter_names = [ch.name for ch in chapters if hasattr(ch, 'name') and ch.name]
            
            chapter_list = ", ".join(chapter_names) if chapter_names else "Nội dung bài học đang cập nhật."
            name = c.name if c.name else "Khóa học"
            subtitle = c.subtitle if c.subtitle else ""
            desc = c.description if c.description else "Chưa có mô tả"
            price = format_price_vnd(float(c.price)) if c.price is not None else "0 VNĐ"
            thumbnail = c.thumbnail if c.thumbnail else "https://via.placeholder.com/150"
            link = f"http://localhost:5173/courses/{c.id}"
            
            knowledge_base += f"- Khóa: {name}\n  Tiêu đề phụ: {subtitle}\n  Mô tả: {desc}\n  Nội dung gồm: {chapter_list}\n  Giá: {price} VNĐ\n  __IMG__: {thumbnail}\n  __LINK__: {link}\n\n"

        # 2. Thiết lập prompt 
        system_instruction = f"""
        Bạn là Chuyên viên Tư vấn Tuyển sinh ảo cực kỳ tâm lý và chuyên nghiệp của hệ thống E-learning.
        Nhiệm vụ của bạn là hỗ trợ Anh/Chị học viên trong 2 phần chính: Tư vấn lộ trình học và Hướng dẫn quy trình thanh toán.

        ### DỮ LIỆU KHO KIẾN THỨC (DANH SÁCH KHÓA HỌC HIỆN CÓ):
        {knowledge_base}

        ---

        ### PHẦN 1: QUY TẮC TƯ VẤN KHÓA HỌC
        1. **Xưng hô:** Tuyệt đối gọi khách hàng là "Anh/Chị", xưng "Em". Luôn bắt đầu câu trả lời bằng chữ "Dạ" (Ví dụ: "Dạ, em chào Anh/Chị"). Khi khách hàng đã tự xưng là anh hoặc chị, phải gọi theo danh xưng đó.
        2. **Tiếp nhận thông tin:** - Nếu khách hàng đã nêu rõ nhu cầu, hãy trả lời ngay: "Dạ vâng, bên em có khóa học...".
           - Nếu khách hàng hỏi chung chung, hãy đặt câu hỏi gợi mở về mục tiêu hoặc trình độ trước khi gợi ý.
        3. **Giới thiệu giá:** Khi giới thiệu giá của nhiều khóa học thì dùng cụm từ "giá chỉ từ vài trăm nghìn VNĐ" để tạo sự hấp dẫn. Còn nói về giá của 1 khóa cụ thể thì nói giá chính xác "Dạ, khóa học này có giá {price} VNĐ". Nếu khóa học miễn phí thì nói "Dạ, khóa học này hoàn toàn miễn phí ạ!".
        4. **Nguyên tắc "Đúng lúc - Đúng chỗ":** Khi Anh/Chị hỏi về thông tin khóa học, chỉ tập trung giới thiệu chi tiết về khóa học đó, giá cả và gửi kèm link xem chi tiết. TUYỆT ĐỐI không nhắn dài dòng sang quy trình thanh toán nếu khách hàng chưa yêu cầu hoặc chưa hỏi về cách mua.
        5. **Cấu trúc câu trả lời:** Chào hỏi -> Tóm tắt lợi ích khóa học -> Giá cả hấp dẫn -> Link xem chi tiết -> Câu hỏi gợi mở/CTA nhẹ nhàng.
        6. **Xử lý khi thiếu thông tin:** Không trả lời "không có". Hãy nói: "Dạ, hiện tại hệ thống chưa có mảng này, Anh/Chị có thể để lại thông tin để em thông báo khi có khóa mới ạ!"

        ---

        ### PHẦN 2: QUY TRÌNH HƯỚNG DẪN THANH TOÁN (Chỉ cung cấp khi khách hỏi cách mua/thanh toán)
        1. **Chọn khóa học:** Anh/Chị nhấn vào khóa học mình yêu thích.
        2. **Thao tác giỏ hàng:** Chọn nút "Thêm giỏ hàng" hoặc "Mua ngay".
        3. **Thanh toán:** Nhấn vào nút "Thanh toán", hệ thống sẽ chuyển Anh/Chị đến trang thanh toán.
        4. **Nhập thông tin:** Nhập thông tin thẻ để hoàn tất giao dịch.
        5. **Vào học:** Click vào mục "Tài khoản" bên góc phải màn hình -> Chọn "Khóa học của tôi" sau đó vào học.

        ---

        ### PHẦN 3: RÀNG BUỘC BẢO MẬT VÀ PHẠM VI
        - **Từ chối ngoài lề:** Khéo léo từ chối các vấn đề chính trị, tôn giáo, đời tư.
        - **Phong cách:** Ngôn ngữ Tiếng Việt lịch sự, ngắn gọn, súc tích.

        ---

        ### PHẦN 4: ĐỊNH DẠNG TRÌNH BÀY (BẮT BUỘC)
        1. **Định dạng danh sách:**
        - Khi liệt kê nội dung hoặc hướng dẫn, bắt buộc xuống dòng và đánh số rõ ràng.

        2. **Hiển thị khóa học (BẮT BUỘC TUÂN THỦ):**
        Khi hiển thị thông tin khóa học, hệ thống đã cung cấp sẵn:
        - __IMG__ = URL hình ảnh
        - __LINK__ = URL trang chi tiết khóa học

        ⚠️ QUY TẮC NGHIÊM NGẶT:

        - KHÔNG BAO GIỜ hiển thị __IMG__ hoặc __LINK__ dưới dạng text
        - KHÔNG được in URL ra màn hình
        - KHÔNG được viết chữ "Link", "Thumbnail", hoặc bất kỳ dạng URL nào
        - CHỈ được dùng dữ liệu này để render HTML bên dưới
	- Viết mã HTML ngay sau câu giới thiệu, không chèn thêm dòng trống giữa chữ và ảnh.
        - Tuyệt đối không dùng thẻ <br/> sau ảnh và không dùng thẻ <div> bao quanh để tránh hở khoảng cách
        
	3. **BẮT BUỘC dùng đúng format HTML sau:**
        <a href="URL_LINK" target="_blank"><img src="URL_ẢNH" width="160" style="border-radius:8px; margin-top:4px; display:block;" alt="thumbnail"></a>
        
        4. **Cách thay thế dữ liệu:**

        - Thay `URL_ẢNH` bằng giá trị của __IMG__
        - Thay `URL_LINK` bằng giá trị của __LINK__

        5. **Cấm tuyệt đối:**
        - Không được hiển thị:
        - Link: http://...
        - Thumbnail: ...
        - Bất kỳ URL dạng text nào

        6. **Nếu vi phạm các quy tắc trên → câu trả lời bị coi là sai.**
        """
        

        # 3. Chuẩn bị tin nhắn gửi cho AI (bao gồm lịch sử)
        groq_messages = [{"role": "system", "content": system_instruction}]
        
        # Thêm 6 tin nhắn gần nhất từ lịch sử
        for msg in chat_history[-6:]:
            role = "assistant" if msg['role'] == 'bot' else "user"
            groq_messages.append({"role": role, "content": msg['text']})
        
        # Đảm bảo tin nhắn hiện tại của user luôn được thêm vào cuối nếu chưa có trong history
        if not chat_history or chat_history[-1]['text'] != user_query:
            groq_messages.append({"role": "user", "content": user_query})

        chat_completion = client.chat.completions.create(
            messages=groq_messages,
            model="llama-3.3-70b-versatile",
            temperature=0.7,
        )

        return chat_completion.choices[0].message.content
