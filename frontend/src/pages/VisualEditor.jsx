import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api, API_URL } from "@/lib/api";
import { ArrowLeft, Save, FileCode, Image as ImageIcon, Monitor, Tablet, Smartphone, Loader2, Type } from "lucide-react";
import { toast } from "sonner";

const VIEWPORTS = {
  desktop: { w: "100%", icon: Monitor, label: "Desktop" },
  tablet:  { w: "820px", icon: Tablet, label: "Tablet" },
  mobile:  { w: "390px", icon: Smartphone, label: "Mobile" },
};

const EDITOR_SCRIPT = `
<script>
(function() {
  function isEditableText(node) {
    if (!node || node.nodeType !== 1) return false;
    var blocked = ['SCRIPT','STYLE','META','LINK','HEAD','HTML','BODY','IMG','SVG','PATH','VIDEO','AUDIO','CANVAS','IFRAME'];
    if (blocked.indexOf(node.tagName) !== -1) return false;
    // only text-containing leaves
    return node.children.length === 0 && (node.textContent || '').trim().length > 0;
  }

  function applyEditableMarks() {
    var all = document.body.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      var n = all[i];
      if (isEditableText(n)) {
        n.setAttribute('data-lp-editable', '1');
        n.setAttribute('contenteditable', 'true');
        n.setAttribute('spellcheck', 'false');
      } else if (n.tagName === 'IMG') {
        n.setAttribute('data-lp-image', '1');
      }
    }
  }

  function selected(el) {
    document.querySelectorAll('[data-lp-active]').forEach(function(x){ x.removeAttribute('data-lp-active'); });
    if (el) el.setAttribute('data-lp-active', '1');
  }

  document.addEventListener('click', function(e) {
    var t = e.target;
    if (t.matches('[data-lp-image]')) {
      e.preventDefault();
      selected(t);
      var rect = t.getBoundingClientRect();
      var src = t.getAttribute('src') || '';
      parent.postMessage({ type: 'lp:image-click', src: src, rect: { x: rect.left, y: rect.top, w: rect.width, h: rect.height } }, '*');
    } else if (t.matches('[data-lp-editable]')) {
      selected(t);
      parent.postMessage({ type: 'lp:text-focus', text: t.textContent }, '*');
    }
  }, true);

  document.addEventListener('input', function(e) {
    if (e.target && e.target.matches('[data-lp-editable]')) {
      parent.postMessage({ type: 'lp:text-change' }, '*');
    }
  }, true);

  // disable navigation while editing
  document.addEventListener('click', function(e) {
    var a = e.target.closest && e.target.closest('a');
    if (a) { e.preventDefault(); }
  });

  // Inject helper styles
  var style = document.createElement('style');
  style.textContent =
    '[data-lp-editable]:hover{outline:1px dashed #00E599;cursor:text;}' +
    '[data-lp-image]:hover{outline:2px dashed #00E599;cursor:pointer;}' +
    '[data-lp-active]{outline:2px solid #00E599 !important;outline-offset:2px;}';
  document.head.appendChild(style);

  function ready() {
    applyEditableMarks();
    parent.postMessage({ type: 'lp:ready' }, '*');
  }
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(ready, 50);
  } else {
    document.addEventListener('DOMContentLoaded', ready);
  }

  window.__lpExtract = function() {
    // clone, strip editor attrs, return HTML
    var clone = document.documentElement.cloneNode(true);
    clone.querySelectorAll('[data-lp-editable]').forEach(function(n){
      n.removeAttribute('data-lp-editable');
      n.removeAttribute('contenteditable');
      n.removeAttribute('spellcheck');
    });
    clone.querySelectorAll('[data-lp-image]').forEach(function(n){ n.removeAttribute('data-lp-image'); });
    clone.querySelectorAll('[data-lp-active]').forEach(function(n){ n.removeAttribute('data-lp-active'); });
    var styleEl = clone.querySelector('style[data-lp-style]');
    if (styleEl) styleEl.remove();
    var script = clone.querySelector('script[data-lp-script]');
    if (script) script.remove();
    var base = clone.querySelector('base[data-lp-base]');
    if (base) base.remove();
    return '<!doctype html>\\n' + clone.outerHTML;
  };
})();
<\\/script>
`;

