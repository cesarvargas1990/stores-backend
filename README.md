# Stores Admin

Backend y panel administrativo renderizado por servidor para varias tiendas.

## Ejecutar con PostgreSQL

```sh
cp .env.example .env
npm install
docker compose up -d postgres
npm start
```

El panel central queda en `/storeadmin/` y las rutas de API en `/storeadmin/api/`.
La persistencia de producción usa PostgreSQL mediante `DATABASE_URL`, con esquema relacional en `db/schema.sql`. El adaptador JSON queda únicamente como fallback local cuando no se define `DATABASE_URL`.

El primer arranque crea el usuario master, el usuario de EBC y la tienda inicial con los datos del catálogo. Cambia las credenciales y la clave API antes de exponer el servidor públicamente.
