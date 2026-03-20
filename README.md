## AIDCS (AI Display Control System)

AIDCS is a frontend AI control layer that scans the DOM, tags sections, builds an AI-ready registry/context, routes intent to specialized agents, and executes safe UI updates. It supports voice input, LLM fallback (Gemini), multi-agent orchestration, and developer overlays.

---

### Quick Start (React/SPA)
1) Install deps  
```bash
npm install
npm run build
```
2) Bootstrap in your app entry (e.g., `src/main.tsx`):  
```ts
import { bootstrapAIDCS } from "aidcs";
bootstrapAIDCS({ root: document.body })
  .then(rt => { (window as any).AIDCSRuntime = rt; })
  .catch(err => console.error("AIDCS bootstrap failed", err));
```
3) Mark key layout regions for deterministic targeting:  
```html
<header data-ai-sect="AI-Sect-1-HDR">...</header>
<nav data-ai-sect="AI-Sect-2-NAV">...</nav>
<main data-ai-sect="AI-Sect-4-DSP">...</main>
<aside data-ai-sect="AI-Sect-5-AIC">AI Panel</aside>
```
4) Enable dev overlay (default in config) and verify with hotkeys below.

---

### Dev Hotkeys
- **Alt+A** overlay on/off (section outlines/labels)  
- **Alt+S** inspector hover (shows `data-ai-sect` ID)  
- **Alt+E** Explorer (sections, agents, pipeline trace)  
- **Alt+D** Error panel (recent pipeline/hook errors)

---

### Agents (built-in behavior)
- **NavigationAgent**: handles `navigate_*` intents; matches speech/text to nav item text or `data-route-keywords`, uses `href`/`data-route`, falls back to env/default routes.  
- **ContentAgent**: summarizes page registry; snapshots to `User/<user_id>/pages/`; if content is missing, auto-calls Gemini and injects the response into the AI panel.  
- **AssistantAgent**: chat/assistant panel actions.  
- **AnalyticsAgent**: logs/navigation events.  
- **UIControllerAgent**: safe UI updates/injections.  
- **SupervisorAgent**: priority/conflict resolution and limits.

---

### Runtime Pipeline
1) Load configs (`index.json`, `config/index.json`, `config/environment.json`, agents/actions/intent/supervisor).  
2) Scan DOM → assign sections → build registry (`registry/.ai-dom-map.json`).  
3) Build page context (metadata + registry + DOM tree).  
4) Route intent → coordinate agents (permissions enforced early).  
5) Kernel batches/throttles actions; ActionEngine executes allowed DOM operations.

---

### Key Configs
- `config/index.json`: runtime scan depth, overlay toggle/keys, registry path, kernel, performance guard, voice.  
- `config/environment.json`: per-environment overrides (dev/staging/prod).  
- `config/agents/agents.json`: agent capabilities, allowed sections, priorities.  
- `config/agents/intent_map.json`: keywords → intent/agent/action/section (includes `navigate_*` intents).  
- `config/agents/action.json`: allowed actions and DOM operations.  
- `config/agents/supervisor.json`: orchestration limits and conflict rules.  
- `.env` (see `.env.example`): per-agent overrides (sections, priority, confidence), route overrides (`AIDCS_ROUTE_*`), `AIDCS_USER_ID`, `AIDCS_GEMINI_API_KEY`, voice/kernels/guard tweaks.

---

### Voice & LLM
- Voice: optional; enable in runtime config. `VoiceController` streams audio, sends to STT (`stt_endpoint`), then into `handleUserInput`.  
- LLM fallback: ContentAgent calls Gemini when registry is empty. Set `AIDCS_GEMINI_API_KEY` in `.env`. Responses are stored and injected into the AI panel.

---

### Performance & Safety
- **Kernel** (`config/index.json`): batch_size, throttle, coalesce_sections, adaptive_throttle; can cancel to prevent DOM churn.  
- **Performance guard**: trips after `error_threshold`; can disable actions/overlay to protect UX.  
- **Safety rules**: only whitelisted action categories run; forbidden DOM mutations are blocked in ActionEngine.

---

### Storage
- Snapshots: `User/<user_id>/pages/page-<timestamp>.json` (Node/Electron).  
  Contains metadata, intent, user_input, registry, `needs_llm`, and `llm_prompt/llm_response` when used.

---

### Deployment Notes
- Browser-only builds must bundle or serve `config/` JSONs (filesystem access is Node-only).  
- LLM/STT require outbound HTTPS and valid API keys.  
- Stable `data-ai-sect` IDs make agent permissions and routing deterministic.

---

### Verify Integration
- Overlay toggles with Alt+A; `window.AIDCSRuntime` is defined.  
- `window.AIDCSRuntime.getTrace()` shows pipeline stages.  
- Running `window.AIDCSRuntime.handleUserInput("summarize page")` executes actions and, if content exists, updates the AI panel.

