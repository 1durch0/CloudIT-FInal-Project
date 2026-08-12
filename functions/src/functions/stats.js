const { app } = require('@azure/functions');
const { MongoClient } = require('mongodb');

app.http('stats', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log('Stats function triggered');

        let client;
        try {
            client = new MongoClient(process.env.MONGO_URI);
            await client.connect();

            const dbName = process.env.MONGO_URI.split('/').filter(Boolean).pop().split('?')[0];
            const imageCount = await client
                .db(dbName)
                .collection('images')
                .countDocuments();

            return { jsonBody: { imageCount } };
        } catch (error) {
            context.error('Error counting images:', error);
            return { status: 500, jsonBody: { message: error.message } };
        } finally {
            if (client) await client.close();
        }
    }
});
