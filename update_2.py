import re

try:
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # 1. Update Metatitle
    html = html.replace('<title>ORIGEN · Estación de Decisión</title>', '<title>Demo Origen - Hackathon de Colsubsidio y 30X</title>')

    # 2. Add WhatsApp Button
    wa_btn = '<a href="https://wa.me/573196966226" target="_blank" style="position:fixed;bottom:22px;left:22px;background:#25D366;color:white;padding:10px 18px;border-radius:24px;text-decoration:none;font-weight:600;font-size:13px;display:flex;align-items:center;gap:8px;box-shadow:0 8px 24px rgba(0,0,0,0.4);z-index:100;transition:transform 0.2s;" onmouseover="this.style.transform=\'scale(1.05)\'" onmouseout="this.style.transform=\'scale(1)\'"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> Asesor de línea</a>'
    html = html.replace('</body>', wa_btn + '\n</body>')

    # 3. Privacy Masking & Code Comments
    js_privacy = """
// --- MODULO DE PRIVACIDAD (Privacy by Design) ---
// Enmascaramiento de datos personales (PII) para evitar fugas de información.
// Cumplimiento de la Ley 1581 de 2012.
let privacyMode = true; 
function maskName(name) {
    if (!privacyMode) return name;
    return name.split(' ').map(w => w.charAt(0) + '*'.repeat(Math.max(0, w.length - 1))).join(' ');
}
function maskId(id) {
    if (!privacyMode) return id;
    return id.replace(/\d/g, '*');
}
// ------------------------------------------------
"""
    html = html.replace('const $=id=>document.getElementById(id);', js_privacy + '\nconst $=id=>document.getElementById(id);')

    html = html.replace('${esc(d.a.nombre)}', '${esc(maskName(d.a.nombre))}')
    html = html.replace('${d.a.id}', '${maskId(d.a.id)}')
    html = html.replace('>${d.a.nombre}</div>', '>${maskName(d.a.nombre)}</div>')
    
    # Add privacy toggle in the top bar
    user_html_orig = '<div class="wn">Laura Medina</div><div class="wr">Analista de crédito</div>'
    user_html_new = '<div class="wn">Laura Medina</div><div class="wr" style="display:flex;align-items:center;gap:6px;">Analista <label style="display:inline-flex;align-items:center;cursor:pointer;gap:4px;color:var(--brass);"><input type="checkbox" checked onchange="privacyMode=this.checked;renderBandeja();" style="accent-color:var(--brass);"> Ocultar PII</label></div>'
    html = html.replace(user_html_orig, user_html_new)
    
    # 4. Footer
    footer = '<div style="text-align:center; padding: 24px; font-size: 11px; color: var(--faint); line-height: 1.7; border-top: 1px solid var(--line); margin-top: 30px;"><b>Demo Origen</b><br>Hackathon de Colsubsidio y 30X<br>Jesus Ruiz y Yeisson Abril<br>Julio 2026</div>'
    
    html = html.replace('<div class="tfoot"><span>Mostrando ${Math.min(60,list.length)} de ${list.length}</span><span>Orden: prioridad del motor</span></div>  </div>`;', '<div class="tfoot"><span>Mostrando ${Math.min(60,list.length)} de ${list.length}</span><span>Orden: prioridad del motor</span></div>  </div>' + footer + '`;')
    
    html = html.replace('<style>', '<!-- ESTILOS: Alineados al manual de marca de Colsubsidio -->\n<style>')
    html = html.replace('<script>', '<script>\n// ===================================\n// CORE DEL MOTOR DETERMINÍSTICO ORIGEN\n// Generación determinística, scoring y proyección sin dependencias\n// ===================================\n')
    
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Done")
except Exception as e:
    print(e)
