import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Creamos un pool para no tener que abrir/cerrar conexiones cada vez
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "agenda",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const servidor = http.createServer(async (req, res) => {
  if (req.method !== "GET") {
    res.writeHead(405, { "Content-Type": "text/plain" });
    return res.end("Solo acepto peticiones GET");
  }

  // Archivos estáticos
  let filePath;
  let contentType;

  if (req.url === "/index") {
    filePath = path.join(__dirname, "src", "index.html");
    contentType = "text/html";
  } else if (req.url === "/getUserInfo") {
    filePath = path.join(__dirname, "src", "getUserInfo.html");
    contentType = "text/html";
  } else if (req.url.startsWith("/img/") || req.url.endsWith(".css") || req.url.endsWith(".js")) {
    filePath = path.join(__dirname, "src", req.url);
    if (filePath.endsWith(".css")) contentType = "text/css";
    else if (filePath.endsWith(".png")) contentType = "image/png";
    else if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) contentType = "image/jpeg";
    else if (filePath.endsWith(".js")) contentType = "application/javascript";
    else contentType = "application/octet-stream";
  }

  if (filePath) {
    return fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Archivo no encontrado");
      } else {
        res.writeHead(200, { "Content-Type": contentType });
        res.end(data);
      }
    });
  }

  // Rutas API
  if (req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    return res.end("Hola!");
  }

  if (req.url === "/saludo") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    return res.end("Hola desde el saludo");
  }

  if (req.url === "/getUserInfo/api") {
    try {
      const [rows] = await pool.query("SELECT * FROM informacion");
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(rows));
    } catch (err) {
      console.error(err);
      res.writeHead(500, { "Content-Type": "text/plain" });
      return res.end("Error al conectar con la base de datos");
    }
  }

  // BUSCAR POR TELEFONO, poner en el navegador /getUserInfo/api/telefono=xxxxxxxxxx
  if (req.url.startsWith("/getUserInfo/api/telefono=")) {
    const telefono = decodeURIComponent(req.url.split("=").pop());
    try {
      const [rows] = await pool.query("SELECT * FROM informacion WHERE telefono = ?", [telefono]);
      if (rows.length > 0) {
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(rows[0]));
      } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        return res.end("Usuario no encontrado");
      }
    } catch (err) {
      console.error(err);
      res.writeHead(500, { "Content-Type": "text/plain" });
      return res.end("Error al consultar la base de datos");
    }
  }

  // BUSCAR POR ID
  if (req.url.startsWith("/getUserInfo/api/")) {
    const id = req.url.split("/").pop();
    try {
      const [rows] = await pool.query("SELECT * FROM informacion WHERE id = ?", [id]);
      if (rows.length > 0) {
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(rows[0]));
      } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        return res.end("Usuario no encontrado");
      }
    } catch (err) {
      console.error(err);
      res.writeHead(500, { "Content-Type": "text/plain" });
      return res.end("Error al consultar la base de datos");
    }
  }

  if (req.url === "/autor") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    return res.end("Soy Pablo y este es mi primer servidor con Node.js");
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Ruta no encontrada");
});

const PORT = 3000;
servidor.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});


async function conectarDB() {
  const conexion = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "agenda"
  });

  return new Promise((resolve, reject) => {
    conexion.connect((err) => {
      if (err) reject(err);
      else {
        const query = "SELECT * FROM informacion";
        conexion.query(query, (error, resultados) => {
          if (error) reject(error);
          else resolve(resultados);
        });
      }
    });
  });
}

async function obtenerUsuarioPorId(id) {
  const conexion = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "agenda"
  });

  return new Promise((resolve, reject) => {
    conexion.connect((err) => {
      if (err) reject(err);
      else {
        const query = "SELECT * FROM informacion WHERE id = ?";
        conexion.query(query, [id], (error, resultados) => {
          if (error) reject(error);
          else resolve(resultados[0]); // devuelve el primer resultado
        });
      }
    });
  });
}

async function obtenerUsuarioPorTelefono(telefono) {
  const conexion = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "agenda"
  });

  return new Promise((resolve, reject) => {
    conexion.connect((err) => {
      if (err) reject(err);
      else {
        const query = "SELECT * FROM informacion WHERE telefono = ?";
        conexion.query(query, [telefono], (error, resultados) => {
          if (error) reject(error);
          else resolve(resultados[0]); // devuelve el primer resultado
        });
      }
    });
  });
}

