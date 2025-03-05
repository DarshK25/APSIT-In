import fs from 'fs';
import path from 'path';

export const createUploadsDir = () => {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log('Created uploads directory');
    }
}; 