import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const servidor = http.createServer(async (req, res) => {
  if (req.method === "GET") {
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
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("Archivo no encontrado");
        } else {
          res.writeHead(200, { "Content-Type": contentType });
          res.end(data);
        }
      });
    } 
    else if (req.url === "/") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Hola!");
    } 
    else if (req.url === "/saludo") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Hola desde el saludo");
    } 
    // ✅ TODA la lista
    else if (req.url === "/getUserInfo/api") {
      try {
        const lista = await conectarDB();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(lista));
      } catch (err) {
        console.error(err);
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Error al conectar con la base de datos");
      }
    }
    // ✅ Usuario por ID (por ejemplo /getUserInfo/api/3)
    else if (req.url.startsWith("/getUserInfo/api/")) {
      const id = req.url.split("/").pop(); // obtiene el número al final
      try {
        const usuario = await obtenerUsuarioPorId(id);
        if (usuario) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(usuario));
        } else {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("Usuario no encontrado");
        }
      } catch (err) {
        console.error(err);
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Error al consultar la base de datos");
      }
    }
    else if (req.url === "/autor") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Soy Pablo y este es mi primer servidor con Node.js");
    } 
    else {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Ruta no encontrada");
    }

  } else {
    res.writeHead(405, { "Content-Type": "text/plain" });
    res.end("Solo acepto peticiones GET");
  }
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
