import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import Home from "../pages/home/Home";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import CategoryPage from "../pages/categoryPage/CategoryPage";
import SearchCourse from "../pages/searchCourse/SearchCourse";
import DetailCourse from "../pages/detailCourse/DetailCourse";
import Cart from "../pages/cart/Cart";
import MyCourses from "../pages/myCourses/MyCourses";
import LearnCourse from "../pages/learnCourse/LearnCourse";
import LessonViewer from "../pages/learnCourse/LessonViewer";
import QuizPage from "../pages/learnCourse/QuizPage"
import QuestionDetail from "../pages/learnCourse/QuestionDetail";
import CourseManagePage from "../pages/courseManage/CourseManagePage";
import CourseContentPage from "../pages/courseManage/CourseContentPage";
import Messages from "../pages/message/Messages";
import Profile from '../pages/profile/Profile';
import { useAuth } from "../context/AuthContext";

function PrivateRoute({ children, roles }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/" state={{ from: location.pathname }} replace />;
  if (roles && !roles.includes(user.role)) return <h3>Không có quyền truy cập</h3>;
  return children;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchCourse />} />
          <Route path="/courses/:id" element={<DetailCourse />} />
          <Route path="/messages" element={<PrivateRoute><Messages /></PrivateRoute>} />
          <Route path="/cart" element={<PrivateRoute><Cart /></PrivateRoute>} />
          <Route path="/my-courses" element={<PrivateRoute><MyCourses /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          
          <Route path="/learn/:id" element={<PrivateRoute><LearnCourse /></PrivateRoute>}>
            <Route path="lesson/:lessonId" element={<LessonViewer />} />
            <Route path="forum" element={null} />
            <Route path="forum/:questionId" element={null} />
          </Route>
          <Route path="/quiz/:quizId" element={<PrivateRoute><QuizPage /></PrivateRoute>}/>

          <Route path="/manage-course" element={<PrivateRoute roles={["INSTRUCTOR", "ADMIN"]}><CourseManagePage /></PrivateRoute>} />
          <Route path="/manage-course-content/:courseId" element={<PrivateRoute roles={["INSTRUCTOR", "ADMIN"]}><CourseContentPage /></PrivateRoute>} />
          <Route path="/*" element={<CategoryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}