# Payment Checkout Backend API

## Descripcion

API REST en NestJS para un flujo de checkout con tarjeta de credito. Expone catalogo de productos, detalle de producto, inicio de transacciones, consulta de estado, historial de ordenes y `health check`. El backend recibe un `cardToken` generado en el frontend y procesa el pago contra una pasarela sandbox sin manipular PAN ni CVV.

## Resumen

- NestJS `11`
- TypeScript
- PostgreSQL + Prisma
- Dockerfile listo para despliegue
- Respuesta uniforme `{ success, data }`
- Manejo estructurado de errores `{ success: false, error }`
- Cobertura de pruebas superior al minimo solicitado

## Flujo de negocio

1. El frontend solicita `POST /transactions/initiate`.
2. El backend crea una transaccion con estado inicial `PENDING`.
3. Se consulta la pasarela sandbox para resolver el pago.
4. Si la transaccion termina en `APPROVED`, el backend:
   - actualiza el estado final
   - registra la entrega
   - descuenta stock inmediatamente
5. Si queda `PENDING`, un job de sincronizacion consulta nuevamente el estado y aplica efectos pendientes de forma idempotente.
6. El frontend puede consultar `GET /transactions/:id` para mostrar el resultado final.

Estados contemplados:

- `PENDING`
- `APPROVED`
- `DECLINED`
- `VOIDED`
- `ERROR`

## Requisitos

- Node.js `20+`
- npm `10+`
- PostgreSQL `16+` o Docker Desktop

## Instalacion y configuracion

1. Instalar dependencias:

```bash
npm install
```

2. Crear archivo `.env` a partir de [`.env.example`](file:///c:/Users/duvan/Documents/Node/credit-card-payment-checkout-back/.env.example).

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
| `BACKEND_PUBLIC_URL` | URL publica opcional usada como referencia en desarrollo |
| `PAYMENT_GATEWAY_SANDBOX_URL` | URL base sandbox de la pasarela |
| `PAYMENT_GATEWAY_PUBLIC_KEY` | Llave publica sandbox |
| `PAYMENT_GATEWAY_PRIVATE_KEY` | Llave privada sandbox |
| `PAYMENT_GATEWAY_EVENTS_KEY` | Llave de eventos sandbox |
| `PAYMENT_GATEWAY_INTEGRITY_KEY` | Llave de integridad sandbox |
| `TRANSACTION_SYNC_INTERVAL_SECONDS` | Intervalo en segundos para el job que sincroniza pagos aprobados y descuenta stock |

## Como correr el proyecto

### Con Node directamente

```bash
npm run start:dev
```

Documentacion Swagger:

```text
http://localhost:3000/api
```

### Build de produccion

```bash
npm run build
npm run start:prod
```

Nota: el build de Nest queda en:

```text
dist/src/main.js
```

### Con Docker

```bash
docker compose up --build
```

### Con base de datos remota

El contenedor puede vivir separado de la base de datos. En ese caso, `DATABASE_URL` debe apuntar al servidor remoto y no a `localhost`.

Ejemplo:

```env
DATABASE_URL=postgresql://usuario:password@host-remoto:5432/credit_card_checkout?schema=public
```

## Imagenes estaticas

Los productos guardan en base de datos solo el nombre del archivo de imagen. El backend construye la URL publica dinamicamente con el host por el que fue consultado el servicio.

Ejemplo:

```text
/imagenes/laptop_pro_15.png
```

En despliegue Docker, la carpeta `imagenes` debe existir dentro del contenedor. El `Dockerfile` actual ya la copia a la imagen final.

## Endpoints disponibles

| Metodo | Ruta | Descripcion |
|---|---|---|
| `GET` | `/products` | Lista todos los productos |
| `GET` | `/products/:id` | Retorna detalle de un producto |
| `GET` | `/transactions` | Lista ordenes recientes |
| `POST` | `/transactions/initiate` | Inicia y procesa una transaccion |
| `GET` | `/transactions/:id` | Consulta una transaccion |
| `GET` | `/health` | Health check |

### Ejemplo `POST /transactions/initiate`

```json
{
  "items": [
    {
      "productId": "cuid-del-producto",
      "quantity": 1
    }
  ],
  "cardToken": "tok_stagtest_12345_abcde12345",
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

## Ejemplos curl

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
```

Cobertura:

```bash
npm run test:cov
```

Compilacion:

```bash
npm run build
```

### Resultado actual

Suites actuales:

- `Test Suites`: `30 passed, 30 total`
- `Tests`: `98 passed, 98 total`
- `Snapshots`: `0 total`

Cobertura actual:

| Metrica | Resultado |
|---|---|
| `Statements` | `99.29%` |
| `Branches` | `92.3%` |
| `Functions` | `97%` |
| `Lines` | `99.22%` |

Estos resultados superan el umbral minimo solicitado de `80%`.

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
- `application`: DTOs, utilidades y casos de uso
- `infrastructure`: controladores, jobs y adaptadores Prisma / pasarela
- `shared`: filtros, interceptores, excepciones y utilidades comunes

## Decisiones tecnicas

- `PostgreSQL + Prisma` como persistencia principal.
- `NestJS 11` como framework base.
- Validaciones con `class-validator` y `ValidationPipe` global.
- El backend no procesa datos sensibles de tarjeta; solo recibe `cardToken`.
- Respuesta uniforme con interceptor `{ success: true, data }`.
- Errores estructurados con filtro global `{ success: false, error }`.
- Job de sincronizacion para confirmar pagos aprobados y aplicar stock de forma idempotente.
- Descuento inmediato de stock cuando el resultado final ya es `APPROVED`.
- Las imagenes publicas se resuelven dinamicamente segun la URL de la request.
