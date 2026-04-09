function buildReloadScript(version) {
  return `<script>(function(){var currentVersion=${JSON.stringify(version)};var pollTimer=null;var reconnectTimer=null;function clearPolling(){if(!pollTimer){return;}window.clearInterval(pollTimer);pollTimer=null;}function applyVersion(nextVersion){if(typeof nextVersion!=='number'){return;}if(nextVersion!==currentVersion){currentVersion=nextVersion;window.location.reload();return;}currentVersion=nextVersion;}function handlePayload(rawPayload){try{var payload=typeof rawPayload==='string'?JSON.parse(rawPayload):rawPayload||{};applyVersion(payload.version);}catch(error){window.location.reload();}}async function poll(){try{var response=await fetch('/__lidex/reload',{cache:'no-store',headers:{'cache-control':'no-cache'}});if(!response.ok){return;}handlePayload(await response.json());}catch(error){}}function ensurePolling(){if(pollTimer){return;}pollTimer=window.setInterval(function(){void poll();},1000);void poll();}function connect(){if(typeof window.EventSource!=='function'){ensurePolling();return;}var source=new window.EventSource('/__lidex/events');source.onopen=function(){clearPolling();};source.addEventListener('reload',function(event){clearPolling();handlePayload(event.data);});source.onerror=function(){source.close();ensurePolling();if(reconnectTimer){return;}reconnectTimer=window.setTimeout(function(){reconnectTimer=null;connect();},600);};}connect();})();</script>`;
}

function injectReloadScript(html, version) {
  if (!Number.isFinite(version)) {
    return html;
  }

  const script = buildReloadScript(version);
  return html.includes('</body>')
    ? html.replace('</body>', `${script}</body>`)
    : `${html}${script}`;
}

module.exports = {
  injectReloadScript,
};
