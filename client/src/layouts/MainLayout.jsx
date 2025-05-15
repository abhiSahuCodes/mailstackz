import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../features/auth/authSlice";
import authService from "../services/authService";

const MainLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const handleLogout = () => {
    try {
      authService.logout();
      dispatch(logout());
      navigate("/login");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${
          isSidebarOpen ? "w-64" : "w-20"
        } bg-white shadow-lg transition-all duration-300`}
      >
        <div className="p-4">
          <div className="flex items-center justify-between">
            <h1
              className={`${
                isSidebarOpen ? "block" : "hidden"
              } text-xl font-bold`}
            >
              Mailstackz
            </h1>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded hover:bg-gray-100"
            >
              {isSidebarOpen ? "←" : "→"}
            </button>
          </div>
        </div>
        <nav className="mt-8">
          <Link
            to="/"
            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            📥 {isSidebarOpen && "Inbox"}
          </Link>
          <Link
            to="/categories"
            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            🏷️ {isSidebarOpen && "Categories"}
          </Link>
          <Link
            to="/stats"
            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            📊 {isSidebarOpen && "Statistics"}
          </Link>
        </nav>
      </div>
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-end px-6 py-4">
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <div className="text-gray-700">{user?.name}</div>
                <div className="text-gray-500">{user?.email}</div>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
export default MainLayout;
