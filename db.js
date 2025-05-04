import { JSONFilePreset } from "lowdb/node";

const defaultData = { users: [] };
export const db = await JSONFilePreset('db.json', defaultData);

export const isUser = async (userId) => {
    await db.read();
    const users = db.data.users;
    return (users.filter((user) => user.userId === userId)).length !== 0;
};

export const getUser = async (userId) => {
    await db.read();
    const users = db.data.users;
    return (users.filter((user) => user.userId === userId))[0];
}

export const updateUser = async (userData) => {
    await db.read();
    await db.update(({users}) => {
        for (let i = 0; i < users.length; i++) {
            if (users[i].userId === userData.userId) {
                users[i] = userData;
            }
        }
        return users;
    });
}