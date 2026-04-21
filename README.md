# e-learning-system

# Setup Backend

1. Truy cập backend
   cd backend

2. Tạo virtual env
   python -m venv venv
   venv\Scripts\activate   # Windows
   source venv/bin/activate  # Mac/Linux

3. Cài thư viện
   pip install -r requirements.txt

4. Tạo file .env (copy từ .env.sample)
   cp .env.sample .env

5. Tạo database rỗng (MySQL)
   CREATE DATABASE elearning;

6. Chạy migration
   flask db upgrade

7. Chạy project
   python run.py

# Setup Frontend

1. cd frontend
2. npm install
3. npm run dev