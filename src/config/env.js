export const env =  Object.freeze({
    port: Number(process.env.PORT) || 3000,
    dgPath: process.env.DB_PATH ?? './banco.db',
});