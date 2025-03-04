
    import PropTypes from "prop-types"; // Import PropTypes
    import Navbar from "./Navbar.jsx";

    const Layout = ({ children }) => {
        return (
            <div className='min-h-screen bg-base-100'>
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
