/**
 * GET /api/doc: returns the OpenAPI spec built from the @swagger comments
 * in every route file. Swagger UI (/api-docs) reads this.
 */
import { NextResponse } from 'next/server';
import { createSwaggerSpec } from 'next-swagger-doc';

export async function GET() {
  const spec = createSwaggerSpec({
    apiFolder: 'src/app/api',
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Clinic Appointment & Billing API',
        version: '1.0.0',
        description: 'API for patients, doctors, appointments and billing.',
      },
    },
  });
  return NextResponse.json(spec);
}
