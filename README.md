# Payment Checkout Backend API

## Descripcion

API REST en NestJS para un flujo de checkout con tarjeta de credito. Expone catalogo de productos, consulta de detalle, inicio de transacciones, consulta de estado y health check, integrando una pasarela de pago sandbox mediante tokenizacion de tarjeta y creacion de transacciones.

## Requisitos

- Node.js 20+
- npm 10+
- PostgreSQL 16+ o Docker Desktop

## Instalacion y configuracion

1. Instalar dependencias:

```bash
npm install
```

2. Crear archivo `.env` a partir de `.env.example`.

3. Generar cliente Prisma:

```bash
npm run prisma:generate
```

4. Crear el esquema en la base de datos:

```bash
npx prisma db push
```

5. Cargar seed de productos:

```bash
npm run prisma:seed
```

## Variables de entorno

| Variable | Descripcion |
|---|---|
| `PORT` | Puerto HTTP del backend |
| `NODE_ENV` | Ambiente de ejecucion |
| `DATABASE_URL` | Conexion PostgreSQL para Prisma |
| `PAYMENT_GATEWAY_SANDBOX_URL` | URL base sandbox de la pasarela |
| `PAYMENT_GATEWAY_PUBLIC_KEY` | Llave publica sandbox |
| `PAYMENT_GATEWAY_PRIVATE_KEY` | Llave privada sandbox |
| `PAYMENT_GATEWAY_EVENTS_KEY` | Llave de eventos sandbox |
| `PAYMENT_GATEWAY_INTEGRITY_KEY` | Llave de integridad sandbox |

## Como correr el proyecto

### Con Node directamente

```bash
npm run start:dev
```

Documentacion Swagger:

```text
http://localhost:3000/api
```

### Con Docker

```bash
docker compose up --build
```

## Endpoints disponibles

| Metodo | Ruta | Descripcion |
|---|---|---|
| `GET` | `/products` | Lista todos los productos |
| `GET` | `/products/:id` | Retorna detalle de un producto |
| `POST` | `/transactions/initiate` | Inicia y procesa una transaccion |
| `GET` | `/transactions/:id` | Consulta una transaccion |
| `GET` | `/health` | Health check |

### Ejemplo `POST /transactions/initiate`

```json
{
  "productId": "cuid-del-producto",
  "quantity": 1,
  "cardData": {
    "number": "4242424242424242",
    "holderName": "JOHN DOE",
    "expiryMonth": "12",
    "expiryYear": "30",
    "cvc": "123"
  },
  "customerData": {
    "email": "john@example.com",
    "fullName": "John Doe",
    "phoneNumber": "3001234567",
    "legalId": "123456789",
    "legalIdType": "CC"
  },
  "installments": 1
}
```

## Coleccion Postman / ejemplos curl

```bash
curl http://localhost:3000/products
```

```bash
curl http://localhost:3000/health
```

## Tests

### Como correr los tests

```bash
npm test
npm run test:cov
```

### Resultado actual

- `npm test`: pasando
- `npm run build`: pasando

## Arquitectura del proyecto

```text
src/
├── config/
├── modules/
│   ├── health/
│   ├── payment-gateway/
│   ├── products/
│   └── transactions/
└── shared/
```

Se sigue una separacion por modulos y capas:

- `domain`: entidades, enums y contratos de repositorio
- `application`: DTOs y casos de uso
- `infrastructure`: controladores y adaptadores Prisma / pasarela
- `shared`: filtros, interceptores, excepciones y utilidades

## Decisiones tecnicas

- `PostgreSQL + Prisma` como persistencia inicial.
- `NestJS 11` como framework principal.
- Validaciones con `class-validator` y `ValidationPipe` global.
- Respuesta uniforme con interceptor `{ success: true, data }`.
- Errores estructurados con filtro global `{ success: false, error }`.
- Polling simple del estado de la transaccion para resolver el flujo dentro de `POST /transactions/initiate`.
