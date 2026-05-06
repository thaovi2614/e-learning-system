import tempfile
import os
import cloudinary.uploader

def upload_avatar(file, user_id):
    try:
        result = cloudinary.uploader.upload(
            file,
            folder=f"elearning/avatar/user_{user_id}",
            transformation=[
                {"width": 300, "height": 300, "crop": "fill"},
                {"quality": "auto"},
                {"fetch_format": "auto"}
            ]
        )

        return result.get("secure_url")

    except Exception as e:
        print("Upload avatar error:", str(e))
        return None


def upload_thumbnail(file, user_id):
    try:
        result = cloudinary.uploader.upload(
            file,
            folder=f"elearning/course/thumbnail/user_{user_id}",
            transformation=[
                {"width": 800, "height": 800, "crop": "fill"},  # 16:9
                {"quality": "auto"},
                {"fetch_format": "auto"}
            ]
        )

        return result.get("secure_url")

    except Exception as e:
        print("Upload thumbnail error:", str(e))
        return None


def upload_pdf(file, user_id):
    try:
        result = cloudinary.uploader.upload(
            file,
            folder=f"elearning/lesson/slide/user_{user_id}"
        )

        return {
            "secure_url": result.get("secure_url"),
            "public_id": result.get("public_id")
        }

    except Exception as e:
        print("Upload PDF error:", str(e))
        return None


def upload_video(file, user_id):
    temp_path = None
    try:
        # 👉 tạo file tạm
        temp = tempfile.NamedTemporaryFile(delete=False)
        temp_path = temp.name

        file.save(temp_path)

        # ❗ QUAN TRỌNG: đóng file trước khi dùng
        temp.close()

        # 👉 upload
        result = cloudinary.uploader.upload_large(
            temp_path,
            resource_type="video",
            folder=f"elearning/lesson/video/user_{user_id}"
        )

        # 👉 tạo stream URL
        stream_url = cloudinary.utils.cloudinary_url(
            result["public_id"],
            resource_type="video",
            format="m3u8",
            transformation=[{"streaming_profile": "full_hd"}]
        )[0]

        os.remove(temp.name)

        return {
            "original_url": result.get("secure_url"),
            "stream_url": stream_url,
            "public_id": result.get("public_id")
        }

    except Exception as e:
        print("Upload video error:", str(e))
        return None


def delete_file(public_id):
        try:
            result = cloudinary.uploader.destroy(public_id)
            return result
        except Exception as e:
            print("Delete file error:", str(e))
            return None


def upload_message_image(file, conversation_id):
    try:
        result = cloudinary.uploader.upload(
            file,
            folder=f"elearning/conversation/{conversation_id}",
            transformation=[
                {"width": 1000, "crop": "limit"}, 
                {"quality": "auto"},
                {"fetch_format": "auto"}
            ]
        )

        return result.get("secure_url")

    except Exception as e:
        print("Upload message image error:", str(e))
        return None