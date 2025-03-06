# atlas_mongo_api setup

1. Create a MongoDB in Atlas cluster, then set DB name in atlas_server_universal \_base.js

```bash
req.db = client.db("myFirstDatabase"); // Змініть на на вашу базу даних
```

2. Set your db pass in atlas_server_universal \_base.js

```bash
const uri =
  "mongodb+srv://admin:<db_password>@testcluster.cagmu.mongodb.net/?retryWrites=true&w=majority&appName=testCluster";
```

# atlas_mongo_api start

```bash
npm i
node atlas_server_universal_run.js
```

**API usage**:

collection name(e.g. myemployee_production) should be set during http call:
GET http://localhost:3000/api/myemployee_production - всі документи
GET http://localhost:3000/api/myemployee_production/:id - документ за ID
POST http://localhost:3000/api/myemployee_production - створення документа
PUT http://localhost:3000/api/myemployee_production/:id - оновлення документа
DELETE http://localhost:3000/api/myemployee_production/:id - видалення документа
GET http://localhost:3000/api/myemployee_production/search/query?name=John - пошук за параметрами
GET http://localhost:3000/api/myemployee_production/aggregate?field=age - агрегація по полю
