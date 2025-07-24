export const initDatabase = async () => {
    console.log('SQLite not initialized: running on web platform');
};

export const getDatabase = () => {
    throw new Error('SQLite is not available on web');
};
