import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { MessageProvider } from "./context/MessageContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ChatWidget from "./components/ChatWidget/ChatWidget";

function App() {
  return (
    <AuthProvider>
      <MessageProvider>
        <CartProvider>
          <AppRoutes />
          <ChatWidget />
          
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            closeOnClick
            pauseOnHover
          />
        </CartProvider>
      </MessageProvider>
    </AuthProvider>
  );
}

export default App;