export default function VisualEditor() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [files, setFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [iframeSrc, setIframeSrc] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewport, setViewport] = useState("desktop");
  const [selectedImg, setSelectedImg] = useState(null);
  const iframeRef = useRef(null);
  const imgInputRef = useRef(null);

  const baseUrl = `${API_URL}/sites/${project?.slug || ""}/`;

  const loadIframe = useCallback(async (rel) => {
    if (!project) return;
    const path = encodeURIComponent(rel).replace(/%2F/g, "/");
    const { data } = await api.get(`/projects/${projectId}/files/${path}/content`, { responseType: "text" });
    // inject base + editor script
    const baseTag = `<base href="${baseUrl}" data-lp-base="1">`;
    let html = String(data);
    if (/<head[^>]*>/i.test(html)) {
      html = html.replace(/<head[^>]*>/i, m => m + baseTag);
    } else {
      html = `<head>${baseTag}</head>` + html;
    }
    html = html.replace(/<\/body>/i, EDITOR_SCRIPT + "</body>");
    setIframeSrc(html);
    setDirty(false);
  }, [project, projectId, baseUrl]);

  const load = useCallback(async () => {
    const [{ data: p }, { data: fs }] = await Promise.all([
      api.get(`/projects/${projectId}`),
      api.get(`/projects/${projectId}/files`),
    ]);
    setProject(p.project);
    setFiles(fs);
    const indexFile = fs.find(f => f.rel_path === "index.html") || fs.find(f => f.content_type === "text/html");
    if (indexFile) setActiveFile(indexFile.rel_path);
  }, [projectId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (activeFile && project) loadIframe(activeFile); }, [activeFile, project, loadIframe]);

  // Receive messages from iframe
  useEffect(() => {
    const onMsg = (e) => {
      if (!e.data || typeof e.data !== "object") return;
      if (e.data.type === "lp:text-change") setDirty(true);
      if (e.data.type === "lp:image-click") {
        setSelectedImg({ src: e.data.src });
      }
      if (e.data.type === "lp:text-focus") setSelectedImg(null);
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const save = async () => {
    if (!iframeRef.current?.contentWindow) return;
    setSaving(true);
    try {
      const html = iframeRef.current.contentWindow.__lpExtract?.();
      if (!html) throw new Error("Could not read iframe");
      const path = encodeURIComponent(activeFile).replace(/%2F/g, "/");
      await api.put(`/projects/${projectId}/files/${path}`, { content: html });
      toast.success("Saved");
      setDirty(false);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Save failed");
    } finally { setSaving(false); }
  };

  const replaceImage = async (file) => {
    if (!file || !selectedImg) return;
    // Find file in project list — match by trailing src path
    const src = selectedImg.src.replace(baseUrl, "").replace(/^\.?\//, "");
    const target = files.find(f => f.rel_path === src || src.endsWith(f.rel_path));
    if (!target) {
      toast.error("Image not part of this project");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const path = encodeURIComponent(target.rel_path).replace(/%2F/g, "/");
      await api.post(`/projects/${projectId}/files/${path}/replace-image`, fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Image replaced");
      // cache-bust by reloading iframe content (browser may cache the img)
      await loadIframe(activeFile);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Replace failed");
    } finally { setSaving(false); }
  };

  if (!project) return <div className="min-h-screen bg-[#050505] text-zinc-400 text-sm flex items-center justify-center">Loading editor…</div>;

  const htmlFiles = files.filter(f => f.content_type === "text/html");
  const imageFiles = files.filter(f => f.content_type?.startsWith("image/"));
  const Viewport = VIEWPORTS[viewport];
  const VPI = Viewport.icon;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
      {/* Toolbar */}
      <header className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-[#050505]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/projects/${projectId}`)} className="text-zinc-400 hover:text-white inline-flex items-center gap-2 text-sm">
            <ArrowLeft size={14}/> Back
          </button>
          <div className="h-5 w-px bg-white/10"/>
          <div className="text-sm">
            <span className="text-zinc-500">Editing</span> <span className="font-medium">{project.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 border border-white/10 rounded-md p-1">
          {Object.entries(VIEWPORTS).map(([k, v]) => {
            const I = v.icon;
            return (
              <button key={k} onClick={()=>setViewport(k)}
                data-testid={`viewport-${k}`}
                className={"px-2 py-1 rounded inline-flex items-center gap-1 text-xs " + (viewport === k ? "bg-white text-black" : "text-zinc-400 hover:text-white")}>
                <I size={12}/> {v.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <a href={baseUrl} target="_blank" rel="noreferrer" className="btn-secondary text-sm">Preview live</a>
          <button onClick={save} disabled={!dirty || saving}
            data-testid="editor-save-btn"
            className="btn-primary inline-flex items-center gap-2 text-sm">
            {saving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>}
            {saving ? "Saving…" : (dirty ? "Save changes" : "Saved")}
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Left sidebar — file list */}
        <aside className="w-60 border-r border-white/10 bg-[#0A0A0A] flex flex-col">
          <div className="px-4 py-3 text-xs text-zinc-500 uppercase tracking-wide">Pages</div>
          <div className="flex-1 overflow-auto">
            {htmlFiles.map(f => (
              <button key={f.rel_path}
                onClick={()=>setActiveFile(f.rel_path)}
                data-testid={`editor-file-${f.rel_path}`}
                className={"w-full text-left px-4 py-2.5 flex items-center gap-2 text-sm " + (activeFile === f.rel_path ? "bg-white/10 text-white" : "text-zinc-400 hover:bg-white/5")}>
                <FileCode size={13}/> <span className="truncate">{f.rel_path}</span>
              </button>
            ))}
            <div className="px-4 py-3 text-xs text-zinc-500 uppercase tracking-wide mt-2 border-t border-white/10">Images</div>
            {imageFiles.map(f => (
              <div key={f.rel_path}
                className="px-4 py-2 flex items-center gap-2 text-xs text-zinc-500">
                <ImageIcon size={11}/> <span className="truncate">{f.rel_path}</span>
              </div>
            ))}
            {imageFiles.length === 0 && (
              <div className="px-4 py-2 text-xs text-zinc-600 italic">No images</div>
            )}
          </div>
          <div className="border-t border-white/10 p-3 text-xs text-zinc-500 leading-relaxed">
            <Type size={12} className="inline mr-1"/> Click any text to edit. Click an image to replace it.
          </div>
        </aside>

        {/* Canvas */}
        <main className="flex-1 min-w-0 flex items-start justify-center overflow-auto bg-[#050505] p-6">
          <div className="bg-white border border-white/10 transition-all duration-300 shadow-2xl"
               style={{ width: Viewport.w, maxWidth: "100%", height: "calc(100vh - 120px)" }}>
            {iframeSrc ? (
              <iframe ref={iframeRef} title="editor" sandbox="allow-same-origin allow-scripts allow-forms"
                srcDoc={iframeSrc} className="w-full h-full"/>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-400 text-sm">
                Select an HTML file to start editing
              </div>
            )}
          </div>
        </main>

        {/* Right sidebar — image replace panel */}
        {selectedImg && (
          <aside className="w-72 border-l border-white/10 bg-[#0A0A0A] p-5">
            <div className="text-xs text-zinc-500 uppercase tracking-wide mb-3">Selected image</div>
            <div className="border border-white/10 p-3 bg-[#050505] rounded">
              <img src={selectedImg.src} alt="" className="max-w-full max-h-40 mx-auto"/>
            </div>
            <button
              onClick={()=>imgInputRef.current?.click()}
              className="btn-primary w-full mt-4 inline-flex items-center justify-center gap-2 text-sm">
              <ImageIcon size={14}/> Replace image
            </button>
            <input ref={imgInputRef} type="file" accept="image/*" className="hidden"
              onChange={e=>replaceImage(e.target.files?.[0])} />
            <p className="text-xs text-zinc-500 mt-3 leading-relaxed">
              The new image keeps the same filename, so other pages that reference it update automatically.
            </p>
          </aside>
        )}
      </div>
    </div>
  );
}
