import ModbusRTU from "modbus-serial";
import cron from "cron";
import { connectTrancaPostaDB } from "../copEnergyGeneration/server/configs/connectDB.js";

const client = new ModbusRTU();
let isConnecting = false;

// 🔌 Conexión robusta con reintentos
async function connect(ip, port, slaveId) {
  if (client.isOpen) return;

  if (!isConnecting) {
    isConnecting = true;
    try {
      await client.connectTCP(ip, { port });
      client.setID(slaveId);
      console.log("✅ Conexión Modbus establecida");
    } catch (err) {
      console.error("❌ Error de conexión:", err.message);
    } finally {
      isConnecting = false;
    }
  }
}

// 🔄 Funciones de conversión (sin cambios)
function convertirADiscreteInput(addr) {
  return addr - 100001;
}
function convertirACoil(addr) {
  return addr - 1;
}

// 📘 Lecturas Modbus optimizadas
async function readDiscreteInput(ip, port, slaveId, address) {
  try {
    await connect(ip, port, slaveId);
    const result = await client.readDiscreteInputs(address, 1);
    return result.data[0];
  } catch (err) {
    console.error(
      `❌ Error entrada discreta ${address + 100001}:`,
      err.message
    );
    return null;
  }
}

async function readCoil(ip, port, slaveId, address) {
  try {
    await connect(ip, port, slaveId);
    const result = await client.readCoils(address, 1);
    return result.data[0];
  } catch (err) {
    console.error(`❌ Error coil ${address + 1}:`, err.message);
    return null;
  }
}

async function guardarDato(nombre, valorBool) {
  const valor = valorBool ? 1 : 0;
  const estado = valorBool ? "ACTIVO" : "INACTIVO";
  const fecha = new Date();

  try {
    const conn = await connectTrancaPostaDB.getConnection();
    await conn.execute(
      "INSERT INTO lectura_datos (fecha, nombre, valor, estado) VALUES (?, ?, ?, ?)",
      [fecha, nombre, valor, estado]
    );
    conn.release();
  } catch (err) {
    console.error(`❌ Error guardando ${nombre}:`, err.message);
  }
}

// 🚀 Función principal
async function main() {
  const ip = "192.168.6.16";
  const port = 502;
  const slaveId = 1;

  const abrirRele = await readDiscreteInput(
    ip,
    port,
    slaveId,
    convertirADiscreteInput(100012)
  );
  const cerrarRele = await readDiscreteInput(
    ip,
    port,
    slaveId,
    convertirADiscreteInput(100011)
  );
  const abrirTranca = await readCoil(ip, port, slaveId, convertirACoil(16));
  const cerrarTranca = await readCoil(ip, port, slaveId, convertirACoil(15));

  console.log("🔍 Estado actual:");
  console.log(`🟢 Rele abrir (100012): ${abrirRele ? "ACTIVO" : "INACTIVO"}`);
  console.log(`🔴 Rele cerrar (100011): ${cerrarRele ? "ACTIVO" : "INACTIVO"}`);
  console.log(
    `🔓 Tranca abrir (000016): ${abrirTranca ? "ACTIVO" : "INACTIVO"}`
  );
  console.log(
    `🔒 Tranca cerrar (000015): ${cerrarTranca ? "ACTIVO" : "INACTIVO"}`
  );

  // Guardar en base de datos
  await guardarDato("Rele_abrir", abrirRele);
  await guardarDato("Rele_cerrar", cerrarRele);
  await guardarDato("Tranca_abrir", abrirTranca);
  await guardarDato("Tranca_cerrar", cerrarTranca);
}

// ⏰ Cron cada segundos
const job = new cron.CronJob("* * * * * *", () => {
  console.log("\n⏱️ Ejecutando lectura Modbus...");
  main().catch(() => client.close());
});

job.start();
