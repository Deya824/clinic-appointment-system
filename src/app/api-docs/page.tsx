'use client';
/**
 * /api-docs: interactive API documentation (Swagger UI).
 * Reads the spec from /api/doc.
 */
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export default function ApiDocsPage() {
  return (
    <main style={{ background: '#fff', minHeight: '100vh' }}>
      <SwaggerUI url="/api/doc" />
    </main>
  );
}