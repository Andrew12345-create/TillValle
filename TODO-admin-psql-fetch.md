# Admin Product Fetching Update - Use psql Connection

## Tasks
- [ ] Update GET /api/products to use stockPool.query instead of REST API
- [ ] Update GET /api/products/:id to use stockPool.query instead of REST API
- [ ] Update PUT /api/products/:id to use stockPool.query instead of REST API
- [ ] Ensure products table exists in stockPool database
- [ ] Test admin panel product loading and CRUD operations

## Files to Edit
- api/index.js

## Notes
- stockPool uses correct psql connection: postgresql://neondb_owner:npg_qn6wAlZJavf3@ep-billowing-mode-adkbmnzk-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
- API URL: https://ep-billowing-mode-adkbmnzk.apirest.c-2.us-east-1.aws.neon.tech/neondb/rest/v1
- POST and DELETE already use stockPool, making GET/PUT consistent
