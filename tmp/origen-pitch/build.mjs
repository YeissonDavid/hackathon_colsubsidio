import fs from "node:fs/promises";
import path from "node:path";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const ROOT = "D:\\PROYECTOS\\HACKATONES\\30X\\hackaton_colsubsidio\\hackathon_colsubsidio";
const TMP = path.join(ROOT, "tmp", "origen-pitch");
const ASSETS = path.join(ROOT, "output", "pitch-assets");
const BRAND = path.join(ROOT, "assets", "brand");
const FINAL = path.join(ROOT, "output", "ORIGEN_Pitch_Final.pptx");
const PREVIEWS = path.join(TMP, "previews");

const C = {
  yellow: "#FFD000",
  blue: "#0067B1",
  graphite: "#575756",
  ink: "#07101B",
  navy: "#0B1420",
  panel: "#131E2A",
  panel2: "#1B2736",
  white: "#FFFFFF",
  mist: "#D5DEE8",
  muted: "#93A3B5",
  green: "#2DBE7F",
  red: "#E35D67",
};

const SLIDE_W = 1280;
const SLIDE_H = 720;

async function bytes(filePath) {
  const b = await fs.readFile(filePath);
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
}

function addText(slide, text, x, y, w, h, {
  size = 24,
  color = C.white,
  bold = false,
  align = "left",
  name = "text",
  font = "Arial",
} = {}) {
  const shape = slide.shapes.add({
    geometry: "textbox",
    name,
    position: { left: x, top: y, width: w, height: h },
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  shape.text = text;
  shape.text.style = {
    fontFamily: font,
    fontSize: size,
    bold,
    color,
    alignment: align,
  };
  return shape;
}

function addRule(slide, x, y, w, color = C.yellow, height = 4, name = "rule") {
  return slide.shapes.add({
    geometry: "rect",
    name,
    position: { left: x, top: y, width: w, height },
    fill: color,
    line: { style: "solid", fill: "none", width: 0 },
  });
}

function addRect(slide, x, y, w, h, fill, {
  line = "none",
  lineWidth = 0,
  radius = 0,
  name = "rect",
  shadow,
} = {}) {
  return slide.shapes.add({
    geometry: radius ? "roundRect" : "rect",
    name,
    position: { left: x, top: y, width: w, height: h },
    fill,
    line: { style: "solid", fill: line, width: lineWidth },
    ...(radius ? { borderRadius: radius } : {}),
    ...(shadow ? { shadow } : {}),
  });
}

async function addImage(slide, filePath, x, y, w, h, {
  fit = "cover",
  alt = "Imagen",
  radius,
  name,
} = {}) {
  return slide.images.add({
    blob: await bytes(filePath),
    contentType: "image/png",
    alt,
    fit,
    position: { left: x, top: y, width: w, height: h },
    ...(radius ? { geometry: "roundRect", borderRadius: radius } : {}),
    ...(name ? { name } : {}),
  });
}

function addLogo(slide, x = 64, y = 36, w = 190, h = 40) {
  return addImage(
    slide,
    path.join(BRAND, "logo.png"),
    x,
    y,
    w,
    h,
    { fit: "contain", alt: "Colsubsidio" },
  );
}

function addSlideNumber(slide, n) {
  addText(slide, `${String(n).padStart(2, "0")} / 05`, 1134, 42, 86, 24, {
    size: 14,
    color: C.muted,
    bold: true,
    align: "right",
    name: `slide-number-${n}`,
  });
}

function addNotes(slide, lines) {
  slide.speakerNotes.textFrame.setText(lines.join("\n"));
  slide.speakerNotes.setVisible(true);
}

async function main() {
  await fs.mkdir(PREVIEWS, { recursive: true });
  await fs.mkdir(path.dirname(FINAL), { recursive: true });

  const deck = Presentation.create({
    slideSize: { width: SLIDE_W, height: SLIDE_H },
  });

  // 1 — Portada
  {
    const slide = deck.slides.add();
    slide.background.fill = C.ink;
    await addImage(
      slide,
      path.join(ASSETS, "origen-cover.png"),
      0, 0, SLIDE_W, SLIDE_H,
      { alt: "Analista y señales financieras que convergen en una decisión" },
    );
    addRect(slide, 0, 0, 660, SLIDE_H, "#050B12/82", { name: "cover-overlay" });
    addRect(slide, 0, 0, SLIDE_W, 8, C.yellow, { name: "brand-top-rule" });
    await addLogo(slide, 64, 38, 188, 38);
    addText(slide, "RETO 01 · CRÉDITO HIPERPERSONALIZADO", 64, 148, 520, 30, {
      size: 16, color: C.yellow, bold: true, name: "cover-eyebrow",
    });
    addText(slide, "ORIGEN", 64, 194, 520, 84, {
      size: 66, color: C.white, bold: true, name: "cover-title",
    });
    addText(slide, "Una decisión financiera\nque mejora una vida.", 64, 286, 520, 126, {
      size: 42, color: C.white, bold: true, name: "cover-tagline",
    });
    addRule(slide, 64, 438, 94, C.yellow, 5, "cover-rule");
    addText(
      slide,
      "El copiloto que decide qué ofrecer, cuándo y por qué canal — y sabe decir «hoy no».",
      64, 466, 500, 84,
      { size: 23, color: C.mist, name: "cover-subtitle" },
    );
    addText(slide, "Hackathon Colsubsidio × 30X · Julio 2026", 64, 648, 500, 24, {
      size: 15, color: C.muted, name: "cover-footer",
    });
    addNotes(slide, [
      "Apertura: el reto no es colocar más crédito; es tomar una mejor decisión para cada afiliado.",
      "",
      "[Sources]",
      "- https://innovacion.colsubsidio.com/ — formulación oficial del reto y evento.",
      `- ${path.join(ROOT, "README.md")} — propósito y propuesta de ORIGEN.`,
      `- ${path.join(TMP, "prompt-records.txt")} — prompt del visual generado para portada.`,
      "[/Sources]",
    ]);
  }

  // 2 — Problema
  {
    const slide = deck.slides.add();
    slide.background.fill = C.ink;
    await addImage(
      slide,
      path.join(ASSETS, "origen-problema.png"),
      0, 0, SLIDE_W, SLIDE_H,
      { alt: "Afiliado abrumado por ofertas financieras genéricas" },
    );
    addRect(slide, 0, 0, 670, SLIDE_H, "#050B12/88", { name: "problem-overlay" });
    addRect(slide, 0, 0, 10, SLIDE_H, C.blue, { name: "problem-blue-edge" });
    await addLogo(slide, 64, 34, 175, 35);
    addSlideNumber(slide, 2);
    addText(slide, "La personalización falla\ncuando empieza por el producto.", 64, 112, 560, 112, {
      size: 40, color: C.white, bold: true, name: "problem-title",
    });
    addText(slide, "OFERTA GENÉRICA", 64, 272, 220, 28, {
      size: 16, color: C.yellow, bold: true, name: "problem-1-label",
    });
    addText(slide, "Ignora el momento de vida.", 64, 302, 420, 34, {
      size: 23, color: C.white, name: "problem-1-copy",
    });
    addRule(slide, 64, 346, 470, "#314154", 1, "problem-rule-1");
    addText(slide, "CANAL INCORRECTO", 64, 370, 220, 28, {
      size: 16, color: C.blue, bold: true, name: "problem-2-label",
    });
    addText(slide, "Convierte atención en fricción.", 64, 400, 430, 34, {
      size: 23, color: C.white, name: "problem-2-copy",
    });
    addRule(slide, 64, 444, 470, "#314154", 1, "problem-rule-2");
    addText(slide, "DECISIÓN OPACA", 64, 468, 220, 28, {
      size: 16, color: C.red, bold: true, name: "problem-3-label",
    });
    addText(slide, "Debilita confianza y control.", 64, 498, 430, 34, {
      size: 23, color: C.white, name: "problem-3-copy",
    });
    addRect(slide, 64, 576, 500, 90, "#0F2A43/94", {
      line: C.blue, lineWidth: 1, radius: 14, name: "problem-thesis",
    });
    addText(slide, "La pregunta no es qué crédito colocar.\nEs cuál decisión mejora a esta persona, hoy.", 86, 594, 456, 58, {
      size: 21, color: C.white, bold: true, name: "problem-thesis-copy",
    });
    addNotes(slide, [
      "Tensión: una oferta puede ser elegible y aun así ser irrelevante, inoportuna o dañina.",
      "",
      "[Sources]",
      "- https://innovacion.colsubsidio.com/ — el reto pide decidir qué ofrecer, cuándo y por qué canal.",
      `- ${path.join(ROOT, "README.md")} — cambio de pregunta: de colocación a mejor decisión financiera.`,
      `- ${path.join(TMP, "prompt-records.txt")} — prompt del visual generado para esta diapositiva.`,
      "[/Sources]",
    ]);
  }

  // 3 — Solución
  {
    const slide = deck.slides.add();
    slide.background.fill = C.navy;
    addRect(slide, 0, 0, SLIDE_W, 8, C.yellow, { name: "solution-top-rule" });
    await addLogo(slide, 64, 34, 175, 35);
    addSlideNumber(slide, 3);
    addText(slide, "ORIGEN delibera antes de ofrecer.", 64, 112, 920, 54, {
      size: 42, color: C.white, bold: true, name: "solution-title",
    });
    addText(
      slide,
      "Una caja de cristal conecta datos autorizados, capacidad, portafolio y bienestar.",
      64, 174, 900, 36,
      { size: 22, color: C.mist, name: "solution-subtitle" },
    );

    // Conectores primero para mantenerlos detrás de los nodos.
    addRule(slide, 152, 350, 976, "#284C69", 4, "solution-baseline");
    addRect(slide, 336, 338, 34, 28, C.blue, { name: "arrow-1" });
    addRect(slide, 622, 338, 34, 28, C.blue, { name: "arrow-2" });
    addRect(slide, 908, 338, 34, 28, C.blue, { name: "arrow-3" });
    addText(slide, "›", 338, 327, 32, 40, { size: 38, color: C.white, bold: true, align: "center", name: "arrow-glyph-1" });
    addText(slide, "›", 624, 327, 32, 40, { size: 38, color: C.white, bold: true, align: "center", name: "arrow-glyph-2" });
    addText(slide, "›", 910, 327, 32, 40, { size: 38, color: C.white, bold: true, align: "center", name: "arrow-glyph-3" });

    const stages = [
      { x: 110, n: "01", label: "SEÑALES", copy: "In-house + exógenas\nautorizadas", color: C.blue },
      { x: 396, n: "02", label: "DELIBERA", copy: "7 productos +\ncapacidad de pago", color: C.yellow },
      { x: 682, n: "03", label: "PROYECTA", copy: "Otorgar · esperar ·\nacompañar", color: C.blue },
      { x: 968, n: "04", label: "RESUELVE", copy: "Producto · monto ·\ncanal · razón", color: C.yellow },
    ];
    for (const s of stages) {
      addRect(slide, s.x, 314, 76, 76, s.color, {
        line: C.white, lineWidth: 1, radius: 38, name: `stage-node-${s.n}`,
      });
      addText(slide, s.n, s.x, 333, 76, 30, {
        size: 22, color: C.ink, bold: true, align: "center", name: `stage-number-${s.n}`,
      });
      addText(slide, s.label, s.x - 18, 414, 112, 28, {
        size: 17, color: s.color, bold: true, align: "center", name: `stage-label-${s.n}`,
      });
      addText(slide, s.copy, s.x - 42, 452, 160, 66, {
        size: 18, color: C.white, align: "center", name: `stage-copy-${s.n}`,
      });
    }

    addRect(slide, 190, 572, 900, 92, "#101E2B", {
      line: C.yellow, lineWidth: 2, radius: 18, name: "route-callout",
    });
    addRect(slide, 214, 598, 16, 40, C.yellow, { radius: 8, name: "route-marker" });
    addText(slide, "Si prestar empeora el bienestar, la mejor decisión es acompañar.", 252, 590, 802, 56, {
      size: 25, color: C.white, bold: true, align: "center", name: "route-copy",
    });
    addNotes(slide, [
      "Núcleo: ORIGEN compara alternativas y escenarios; el producto no manda sobre el bienestar.",
      "",
      "[Sources]",
      `- ${path.join(ROOT, "README.md")} — siete líneas, ranking, proyección y Ruta de Bienestar.`,
      `- ${path.join(ROOT, "SPEC.md")} — flujo de enriquecimiento, deliberación, proyección y resolución.`,
      `- ${path.join(ROOT, "docs", "ARCHITECTURE.md")} — arquitectura del motor determinístico.`,
      "[/Sources]",
    ]);
  }

  // 4 — Evidencia
  {
    const slide = deck.slides.add();
    slide.background.fill = C.ink;
    addRect(slide, 0, 0, 10, SLIDE_H, C.yellow, { name: "proof-yellow-edge" });
    await addLogo(slide, 64, 34, 175, 35);
    addSlideNumber(slide, 4);
    addText(slide, "Una cédula entra; una decisión auditable sale.", 64, 102, 1100, 54, {
      size: 40, color: C.white, bold: true, name: "proof-title",
    });
    addText(slide, "75/75", 64, 206, 300, 68, {
      size: 58, color: C.yellow, bold: true, name: "proof-tests-number",
    });
    addText(slide, "pruebas en verde", 68, 272, 260, 28, {
      size: 20, color: C.mist, name: "proof-tests-label",
    });
    addRule(slide, 64, 322, 300, "#314154", 1, "proof-rule-1");
    addText(slide, "0", 64, 350, 130, 66, {
      size: 58, color: C.blue, bold: true, name: "proof-deps-number",
    });
    addText(slide, "dependencias externas", 68, 416, 280, 28, {
      size: 20, color: C.mist, name: "proof-deps-label",
    });
    addRule(slide, 64, 466, 300, "#314154", 1, "proof-rule-2");
    addText(slide, "220", 64, 494, 170, 66, {
      size: 58, color: C.white, bold: true, name: "proof-pop-number",
    });
    addText(slide, "perfiles demo reproducibles", 68, 560, 300, 48, {
      size: 20, color: C.mist, name: "proof-pop-label",
    });
    addText(slide, "PII enmascarada por defecto", 68, 628, 300, 28, {
      size: 16, color: C.green, bold: true, name: "proof-privacy",
    });

    addRect(slide, 426, 178, 798, 470, "#152231", {
      line: C.blue, lineWidth: 2, radius: 18, shadow: "shadow-lg", name: "proof-frame",
    });
    await addImage(
      slide,
      path.join(ASSETS, "origen-proyeccion.png"),
      440, 192, 770, 442,
      {
        alt: "Captura del MVP ORIGEN con capacidad, deliberación y resolución",
        radius: 14,
      },
    );
    addRect(slide, 464, 608, 712, 44, "#07101B/94", { radius: 10, name: "proof-caption-bg" });
    addText(slide, "Monto · cuota · plazo · canal · franja · explicación", 482, 619, 676, 24, {
      size: 16, color: C.white, bold: true, align: "center", name: "proof-caption",
    });
    addNotes(slide, [
      "Demostración: abrir un caso y mostrar cómo la capacidad, el ranking y la entrega sostienen la resolución.",
      "",
      "[Sources]",
      `- ${path.join(ROOT, "tests", "run-node.js")} y tests/specs/* — ejecución verificada: 75/75 pruebas correctas.`,
      `- ${path.join(ROOT, "README.md")} — cero dependencias externas y población demo.`,
      `- ${path.join(ASSETS, "origen-proyeccion.png")} — captura local del MVP el 26-jul-2026.`,
      "[/Sources]",
    ]);
  }

  // 5 — Cierre
  {
    const slide = deck.slides.add();
    slide.background.fill = C.ink;
    await addImage(
      slide,
      path.join(ASSETS, "origen-cierre.png"),
      0, 0, SLIDE_W, SLIDE_H,
      { alt: "Familia y asesora avanzan hacia una decisión financiera responsable" },
    );
    addRect(slide, 0, 0, 690, SLIDE_H, "#050B12/88", { name: "close-overlay" });
    addRect(slide, 0, 0, SLIDE_W, 8, C.yellow, { name: "close-top-rule" });
    await addLogo(slide, 64, 34, 175, 35);
    addSlideNumber(slide, 5);
    addText(slide, "Piloteemos una decisión mejor,\nno una oferta más.", 64, 118, 580, 112, {
      size: 42, color: C.white, bold: true, name: "close-title",
    });
    addText(slide, "ORIGEN está listo para pasar de demo a piloto con Colsubsidio.", 64, 246, 540, 54, {
      size: 21, color: C.mist, name: "close-subtitle",
    });

    const pilot = [
      ["01", "Conectar fuentes reales"],
      ["02", "Calibrar política de riesgo"],
      ["03", "Medir conversión y bienestar"],
    ];
    pilot.forEach(([n, label], i) => {
      const y = 328 + i * 72;
      addText(slide, n, 64, y, 52, 30, {
        size: 17, color: C.yellow, bold: true, name: `pilot-number-${n}`,
      });
      addText(slide, label, 126, y - 2, 420, 34, {
        size: 23, color: C.white, bold: true, name: `pilot-label-${n}`,
      });
      if (i < 2) addRule(slide, 126, y + 44, 420, "#314154", 1, `pilot-rule-${n}`);
    });

    addRect(slide, 64, 574, 8, 92, C.yellow, { name: "close-quote-rule" });
    addText(slide, "El mejor crédito no es el que se puede aprobar,\nsino el que mejora una vida.", 90, 580, 520, 82, {
      size: 24, color: C.white, bold: true, name: "close-quote",
    });
    addNotes(slide, [
      "Cierre: solicitar una decisión concreta — un piloto con fuentes reales, política calibrada y medición doble de negocio y bienestar.",
      "",
      "[Sources]",
      "- https://innovacion.colsubsidio.com/ — las soluciones ganadoras pasan a evaluación con el equipo de producto.",
      `- ${path.join(ROOT, "README.md")} — propósito y frase central de ORIGEN.`,
      `- ${path.join(TMP, "prompt-records.txt")} — prompt del visual generado para el cierre.`,
      "[/Sources]",
    ]);
  }

  for (const [index, slide] of deck.slides.items.entries()) {
    const stem = `slide-${String(index + 1).padStart(2, "0")}`;
    const png = await deck.export({ slide, format: "png", scale: 1 });
    await fs.writeFile(path.join(PREVIEWS, `${stem}.png`), new Uint8Array(await png.arrayBuffer()));
    const layout = await slide.export({ format: "layout" });
    await fs.writeFile(path.join(PREVIEWS, `${stem}.layout.json`), await layout.text(), "utf8");
  }

  const montage = await deck.export({ format: "webp", montage: true, scale: 1 });
  await fs.writeFile(path.join(PREVIEWS, "montage.webp"), new Uint8Array(await montage.arrayBuffer()));

  const pptx = await PresentationFile.exportPptx(deck);
  await pptx.save(FINAL);
  console.log(FINAL);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

