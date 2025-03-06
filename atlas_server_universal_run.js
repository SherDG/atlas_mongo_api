const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

const uri =
  "mongodb+srv://admin:<PASSWORD>@testcluster.cagmu.mongodb.net/?retryWrites=true&w=majority&appName=testCluster";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Middleware для підключення до бази даних
async function connectToDatabase(req, res, next) {
  try {
    if (!client.connect()) {
      await client.connect();
    }
    req.dbClient = client;
    req.db = client.db("myFirstDatabase"); // Змініть на на вашу базу даних
    next();
  } catch (error) {
    console.error("Помилка підключення до бази даних:", error);
    res.status(500).json({ error: "Помилка підключення до бази даних" });
  }
}

// Використовуємо middleware для всіх routes
app.use(connectToDatabase);

// GET всі документи з колекції
app.get("/api/:collection", async (req, res) => {
  try {
    const collection = req.db.collection(req.params.collection);
    const documents = await collection.find({}).toArray();
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET документ за ID
app.get("/api/:collection/:id", async (req, res) => {
  try {
    const collection = req.db.collection(req.params.collection);
    const document = await collection.findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!document) {
      return res.status(404).json({ message: "Документ не знайдено" });
    }
    res.json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST створення нового документа
app.post("/api/:collection", async (req, res) => {
  try {
    const collection = req.db.collection(req.params.collection);
    const result = await collection.insertOne({
      ...req.body,
      createdAt: new Date(),
    });

    const newDocument = await collection.findOne({
      _id: result.insertedId,
    });
    res.status(201).json(newDocument);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT оновлення документа
app.put("/api/:collection/:id", async (req, res) => {
  try {
    const collection = req.db.collection(req.params.collection);
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          ...req.body,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    if (!result) {
      return res.status(404).json({ message: "Документ не знайдено" });
    }
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE видалення документа
app.delete("/api/:collection/:id", async (req, res) => {
  try {
    const collection = req.db.collection(req.params.collection);
    const result = await collection.findOneAndDelete({
      _id: new ObjectId(req.params.id),
    });

    if (!result) {
      return res.status(404).json({ message: "Документ не знайдено" });
    }
    res.json({ message: "Документ видалено", deletedDocument: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET пошук документів за параметрами
app.get("/api/:collection/search/query", async (req, res) => {
  try {
    const collection = req.db.collection(req.params.collection);
    const query = {};

    // Видаляємо службові параметри з запиту
    const searchParams = { ...req.query };
    delete searchParams.collection;

    // Створюємо запит з усіх переданих параметрів
    Object.keys(searchParams).forEach((key) => {
      // Перевіряємо, чи є значення числом
      if (!isNaN(searchParams[key])) {
        query[key] = Number(searchParams[key]);
      } else {
        query[key] = { $regex: searchParams[key], $options: "i" };
      }
    });

    const documents = await collection.find(query).toArray();
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET агрегація даних
app.get("/api/:collection/aggregate", async (req, res) => {
  try {
    const collection = req.db.collection(req.params.collection);

    // Отримуємо параметри агрегації з запиту
    const { field } = req.query;

    if (!field) {
      return res
        .status(400)
        .json({ message: "Необхідно вказати поле для агрегації" });
    }

    const pipeline = [
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          avg: { $avg: `$${field}` },
          min: { $min: `$${field}` },
          max: { $max: `$${field}` },
        },
      },
    ];

    const stats = await collection.aggregate(pipeline).toArray();
    res.json(stats[0] || { message: "Немає даних для агрегації" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Обробка помилок підключення
process.on("SIGINT", async () => {
  try {
    await client.close();
    console.log("MongoDB відключено");
    process.exit(0);
  } catch (error) {
    console.error("Помилка при закритті з'єднання:", error);
    process.exit(1);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущено на порту ${PORT}`);
});
