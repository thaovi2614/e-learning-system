import cloudinary
import cloudinary.uploader

def init_cloudinary(app):
    cloudinary.config(
        cloud_name=app.config["CLOUDINARY_CLOUD_NAME"],
        api_key=app.config["CLOUDINARY_API_KEY"],
        api_secret=app.config["CLOUDINARY_API_SECRET"],
        secure=True
    )

def upload_image(file):
    result = cloudinary.uploader.upload(file)
    return result.get("secure_url")