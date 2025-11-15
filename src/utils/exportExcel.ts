import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import XLSX from "xlsx";
import { Asset } from "../types/Asset";

export async function exportAssetsToExcel(assets: Asset[]) {
  try {
    if (!assets || assets.length === 0) {
      throw new Error("No hay activos para exportar.");
    }

    // ==============================
    // 1️⃣ Preparar datos del Excel
    // ==============================
    const data = assets.map((a) => ({
      ID: a.id,
      Nombre: a.nombre,
      Categoría: a.categoria,
      Estado: a.estado,
      Ubicación: a.ubicacion,
      "Fecha Adquisición": a.fechaAdquisicion,
      "Fecha Registro": a.fechaRegistro,
      "Costo Inicial (USD)": a.costoInicial,
      "Depreciación Anual (%)": a.depreciacionAnual,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);

    // Ajuste automático del ancho de columnas
    worksheet["!cols"] = Object.keys(data[0]).map((key) => ({
      wch: Math.max(key.length, 18),
    }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Activos");

    // ==============================
    // 2️⃣ Convertir a Base64
    // ==============================
    const excelBase64 = XLSX.write(workbook, {
      type: "base64",
      bookType: "xlsx",
    });

    // ==============================
    // 3️⃣ Crear archivo temporal
    // ==============================
    const fileUri =
      FileSystem.cacheDirectory + `reporte_activos_${Date.now()}.xlsx`;

    await FileSystem.writeAsStringAsync(fileUri, excelBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // ==============================
    // 4️⃣ Compartir archivo
    // ==============================
    await Sharing.shareAsync(fileUri, {
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      dialogTitle: "Exportar activos a Excel",
    });

    console.log("✔ Excel exportado exitosamente");

  } catch (error) {
    console.error("❌ Error exportando Excel:", error);
    throw error;
  }
}
