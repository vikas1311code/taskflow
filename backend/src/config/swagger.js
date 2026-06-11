const swaggerJsdoc = require('swagger-jsdoc');

const BACKEND_URL = process.env.BACKEND_URL || 'https://taskflow-backend-4xdz.onrender.com';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TaskFlow API',
      version: '1.0.0',
      description: `
## TaskFlow – Scalable REST API

A production-ready REST API with:
- **JWT Authentication** with access + refresh tokens
- **Role-Based Access Control** (user / admin)
- **Task CRUD** with filtering, pagination, and search
- **Admin user management** panel

### Authentication
Use the \`/auth/login\` endpoint to get a token, then click **Authorize** and enter: \`Bearer <your_token>\`
      `,
      contact: { name: 'TaskFlow Team' },
    },
    servers: [
      { url: BACKEND_URL, description: 'Production (Render)' },
      { url: 'http://localhost:5000', description: 'Local Development' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;