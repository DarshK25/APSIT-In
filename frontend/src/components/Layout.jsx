import { useTheme } from "../context/ThemeContext";
import PropTypes from "prop-types"; // Import PropTypes
import Navbar from "./Navbar.jsx";

const Layout = ({ children }) => {
    const { theme } = useTheme();
    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#121212]' : 'bg-gray-50'} transition-colors duration-200`}>
            <Navbar />
            <main className='max-w-7xl mx-auto px-4 py-6'>{children}</main>
        </div>
    );
};

// Add PropTypes validation
Layout.propTypes = {
    children: PropTypes.node.isRequired, // Validate children as a node (React elements)
}

export default Layout;
