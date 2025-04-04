export const handleError = (res, error) => {
    console.error(error);
    res.status(500).json({
        message: error.message || 'An error occurred',
        error: process.env.NODE_ENV === 'development' ? error : {}
    });
}; 