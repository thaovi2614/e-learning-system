import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { MessageProvider } from "./context/MessageContext";

function App() {
  return (
    <AuthProvider>
      <MessageProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </MessageProvider>
    </AuthProvider>
  );
}

export default App;